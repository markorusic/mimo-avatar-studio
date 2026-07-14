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
  "encouraging",
  "explaining",
  "curious",
  "celebrating",
  "focused",
  "reassuring",
  "impressed",
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
    assert.match(error.stderr, /Choose at least one character with --character <id>/);
    assert.match(error.stderr, /leonardo, sage, socrates, tesla/);
    return true;
  });
});

test("installer adds multiple named character guides atomically and is idempotent", async (context) => {
  const fixture = await createShadcnFixture();
  context.after(() => rm(fixture, { recursive: true, force: true }));

  const firstRun = await execFileAsync(process.execPath, [
    installer,
    "add",
    fixture,
    "--character",
    "sage",
    "--character",
    "tesla",
  ]);
  assert.match(firstRun.stdout, /Mimo Guide is ready/);
  assert.match(firstRun.stdout, /import \{ SageGuide \} from/);
  assert.match(firstRun.stdout, /characters\/sage-guide/);
  assert.match(firstRun.stdout, /<SageGuide expression="thinking"/);
  assert.match(firstRun.stdout, /import \{ TeslaGuide \} from/);
  assert.match(firstRun.stdout, /characters\/tesla-guide/);
  assert.match(firstRun.stdout, /<TeslaGuide expression="thinking"/);
  assert.match(firstRun.stdout, /Installed characters: sage, tesla/);

  await Promise.all([
    access(path.join(fixture, "src", "components", "mimo-guide", "mimo-guide.tsx")),
    access(path.join(fixture, "src", "components", "mimo-guide", "mimo-guide.module.css")),
    access(path.join(fixture, "src", "components", "mimo-guide", "guide-character.ts")),
    access(path.join(fixture, "src", "components", "mimo-guide", "index.ts")),
    access(path.join(fixture, "src", "components", "mimo-guide", "characters", "sage-guide.tsx")),
    access(path.join(fixture, "src", "components", "mimo-guide", "characters", "tesla-guide.tsx")),
    access(path.join(fixture, ".mimo-guide", "manifest.json")),
    ...["sage", "tesla"].flatMap((character) =>
      expressions.map((expression) =>
        access(path.join(fixture, "public", "mimo-guides", character, `${expression}.webp`)),
      ),
    ),
  ]);
  await Promise.all([
    assert.rejects(access(path.join(fixture, "public", "mimo-guides", "socrates", "idle.webp"))),
    assert.rejects(access(path.join(fixture, "public", "mimo-guides", "leonardo", "idle.webp"))),
  ]);

  const installedComponent = await readFile(
    path.join(fixture, "src", "components", "mimo-guide", "mimo-guide.tsx"),
    "utf8",
  );
  assert.match(installedComponent, /expressionShiftCooldown/);
  assert.doesNotMatch(installedComponent, /export default/);

  const sageGuide = await readFile(
    path.join(fixture, "src", "components", "mimo-guide", "characters", "sage-guide.tsx"),
    "utf8",
  );
  assert.match(sageGuide, /export const sageCharacter/);
  assert.match(sageGuide, /export function SageGuide/);
  assert.doesNotMatch(sageGuide, /export default/);

  const manifest = JSON.parse(
    await readFile(path.join(fixture, ".mimo-guide", "manifest.json"), "utf8"),
  );
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.coreApiVersion, 1);
  assert.deepEqual(manifest.characters, ["sage", "tesla"]);

  const secondRun = await execFileAsync(process.execPath, [
    installer,
    "add",
    fixture,
    "--character",
    "sage",
    "--character",
    "tesla",
  ]);
  assert.match(secondRun.stdout, /Mimo Guide was already up to date/);
  assert.doesNotMatch(secondRun.stdout, /create|replace/);
});

test("adding another character preserves edited shared core and existing character files", async (context) => {
  const fixture = await createShadcnFixture();
  context.after(() => rm(fixture, { recursive: true, force: true }));
  await execFileAsync(process.execPath, [installer, "add", fixture, "--character", "sage"]);

  const componentPath = path.join(fixture, "src", "components", "mimo-guide", "mimo-guide.tsx");
  const sageGuidePath = path.join(
    fixture,
    "src",
    "components",
    "mimo-guide",
    "characters",
    "sage-guide.tsx",
  );
  const coreEdit = "// local consumer core edit\n";
  const sageEdit = "// local Sage edit\n";
  await Promise.all([writeFile(componentPath, coreEdit), writeFile(sageGuidePath, sageEdit)]);

  const addTesla = await execFileAsync(process.execPath, [
    installer,
    "add",
    fixture,
    "--character",
    "tesla",
  ]);
  assert.match(addTesla.stdout, /Installed character: tesla/);
  assert.equal(await readFile(componentPath, "utf8"), coreEdit);
  assert.equal(await readFile(sageGuidePath, "utf8"), sageEdit);
  await access(
    path.join(fixture, "src", "components", "mimo-guide", "characters", "tesla-guide.tsx"),
  );
});

test("installer scopes conflicts to the selected character", async (context) => {
  const fixture = await createShadcnFixture();
  context.after(() => rm(fixture, { recursive: true, force: true }));
  const installSage = [installer, "add", fixture, "--character", "sage"];
  await execFileAsync(process.execPath, installSage);

  const sageGuidePath = path.join(
    fixture,
    "src",
    "components",
    "mimo-guide",
    "characters",
    "sage-guide.tsx",
  );
  await writeFile(sageGuidePath, "// local Sage edit\n");

  await assert.rejects(
    execFileAsync(process.execPath, [...installSage, "--character", "tesla"]),
    (error) => {
      assert.match(error.stderr, /Installation stopped before writing/);
      assert.match(error.stderr, /characters\/sage-guide\.tsx/);
      assert.match(error.stderr, /--force/);
      return true;
    },
  );
  assert.equal(await readFile(sageGuidePath, "utf8"), "// local Sage edit\n");
  await assert.rejects(
    access(path.join(fixture, "src", "components", "mimo-guide", "characters", "tesla-guide.tsx")),
  );

  await execFileAsync(process.execPath, [...installSage, "--force"]);
  assert.match(await readFile(sageGuidePath, "utf8"), /export function SageGuide/);
});
