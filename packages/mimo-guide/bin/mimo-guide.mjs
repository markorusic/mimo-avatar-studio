#!/usr/bin/env node

import { constants } from "node:fs";
import { access, copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
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
  "encouraging",
  "explaining",
  "curious",
  "celebrating",
  "focused",
  "reassuring",
  "impressed",
];
const CORE_FILES = ["mimo-guide.tsx", "mimo-guide.module.css", "guide-character.ts", "index.ts"];
const CORE_API_VERSION = 1;
const MANIFEST_SCHEMA_VERSION = 1;
const MANIFEST_PATH = ".mimo-guide/manifest.json";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function printHelp() {
  console.log(`
Mimo Guide installer

Usage:
  mimo-guide add [project] --character <id> [--character <id> ...] [options]

Options:
  --character <id>        Character to install (repeatable, required)
  --component-dir <path>  Component destination relative to the project
  --public-dir <path>     Public folder relative to the project (default: public)
  --dry-run               Show what would change without writing files
  --force                 Replace conflicting selected-character files
  -h, --help              Show this help

Examples:
  mimo-guide add . --character sage
  mimo-guide add . --character sage --character tesla
  mimo-guide add ../my-app --character tesla --dry-run
  mimo-guide add . --character socrates --component-dir src/components/mimo-guide
`);
}

function parseArgs(argv) {
  const args = [...argv];
  if (args[0] === "add") args.shift();
  if (args.includes("--help") || args.includes("-h")) return { help: true };

  const options = {
    target: undefined,
    characters: [],
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
    } else if (
      argument === "--character" ||
      argument === "--component-dir" ||
      argument === "--public-dir"
    ) {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${argument} requires a value.`);
      }
      if (argument === "--character") options.characters.push(value);
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
    let withoutComments = "";
    let inString = false;
    let escaped = false;

    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      const nextCharacter = source[index + 1];

      if (inString) {
        withoutComments += character;
        if (escaped) {
          escaped = false;
        } else if (character === "\\") {
          escaped = true;
        } else if (character === '"') {
          inString = false;
        }
        continue;
      }

      if (character === '"') {
        inString = true;
        withoutComments += character;
        continue;
      }

      if (character === "/" && nextCharacter === "/") {
        withoutComments += "  ";
        index += 2;
        while (index < source.length && source[index] !== "\n" && source[index] !== "\r") {
          withoutComments += " ";
          index += 1;
        }
        index -= 1;
        continue;
      }

      if (character === "/" && nextCharacter === "*") {
        withoutComments += "  ";
        index += 2;
        while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
          withoutComments += source[index] === "\n" || source[index] === "\r" ? source[index] : " ";
          index += 1;
        }
        if (index < source.length) {
          withoutComments += "  ";
          index += 1;
        }
        continue;
      }

      withoutComments += character;
    }

    withoutComments = withoutComments.replace(/,\s*([}\]])/g, "$1");
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
    const sourceRoot = (await exists(path.join(projectRoot, "src"))) ? "src" : ".";
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
        directory: path.join(componentsRoot, "mimo-guide"),
        importPath: `${componentsAlias.replace(/\/$/, "")}/mimo-guide`,
      };
    }
  }

  const hasSourceDirectory = await exists(path.join(projectRoot, "src"));
  return {
    directory: path.join(projectRoot, hasSourceDirectory ? "src" : "", "components", "mimo-guide"),
    importPath: hasSourceDirectory ? "./components/mimo-guide" : "@/components/mimo-guide",
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

function componentName(characterId) {
  return `${characterId
    .split("-")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join("")}Guide`;
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
    console.warn(
      "Warning: React is not listed in this package. The files will still be installed.",
    );
  }

  const component = await resolveComponentDestination(projectRoot, options.componentDir);
  const manifestPath = path.join(projectRoot, MANIFEST_PATH);
  const installedManifest = await readJson(manifestPath);
  const componentDirectory = relativePath(projectRoot, component.directory);
  const publicDirectory = relativePath(projectRoot, path.resolve(projectRoot, options.publicDir));

  if (installedManifest) {
    if (
      installedManifest.schemaVersion !== MANIFEST_SCHEMA_VERSION ||
      installedManifest.coreApiVersion !== CORE_API_VERSION
    ) {
      throw new Error(
        `The installed Mimo Guide runtime is not compatible with this installer. Upgrade the shared runtime explicitly before adding characters.`,
      );
    }
    if (
      installedManifest.componentDirectory !== componentDirectory ||
      installedManifest.publicDirectory !== publicDirectory
    ) {
      throw new Error(
        `This project already installs Mimo Guide in ${installedManifest.componentDirectory} with assets in ${installedManifest.publicDirectory}. Use the same component and public directories when adding characters.`,
      );
    }
  }

  const packageAssetsDirectory = path.join(PACKAGE_ROOT, "assets");
  const characterIds = (await readdir(packageAssetsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (!options.characters.length) {
    throw new Error(
      `Choose at least one character with --character <id>. Available: ${characterIds.join(", ")}`,
    );
  }
  const selectedCharacters = [...new Set(options.characters)];
  for (const selectedCharacter of selectedCharacters) {
    if (!characterIds.includes(selectedCharacter)) {
      throw new Error(
        `Unknown character "${selectedCharacter}". Available: ${characterIds.join(", ")}`,
      );
    }

    const selectedCharacterModule = path.join(
      PACKAGE_ROOT,
      "src",
      "characters",
      `${selectedCharacter}-guide.tsx`,
    );
    if (!(await exists(selectedCharacterModule))) {
      throw new Error(`Character "${selectedCharacter}" is missing its guide module.`);
    }
  }

  const coreOperations = CORE_FILES.map((name) => ({
    source: path.join(PACKAGE_ROOT, "src", name),
    destination: path.join(component.directory, name),
  }));
  const characterOperations = selectedCharacters.flatMap((selectedCharacter) => [
    {
      source: path.join(PACKAGE_ROOT, "src", "characters", `${selectedCharacter}-guide.tsx`),
      destination: path.join(component.directory, "characters", `${selectedCharacter}-guide.tsx`),
    },
    ...EXPRESSIONS.map((expression) => ({
      source: path.join(packageAssetsDirectory, selectedCharacter, `${expression}.webp`),
      destination: path.resolve(
        projectRoot,
        options.publicDir,
        "mimo-guides",
        selectedCharacter,
        `${expression}.webp`,
      ),
    })),
  ]);

  const missingCoreOperations = installedManifest
    ? (
        await Promise.all(
          coreOperations.map(async (operation) => ({
            operation,
            exists: await exists(operation.destination),
          })),
        )
      )
        .filter(({ exists: destinationExists }) => !destinationExists)
        .map(({ operation }) => operation)
    : coreOperations;
  const plannedOperations = [...missingCoreOperations, ...characterOperations];
  const states = await Promise.all(
    plannedOperations.map(async (operation) => ({
      ...operation,
      exists: await exists(operation.destination),
      matches: await filesMatch(operation.source, operation.destination),
    })),
  );
  const conflicts = states.filter((operation) => operation.exists && !operation.matches);

  if (conflicts.length && !options.force) {
    const conflictList = conflicts
      .map((operation) => `  - ${relativePath(projectRoot, operation.destination)}`)
      .join("\n");
    throw new Error(
      `Installation stopped before writing because these files already differ:\n${conflictList}\n\nRe-run with --force to replace only the selected character files${installedManifest ? "" : " and adopt the current shared runtime"}.`,
    );
  }

  const installedCharacters = Array.isArray(installedManifest?.characters)
    ? installedManifest.characters.filter((character) => typeof character === "string")
    : [];
  const nextManifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    coreApiVersion: CORE_API_VERSION,
    componentDirectory,
    publicDirectory,
    characters: [...new Set([...installedCharacters, ...selectedCharacters])].sort(),
  };
  const manifestNeedsWrite =
    !installedManifest || JSON.stringify(installedManifest) !== JSON.stringify(nextManifest);
  const pending = states.filter((operation) => !operation.matches);
  console.log(`${options.dryRun ? "Would install" : "Installing"} Mimo Guide in ${projectRoot}`);

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

  if (manifestNeedsWrite) {
    console.log(`  ${installedManifest ? "update   " : "create   "} ${MANIFEST_PATH}`);
    if (!options.dryRun) {
      await mkdir(path.dirname(manifestPath), { recursive: true });
      await writeFile(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`);
    }
  }

  console.log(
    `\n${options.dryRun ? "Dry run complete" : pending.length || manifestNeedsWrite ? "Mimo Guide is ready" : "Mimo Guide was already up to date"}.`,
  );
  console.log("\nUse the installed guides like this:\n");
  const guideImportRoot = component.importPath ?? relativePath(projectRoot, component.directory);
  for (const selectedCharacter of selectedCharacters) {
    const guideComponentName = componentName(selectedCharacter);
    console.log(
      `import { ${guideComponentName} } from "${guideImportRoot}/characters/${selectedCharacter}-guide";`,
    );
    console.log(`\n<${guideComponentName} expression="thinking" />\n`);
  }
  console.log(
    `Installed ${selectedCharacters.length === 1 ? "character" : "characters"}: ${selectedCharacters.join(", ")}`,
  );
  console.log(`\nAvailable expressions: ${EXPRESSIONS.join(", ")}`);
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
  } else {
    await install(options);
  }
} catch (error) {
  console.error(`\nMimo Guide: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
