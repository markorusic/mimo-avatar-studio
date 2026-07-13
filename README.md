# Mimo Guide Studio

Mimo Guide is a registry-driven illustrated React character engine. It ships Sage,
Socrates, Nikola Tesla, and Leonardo da Vinci with eight animated expressions
each. This repository contains the expression Studio, the interactive canvas
integration example, and the copy-owned component kit.

- Studio: `/`
- Canvas example: `/canvas`
- Portable kit: `packages/mimo-guide`

## Run the demo

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Add Mimo Guide to another React or shadcn project

Run the public installer from the root of any React project:

```bash
npx --yes github:markorusic/mimo-avatar-studio add .
```

It installs:

- `mimo-guide.tsx`, `mimo-guide.module.css`, `characters.ts`, and `index.ts` in the project's
  component directory.
- All four eight-expression WebP character packs in `public/mimo-guides`.
- No npm dependencies and no Tailwind configuration.

If the target has a shadcn `components.json`, the installer resolves its
`aliases.components` setting through `tsconfig.json` or `jsconfig.json`.
Otherwise it uses `src/components/mimo-guide` for `src`-based apps and
`components/mimo-guide` for root-based apps.

The installer is safe to rerun. Identical files are left alone, and edited
files stop the entire operation before anything is written. Use `--force` only
when you intentionally want to replace Mimo Guide files.

```bash
npx --yes github:markorusic/mimo-avatar-studio add . --dry-run
npx --yes github:markorusic/mimo-avatar-studio add . --force
```

When working from a clone of this repository, the equivalent local command is:

```bash
npm run guide:add -- C:\path\to\your-react-app
```

### Portable one-file kit

Create a self-contained tarball that can be moved to another computer or repository:

```bash
npm run guide:pack
```

Then run it from the target project without an account or network access:

```bash
npm exec --yes --offline --package=C:\path\to\mimo-guide-0.1.0.tgz -- mimo-guide add .
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
src/characters.ts
src/index.ts
assets/<character>/*.webp -> public/mimo-guides/<character>/*.webp
```

The package folder is deliberately self-contained, so copying it does not rely
on demo code elsewhere in this repository.

## Use the component

```tsx
"use client";

import { useState } from "react";
import {
  MimoGuide,
  teslaCharacter,
  type GuideExpression,
} from "@/components/mimo-guide";

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

- `character`: an entry from `guideCharacters` or your own compatible character object.
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

Character additions are data-driven:

1. Add one entry to `packages/mimo-guide/src/characters.ts` with an `id`, label,
   role, stage/accent colors, and `/mimo-guides/<id>` asset path.
2. Add the eight expression files to `packages/mimo-guide/assets/<id>/` using
   the existing expression names.
3. Mirror that folder to `public/mimo-guides/<id>/` for this Studio repository.

The reusable component, Studio selector, canvas selector, and public installer
all consume the registry or discover the asset directory automatically. No new
rendering branch is required.

## Send events to the demo

The demo includes an event adapter around the controlled React component:

```js
window.dispatchEvent(
  new CustomEvent("mimo-guide:state", {
    detail: { character: "tesla", expression: "thinking" },
  }),
);
```

It also supports `window.postMessage({ type: "mimo-guide:state", character:
"socrates", expression: "thinking" }, "*")`,
`window.mimoGuideController.setCharacter("leonardo")`, and
`window.mimoGuideController.setExpression("happy")`.

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
