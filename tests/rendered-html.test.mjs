import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function readBuiltPage(name) {
  return readFile(new URL(`../.next/server/app/${name}.html`, import.meta.url), "utf8");
}

test("prerenders the Studio with public installation docs", async () => {
  const html = await readBuiltPage("index");
  assert.match(html, /<title>Mimo Guide Studio<\/title>/i);
  assert.match(html, /LIVE GUIDE ·/);
  assert.match(html, /data-character="sage"/);
  assert.match(html, /\/mimo-guides\/sage\/idle\.webp/);
  assert.match(html, /Send an expression/);
  assert.match(html, /expression-happy/);
  assert.match(html, /character-socrates/);
  assert.match(html, /character-tesla/);
  assert.match(html, /character-leonardo/);
  assert.match(html, /Bring one guide into your React app/);
  assert.match(html, /--character/);
  assert.match(html, /aria-label="Copy shell code"/);
  assert.match(html, /aria-label="Copy tsx code"/);
  assert.match(html, /syntax-command/);
  assert.match(html, /syntax-keyword/);
  assert.match(html, /syntax-string/);
  assert.match(html, /STUDIO EVENT ADAPTER/);
  assert.match(html, /mimo-guide:expression/);
  assert.match(html, /github:markorusic\/mimo-avatar-studio/);
  assert.match(html, /href="\/canvas"/);
  assert.match(html, /og-wizard\.png/);
  assert.doesNotMatch(html, /ONE WIZARD|EVERY FEELING/);
  assert.doesNotMatch(html, /character-nova|character-pip|character-moss/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("prerenders the interactive canvas example", async () => {
  const html = await readBuiltPage("canvas");
  assert.match(html, /<title>Mimo Canvas · Guide Studio<\/title>/i);
  assert.match(html, /Interactive integration example/);
  assert.match(html, /aria-label="Drawing canvas"/);
  assert.match(html, /Disable event pop animation/);
  assert.match(html, /Canvas guide character/);
  assert.match(html, /Nikola Tesla/);
  assert.match(html, /href="\/"/);
});

test("ships every registered character expression sprite", async () => {
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

  await Promise.all(
    characters.flatMap((character) =>
      expressions.map((expression) =>
        access(new URL(`../public/mimo-guides/${character}/${expression}.webp`, import.meta.url)),
      ),
    ),
  );
});

test("keeps the public component entrypoint independent of the character catalog", async () => {
  const publicEntrypoint = await readFile(
    new URL("../packages/mimo-guide/src/index.ts", import.meta.url),
    "utf8",
  );

  assert.match(publicEntrypoint, /MimoGuide/);
  assert.match(publicEntrypoint, /GuideExpression/);
  assert.match(publicEntrypoint, /GuideCharacter/);
  assert.doesNotMatch(
    publicEntrypoint,
    /sageCharacter|socratesCharacter|teslaCharacter|leonardoCharacter|guideCharacters/,
  );
});

test("keeps Mimo Guide styles fully namespaced", async () => {
  const css = await readFile(
    new URL("../packages/mimo-guide/src/mimo-guide.module.css", import.meta.url),
    "utf8",
  );
  const classNames = [...css.matchAll(/\.([A-Za-z][A-Za-z0-9_-]*)/g)].map((match) => match[1]);

  assert.ok(classNames.length > 0);
  assert.ok(classNames.every((className) => /^mimo-guide(?:-[a-z]+)+$/.test(className)));
  assert.match(css, /--mimo-guide-intensity/);
  assert.doesNotMatch(css, /--(?:intensity|avatar-)/);
  assert.doesNotMatch(css, /@keyframes\s+(?!mimoGuide)/);
});

test("keeps the distributable and demo sprite packs identical", async () => {
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

  for (const character of characters) {
    for (const expression of expressions) {
      const [demoSprite, kitSprite] = await Promise.all([
        readFile(new URL(`../public/mimo-guides/${character}/${expression}.webp`, import.meta.url)),
        readFile(
          new URL(`../packages/mimo-guide/assets/${character}/${expression}.webp`, import.meta.url),
        ),
      ]);
      assert.ok(demoSprite.equals(kitSprite), `${character}/${expression} sprite differs`);
    }
  }
});
