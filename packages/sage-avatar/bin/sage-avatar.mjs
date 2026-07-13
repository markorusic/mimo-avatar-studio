#!/usr/bin/env node

import { constants } from "node:fs";
import {
  access,
  copyFile,
  mkdir,
  readFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXPRESSIONS = [
  "idle",
  "happy",
  "listening",
  "thinking",
  "surprised",
  "sad",
  "angry",
  "sleepy",
];

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function printHelp() {
  console.log(`
Sage Avatar installer

Usage:
  sage-avatar add [project] [options]

Options:
  --component-dir <path>  Component destination relative to the project
  --public-dir <path>     Public folder relative to the project (default: public)
  --dry-run               Show what would change without writing files
  --force                 Replace conflicting Sage Avatar files
  -h, --help              Show this help

Examples:
  sage-avatar add .
  sage-avatar add ../my-app --dry-run
  sage-avatar add . --component-dir src/components/sage-avatar
`);
}

function parseArgs(argv) {
  const args = [...argv];
  if (args[0] === "add") args.shift();
  if (args.includes("--help") || args.includes("-h")) return { help: true };

  const options = {
    target: undefined,
    componentDir: undefined,
    publicDir: "public",
    dryRun: false,
    force: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--dry-run") {
      options.dryRun = true;
    } else if (argument === "--force") {
      options.force = true;
    } else if (argument === "--component-dir" || argument === "--public-dir") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${argument} requires a path.`);
      }
      if (argument === "--component-dir") options.componentDir = value;
      if (argument === "--public-dir") options.publicDir = value;
      index += 1;
    } else if (argument.startsWith("-")) {
      throw new Error(`Unknown option: ${argument}`);
    } else if (!options.target) {
      options.target = argument;
    } else {
      throw new Error(`Unexpected argument: ${argument}`);
    }
  }

  options.target ??= ".";
  return options;
}

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function parseJsonWithComments(source) {
  try {
    return JSON.parse(source);
  } catch {
    const withoutComments = source
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(withoutComments);
  }
}

async function readJson(filePath) {
  if (!(await exists(filePath))) return undefined;
  return parseJsonWithComments(await readFile(filePath, "utf8"));
}

async function resolveAlias(projectRoot, alias) {
  if (alias.startsWith("./") || alias.startsWith("../")) {
    return path.resolve(projectRoot, alias);
  }

  for (const configName of ["tsconfig.json", "jsconfig.json"]) {
    const config = await readJson(path.join(projectRoot, configName));
    const compilerOptions = config?.compilerOptions;
    if (!compilerOptions?.paths) continue;

    for (const [pattern, targets] of Object.entries(compilerOptions.paths)) {
      const wildcardIndex = pattern.indexOf("*");
      const prefix = wildcardIndex === -1 ? pattern : pattern.slice(0, wildcardIndex);
      if (!alias.startsWith(prefix) || !Array.isArray(targets) || !targets[0]) continue;

      const remainder = alias.slice(prefix.length);
      const targetPattern = String(targets[0]);
      const resolvedTarget = targetPattern.includes("*")
        ? targetPattern.replace("*", remainder)
        : targetPattern;
      return path.resolve(projectRoot, compilerOptions.baseUrl ?? ".", resolvedTarget);
    }
  }

  if (alias.startsWith("@/") || alias.startsWith("~/")) {
    const relativeAlias = alias.slice(2);
    const sourceRoot = await exists(path.join(projectRoot, "src")) ? "src" : ".";
    return path.resolve(projectRoot, sourceRoot, relativeAlias);
  }

  return undefined;
}

async function resolveComponentDestination(projectRoot, override) {
  if (override) {
    return {
      directory: path.resolve(projectRoot, override),
      importPath: undefined,
    };
  }

  const shadcnConfig = await readJson(path.join(projectRoot, "components.json"));
  const componentsAlias = shadcnConfig?.aliases?.components;
  if (typeof componentsAlias === "string") {
    const componentsRoot = await resolveAlias(projectRoot, componentsAlias);
    if (componentsRoot) {
      return {
        directory: path.join(componentsRoot, "sage-avatar"),
        importPath: `${componentsAlias.replace(/\/$/, "")}/sage-avatar`,
      };
    }
  }

  const hasSourceDirectory = await exists(path.join(projectRoot, "src"));
  return {
    directory: path.join(projectRoot, hasSourceDirectory ? "src" : "", "components", "sage-avatar"),
    importPath: hasSourceDirectory ? "./components/sage-avatar" : "@/components/sage-avatar",
  };
}

async function filesMatch(source, destination) {
  if (!(await exists(destination))) return false;
  const [sourceBytes, destinationBytes] = await Promise.all([
    readFile(source),
    readFile(destination),
  ]);
  return sourceBytes.equals(destinationBytes);
}

function relativePath(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

async function install(options) {
  const projectRoot = path.resolve(options.target);
  const packageJsonPath = path.join(projectRoot, "package.json");

  if (!(await exists(packageJsonPath))) {
    throw new Error(`No package.json found in ${projectRoot}`);
  }

  const packageJson = await readJson(packageJsonPath);
  const dependencies = {
    ...packageJson?.dependencies,
    ...packageJson?.devDependencies,
    ...packageJson?.peerDependencies,
  };
  if (!dependencies.react) {
    console.warn("Warning: React is not listed in this package. The files will still be installed.");
  }

  const component = await resolveComponentDestination(projectRoot, options.componentDir);
  const assetsDirectory = path.resolve(projectRoot, options.publicDir, "avatars", "sage");
  const operations = [
    ...["sage-avatar.tsx", "sage-avatar.module.css", "index.ts"].map((name) => ({
      source: path.join(PACKAGE_ROOT, "src", name),
      destination: path.join(component.directory, name),
    })),
    ...EXPRESSIONS.map((expression) => ({
      source: path.join(PACKAGE_ROOT, "assets", `${expression}.webp`),
      destination: path.join(assetsDirectory, `${expression}.webp`),
    })),
  ];

  const states = await Promise.all(operations.map(async (operation) => ({
    ...operation,
    exists: await exists(operation.destination),
    matches: await filesMatch(operation.source, operation.destination),
  })));
  const conflicts = states.filter((operation) => operation.exists && !operation.matches);

  if (conflicts.length && !options.force) {
    const conflictList = conflicts
      .map((operation) => `  - ${relativePath(projectRoot, operation.destination)}`)
      .join("\n");
    throw new Error(
      `Installation stopped before writing because these files already differ:\n${conflictList}\n\nRe-run with --force to replace only the Sage Avatar files.`,
    );
  }

  const pending = states.filter((operation) => !operation.matches);
  console.log(`${options.dryRun ? "Would install" : "Installing"} Sage Avatar in ${projectRoot}`);

  for (const operation of states) {
    const destination = relativePath(projectRoot, operation.destination);
    if (operation.matches) {
      console.log(`  unchanged  ${destination}`);
      continue;
    }
    console.log(`  ${operation.exists ? "replace  " : "create   "} ${destination}`);
    if (!options.dryRun) {
      await mkdir(path.dirname(operation.destination), { recursive: true });
      await copyFile(operation.source, operation.destination);
    }
  }

  console.log(`\n${options.dryRun ? "Dry run complete" : pending.length ? "Sage Avatar is ready" : "Sage Avatar was already up to date"}.`);
  console.log("\nUse it like this:\n");
  console.log(`import { SageAvatar, type SageExpression } from "${component.importPath ?? relativePath(projectRoot, component.directory)}";`);
  console.log("\n<SageAvatar expression=\"thinking\" />");
  console.log("\nAvailable expressions: " + EXPRESSIONS.join(", "));
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
  } else {
    await install(options);
  }
} catch (error) {
  console.error(`\nSage Avatar: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
