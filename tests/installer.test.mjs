import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, "..");
const installer = path.join(projectRoot, "packages", "mimo-guide", "bin", "mimo-guide.mjs");
const expressions = [
  "idle",
  "happy",
  "listening",
  "thinking",
  "surprised",
  "sad",
  "angry",
  "sleepy",
];

async function createShadcnFixture() {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "mimo-guide-shadcn-"));
  await mkdir(path.join(fixture, "src"), { recursive: true });
  await Promise.all([
    writeFile(
      path.join(fixture, "package.json"),
      JSON.stringify({ dependencies: { react: "^19.0.0" } }),
    ),
    writeFile(
      path.join(fixture, "components.json"),
      `{
        // shadcn aliases
        "aliases": {
          /* Install into the existing component root. */
          "components": "@/components",
        },
      }`,
    ),
    writeFile(
      path.join(fixture, "tsconfig.json"),
      `{
        "compilerOptions": {
          /* Resolve application imports. */
          "paths": {
            "@/*": ["./src/*"], // keep this alias
            "docs/*": ["https://example.com/docs/*"],
          },
        },
      }`,
    ),
  ]);
  return fixture;
}

test("installer requires an explicit character selection", async (context) => {
  const fixture = await createShadcnFixture();
  context.after(() => rm(fixture, { recursive: true, force: true }));

  await assert.rejects(execFileAsync(process.execPath, [installer, "add", fixture]), (error) => {
    assert.match(error.stderr, /Choose one character with --character <id>/);
    assert.match(error.stderr, /leonardo, sage, socrates, tesla/);
    return true;
  });
});

test("installer copies only the selected character and is idempotent", async (context) => {
  const fixture = await createShadcnFixture();
  context.after(() => rm(fixture, { recursive: true, force: true }));

  const firstRun = await execFileAsync(process.execPath, [
    installer,
    "add",
    fixture,
    "--character",
    "tesla",
  ]);
  assert.match(firstRun.stdout, /Mimo Guide is ready/);
  assert.match(firstRun.stdout, /from "@\/components\/mimo-guide"/);
  assert.match(firstRun.stdout, /import guideCharacter from/);
  assert.match(firstRun.stdout, /characters\/tesla/);
  assert.match(firstRun.stdout, /character=\{guideCharacter\}/);
  assert.match(firstRun.stdout, /Installed character: tesla/);

  await Promise.all([
    access(path.join(fixture, "src", "components", "mimo-guide", "mimo-guide.tsx")),
    access(path.join(fixture, "src", "components", "mimo-guide", "mimo-guide.module.css")),
    access(path.join(fixture, "src", "components", "mimo-guide", "guide-character.ts")),
    access(path.join(fixture, "src", "components", "mimo-guide", "index.ts")),
    access(path.join(fixture, "src", "components", "mimo-guide", "characters", "tesla.ts")),
    ...expressions.map((expression) =>
      access(path.join(fixture, "public", "mimo-guides", "tesla", `${expression}.webp`)),
    ),
  ]);
  await Promise.all([
    assert.rejects(
      access(path.join(fixture, "src", "components", "mimo-guide", "characters", "sage.ts")),
    ),
    assert.rejects(access(path.join(fixture, "public", "mimo-guides", "sage", "idle.webp"))),
    assert.rejects(access(path.join(fixture, "public", "mimo-guides", "socrates", "idle.webp"))),
    assert.rejects(access(path.join(fixture, "public", "mimo-guides", "leonardo", "idle.webp"))),
  ]);

  const installedComponent = await readFile(
    path.join(fixture, "src", "components", "mimo-guide", "mimo-guide.tsx"),
    "utf8",
  );
  assert.match(installedComponent, /expressionShiftCooldown/);

  const secondRun = await execFileAsync(process.execPath, [
    installer,
    "add",
    fixture,
    "--character",
    "tesla",
  ]);
  assert.match(secondRun.stdout, /Mimo Guide was already up to date/);
  assert.doesNotMatch(secondRun.stdout, /create|replace/);

  const addSocrates = await execFileAsync(process.execPath, [
    installer,
    "add",
    fixture,
    "--character",
    "socrates",
  ]);
  assert.match(addSocrates.stdout, /Installed character: socrates/);
  await Promise.all([
    access(path.join(fixture, "src", "components", "mimo-guide", "characters", "socrates.ts")),
    access(path.join(fixture, "public", "mimo-guides", "socrates", "idle.webp")),
  ]);
});

test("installer protects local edits until --force is explicit", async (context) => {
  const fixture = await createShadcnFixture();
  context.after(() => rm(fixture, { recursive: true, force: true }));
  const installSage = [installer, "add", fixture, "--character", "sage"];
  await execFileAsync(process.execPath, installSage);

  const componentPath = path.join(fixture, "src", "components", "mimo-guide", "mimo-guide.tsx");
  await writeFile(componentPath, "// local consumer edit\n");

  await assert.rejects(execFileAsync(process.execPath, installSage), (error) => {
    assert.match(error.stderr, /Installation stopped before writing/);
    assert.match(error.stderr, /--force/);
    return true;
  });
  assert.equal(await readFile(componentPath, "utf8"), "// local consumer edit\n");

  await execFileAsync(process.execPath, [...installSage, "--force"]);
  assert.match(await readFile(componentPath, "utf8"), /export function MimoGuide/);
});
