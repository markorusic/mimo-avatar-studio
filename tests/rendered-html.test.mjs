import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function readBuiltPage(name) {
  return readFile(new URL(`../.next/server/app/${name}.html`, import.meta.url), "utf8");
}

test("prerenders the Studio with public installation docs", async () => {
  const html = await readBuiltPage("index");
  assert.match(html, /<title>Mimo Avatar Studio<\/title>/i);
  assert.match(html, /LIVE AVATAR · SAGE/);
  assert.match(html, /\/avatars\/sage\/idle\.webp/);
  assert.match(html, /Send an expression/);
  assert.match(html, /expression-happy/);
  assert.match(html, /Bring Sage into your React app/);
  assert.match(html, /github:markorusic\/mimo-avatar-studio/);
  assert.match(html, /href="\/canvas"/);
  assert.match(html, /og-wizard\.png/);
  assert.doesNotMatch(html, /ONE WIZARD|EVERY FEELING/);
  assert.doesNotMatch(html, /Choose your avatar|character-nova|character-pip|character-moss/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("prerenders the interactive canvas example", async () => {
  const html = await readBuiltPage("canvas");
  assert.match(html, /<title>Sage Canvas · Mimo Avatar Studio<\/title>/i);
  assert.match(html, /Interactive integration example/);
  assert.match(html, /aria-label="Drawing canvas"/);
  assert.match(html, /Disable event pop animation/);
  assert.match(html, /href="\/"/);
});

test("ships every Sage expression sprite", async () => {
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

  await Promise.all(
    expressions.map((expression) =>
      access(new URL(`../public/avatars/sage/${expression}.webp`, import.meta.url)),
    ),
  );
});

test("keeps Sage avatar styles fully namespaced", async () => {
  const css = await readFile(
    new URL("../packages/sage-avatar/src/sage-avatar.module.css", import.meta.url),
    "utf8",
  );
  const classNames = [...css.matchAll(/\.([A-Za-z][A-Za-z0-9_-]*)/g)]
    .map((match) => match[1]);

  assert.ok(classNames.length > 0);
  assert.ok(classNames.every((className) => /^sage-avatar(?:-[a-z]+)+$/.test(className)));
  assert.match(css, /--sage-avatar-intensity/);
  assert.doesNotMatch(css, /--(?:intensity|avatar-)/);
  assert.doesNotMatch(css, /@keyframes\s+(?!sageAvatar)/);
});

test("keeps the distributable and demo sprite packs identical", async () => {
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

  for (const expression of expressions) {
    const [demoSprite, kitSprite] = await Promise.all([
      readFile(new URL(`../public/avatars/sage/${expression}.webp`, import.meta.url)),
      readFile(new URL(`../packages/sage-avatar/assets/${expression}.webp`, import.meta.url)),
    ]);
    assert.ok(demoSprite.equals(kitSprite), `${expression} sprite differs`);
  }
});
