import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html", host: "localhost" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Mimo expression studio", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Mimo — Multi-character Expression Avatar<\/title>/i);
  assert.match(html, /MANY FACES/);
  assert.match(html, /EVERY FEELING/);
  assert.match(html, /Choose your avatar/);
  assert.match(html, /character-nova/);
  assert.match(html, /character-pip/);
  assert.match(html, /character-moss/);
  assert.match(html, /character-sage/);
  assert.match(html, />Sage</);
  assert.match(html, /Send an expression/);
  assert.match(html, /expression-happy/);
  assert.match(html, /og-wizard\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
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
