# Mimo Guide Studio

Mimo Guide is a registry-driven illustrated React character engine. It ships Sage,
Socrates, Nikola Tesla, and Leonardo da Vinci with eight animated expressions
each. This repository contains the expression Studio, the interactive canvas
integration example, and the copy-owned component kit.

The Studio runs on TanStack Start with file-based TanStack Router routes, Vite,
Tailwind CSS, and Nitro. Nitro prerenders the Studio and canvas while keeping the
project ready for server routes and server functions later.

- Studio: `/`
- Canvas example: `/canvas`
- Portable kit: `packages/mimo-guide`

## Run the demo

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Create and preview the production build locally:

```bash
npm run build
npm start
```

## Deploy the Studio

The repository is configured for Vercel's `tanstack-start` framework preset.
TanStack Start builds through Vite, and Nitro automatically selects its Vercel
output when `npm run build` runs inside Vercel.

```bash
vercel
vercel --prod
```

The committed `vercel.json` also overrides stale dashboard framework detection,
so an existing project previously configured for Next.js still builds as
TanStack Start.

## Add Mimo Guide to another React or shadcn project

Run the public installer from the root of any React project:

```bash
npx --yes github:markorusic/mimo-avatar-studio add . --character tesla
```

It installs:

- The reusable `MimoGuide` core in the project's component directory.
- `characters/tesla.ts` and only Tesla's eight WebP sprites in `public/mimo-guides/tesla`.
- No npm dependencies and no Tailwind configuration.

`--character` is required. Available values are `sage`, `socrates`, `tesla`,
and `leonardo`. Run the command again with another value when a project needs a
second character; the shared core remains unchanged.

If the target has a shadcn `components.json`, the installer resolves its
`aliases.components` setting through `tsconfig.json` or `jsconfig.json`.
Otherwise it uses `src/components/mimo-guide` for `src`-based apps and
`components/mimo-guide` for root-based apps.

The installer is safe to rerun. Identical files are left alone, and edited
files stop the entire operation before anything is written. Use `--force` only
when you intentionally want to replace Mimo Guide files.

```bash
npx --yes github:markorusic/mimo-avatar-studio add . --character sage --dry-run
npx --yes github:markorusic/mimo-avatar-studio add . --character sage --force
```

When working from a clone of this repository, the equivalent local command is:

```bash
npm run guide:add -- /path/to/your-react-app --character sage
```

### Portable one-file kit

Create a self-contained tarball that can be moved to another computer or repository:

```bash
npm run guide:pack
```

Then run it from the target project without an account or network access:

```bash
npm exec --yes --offline --package=/path/to/mimo-guide-0.1.0.tgz -- mimo-guide add . --character socrates
```

This is the shadcn-style distribution path for the illustrated guide roster.
The official shadcn registry format stores file contents as text, so it cannot
faithfully carry the eight binary WebP sprites in a single registry item. The
small installer preserves the same copy-and-own workflow while keeping the
images as efficient local assets rather than a CDN dependency.

### Copy/paste fallback

Copy these files from `packages/mimo-guide`:

```text
src/mimo-guide.tsx
src/mimo-guide.module.css
src/guide-character.ts
src/index.ts
src/characters/<selected>.ts
assets/<selected>/*.webp -> public/mimo-guides/<selected>/*.webp
```

The package folder is deliberately self-contained, so copying it does not rely
on demo code elsewhere in this repository.

## Use the component

```tsx
"use client";

import { useState } from "react";
import { MimoGuide, type GuideExpression } from "@/components/mimo-guide";
import teslaCharacter from "@/components/mimo-guide/characters/tesla";

export function ProductGuide() {
  const [expression, setExpression] = useState<GuideExpression>("idle");

  return (
    <>
      <MimoGuide
        character={teslaCharacter}
        expression={expression}
        size={420}
        intensity={1}
      />
      <button onClick={() => setExpression("thinking")}>Think</button>
    </>
  );
}
```

Available expressions are `idle`, `happy`, `listening`, `thinking`,
`surprised`, `sad`, `angry`, and `sleepy`. Expression changes automatically
crossfade and replay the transition animation. Rapid expression changes are
coalesced so the pop animation cannot continuously restart.

Useful props include:

- `character`: the selected character module or your own compatible character object.
- `expression`: the controlled expression.
- `size`: a number in pixels or any CSS width value.
- `intensity`: motion multiplier from `0.2` to `3`.
- `assetPath`: override the selected character's registered asset directory.
- `animateExpressionShift`: disable the scale-up pop while keeping expression
  crossfades.
- `expressionShiftCooldown`: quiet time in milliseconds between pop animations;
  defaults to `240`.
- `transitionDuration`: how long the pop remains active in milliseconds.
- `className` and `style`: compose it inside cards, dialogs, or shadcn layouts.
- `decorative`: hide it from assistive technology when adjacent text already
  describes the state.

The CSS module uses kebab-case classes prefixed with `mimo-guide-`, custom
properties prefixed with `--mimo-guide-`, and keyframes prefixed with
`mimoGuide`. It does not modify global styles.

## Add another character

The reusable `MimoGuide` component is character-agnostic, so a new character
does not require component or animation changes. Character authoring consists
of one illustrated sprite set, one small configuration module, and one registry
entry.

### 1. Create the expression artwork

Create eight transparent WebP files with these exact names:

```text
idle.webp
happy.webp
listening.webp
thinking.webp
surprised.webp
sad.webp
angry.webp
sleepy.webp
```

Keep the canvas dimensions, character scale, center point, and framing identical
across all eight images. Expression transitions crossfade sprites in the same
position, so inconsistent framing will look like the character jumps.

Choose a lowercase kebab-case ID for the character, such as `einstein`, and add
the distributable artwork here:

```text
packages/mimo-guide/assets/einstein/*.webp
```

Mirror the same files into the Studio's public assets:

```text
public/mimo-guides/einstein/*.webp
```

The two folders must remain byte-for-byte identical. The package folder is what
the installer ships to consumer projects; the public folder is what this Studio
and canvas demo render.

### 2. Add the character configuration

Create `packages/mimo-guide/src/characters/einstein.ts`:

```ts
import type { GuideCharacter } from "../guide-character";

const einsteinCharacter = {
  id: "einstein",
  label: "Albert Einstein",
  role: "Playful physicist",
  assetPath: "/mimo-guides/einstein",
  assetExtension: "webp",
  stage: "#445577",
  accent: "#ffd166",
} as const satisfies GuideCharacter;

export default einsteinCharacter;
```

`stage` controls the Studio presentation color and `accent` controls highlights
and canvas theming. The `id`, module filename, asset folder, and final segment of
`assetPath` must match.

### 3. Register the character

Import the module in `packages/mimo-guide/src/characters/index.ts`, export it,
and add it to `guideCharacters`:

```ts
import einsteinCharacter from "./einstein";

export { einsteinCharacter };

export const guideCharacters = [
  // existing characters...
  einsteinCharacter,
] as const;
```

That registry entry automatically adds the character to the Studio roster, the
canvas selector, event validation, and the Studio's generated install example.
The installer discovers selectable IDs from `packages/mimo-guide/assets`, so it
will also accept:

```bash
npx --yes github:markorusic/mimo-avatar-studio add . --character einstein
```

The installer copies only `einstein.ts`, Einstein's eight sprites, and the shared
component core. It does not copy the other character packs.

### 4. Update repository bookkeeping

Until the remaining counts and test fixtures are registry-derived, update:

- The character arrays in `tests/rendered-html.test.mjs`.
- The expected installer list in `tests/installer.test.mjs`.
- The available-character list in this README.
- Character-count copy in `src/routes/__root.tsx` and
  `src/components/GuideStudio.tsx`.

Then validate the complete authoring path:

```bash
npm run check
npm run typecheck
npm test
npm run guide:add -- /path/to/test-react-app --character einstein --dry-run
```

The test suite verifies that every registered expression exists and that the
Studio and distributable sprite folders are identical.

## Studio event adapter

`MimoGuide` is a controlled React component and does not install a global event
listener. In a normal consumer app, keep the installed character fixed and
update its `expression` prop through React state.

The Studio includes an optional event adapter for testing integrations. Its
primary event changes only the current guide's expression:

```js
window.dispatchEvent(
  new CustomEvent("mimo-guide:expression", {
    detail: { expression: "thinking" },
  }),
);
```

Only multi-character hosts such as the Studio need `mimo-guide:state` with a
`character` field:

```js
window.dispatchEvent(
  new CustomEvent("mimo-guide:state", {
    detail: { character: "tesla", expression: "thinking" },
  }),
);
```

The Studio also supports `window.mimoGuideController.setExpression("happy")`.
Its `setCharacter("leonardo")` and `setState(...)` methods are optional
multi-character controls, not requirements of the reusable component.

## Checks

```bash
npm run check
npm run format
npm test
```

Biome owns linting, import organization, and formatting. Use `npm run lint` for
lint-only validation or `npm run format:check` to check formatting without
writing changes. The test suite builds the demo, validates every sprite and CSS
namespace, then installs the kit into clean shadcn fixtures to verify alias
detection, idempotency, and conflict protection.
