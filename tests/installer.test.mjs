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
const characters = ["sage", "socrates", "tesla", "leonardo"];
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
      JSON.stringify({ aliases: { components: "@/components" } }),
    ),
    writeFile(
      path.join(fixture, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { paths: { "@/*": ["./src/*"] } } }),
    ),
  ]);
  return fixture;
}

test("installer detects shadcn aliases, copies sprites, and is idempotent", async (context) => {
  const fixture = await createShadcnFixture();
  context.after(() => rm(fixture, { recursive: true, force: true }));

  const firstRun = await execFileAsync(process.execPath, [installer, "add", fixture]);
  assert.match(firstRun.stdout, /Mimo Guide is ready/);
  assert.match(firstRun.stdout, /from "@\/components\/mimo-guide"/);
  assert.match(firstRun.stdout, /Installed characters: leonardo, sage, socrates, tesla/);

  await Promise.all([
    access(path.join(fixture, "src", "components", "mimo-guide", "mimo-guide.tsx")),
    access(path.join(fixture, "src", "components", "mimo-guide", "mimo-guide.module.css")),
    access(path.join(fixture, "src", "components", "mimo-guide", "characters.ts")),
    access(path.join(fixture, "src", "components", "mimo-guide", "index.ts")),
    ...characters.flatMap((character) =>
      expressions.map((expression) =>
        access(path.join(fixture, "public", "mimo-guides", character, `${expression}.webp`)),
      ),
    ),
  ]);

  const installedComponent = await readFile(
    path.join(fixture, "src", "components", "mimo-guide", "mimo-guide.tsx"),
    "utf8",
  );
  assert.match(installedComponent, /expressionShiftCooldown/);

  const secondRun = await execFileAsync(process.execPath, [installer, "add", fixture]);
  assert.match(secondRun.stdout, /Mimo Guide was already up to date/);
  assert.doesNotMatch(secondRun.stdout, /create|replace/);
});

test("installer protects local edits until --force is explicit", async (context) => {
  const fixture = await createShadcnFixture();
  context.after(() => rm(fixture, { recursive: true, force: true }));
  await execFileAsync(process.execPath, [installer, "add", fixture]);

  const componentPath = path.join(fixture, "src", "components", "mimo-guide", "mimo-guide.tsx");
  await writeFile(componentPath, "// local consumer edit\n");

  await assert.rejects(execFileAsync(process.execPath, [installer, "add", fixture]), (error) => {
    assert.match(error.stderr, /Installation stopped before writing/);
    assert.match(error.stderr, /--force/);
    return true;
  });
  assert.equal(await readFile(componentPath, "utf8"), "// local consumer edit\n");

  await execFileAsync(process.execPath, [installer, "add", fixture, "--force"]);
  assert.match(await readFile(componentPath, "utf8"), /export function MimoGuide/);
});
