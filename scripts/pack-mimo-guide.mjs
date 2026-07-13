import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await mkdir(path.join(projectRoot, "outputs"), { recursive: true });

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npmCli = process.env.npm_execpath;
const command = npmCli ? process.execPath : npmCommand;
const commandArguments = [
  ...(npmCli ? [npmCli] : []),
  "pack",
  "./packages/mimo-guide",
  "--pack-destination",
  "./outputs",
];
const result = spawnSync(command, commandArguments, {
  cwd: projectRoot,
  stdio: "inherit",
  shell: !npmCli && process.platform === "win32",
  env: {
    ...process.env,
    npm_config_cache: path.join(projectRoot, "work", "npm-cache"),
  },
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
