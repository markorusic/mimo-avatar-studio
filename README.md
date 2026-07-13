# Mimo Avatar Studio

Mimo is an illustrated React avatar engine for Sage, a friendly wizard with
eight animated expressions. This repository contains the expression Studio,
the interactive canvas integration example, and the copy-owned component kit.

- Studio: `/`
- Canvas example: `/canvas`
- Portable kit: `packages/sage-avatar`

## Run the demo

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Add Sage to another React or shadcn project

Run the public installer from the root of any React project:

```bash
npx --yes github:markorusic/mimo-avatar-studio add .
```

It installs:

- `sage-avatar.tsx`, `sage-avatar.module.css`, and `index.ts` in the project's
  component directory.
- All eight WebP sprites in `public/avatars/sage`.
- No npm dependencies and no Tailwind configuration.

If the target has a shadcn `components.json`, the installer resolves its
`aliases.components` setting through `tsconfig.json` or `jsconfig.json`.
Otherwise it uses `src/components/sage-avatar` for `src`-based apps and
`components/sage-avatar` for root-based apps.

The installer is safe to rerun. Identical files are left alone, and edited
files stop the entire operation before anything is written. Use `--force` only
when you intentionally want to replace Sage Avatar files.

```bash
npx --yes github:markorusic/mimo-avatar-studio add . --dry-run
npx --yes github:markorusic/mimo-avatar-studio add . --force
```

When working from a clone of this repository, the equivalent local command is:

```bash
npm run sage:add -- C:\path\to\your-react-app
```

### Portable one-file kit

Create a 2.2 MB tarball that can be moved to another computer or repository:

```bash
npm run sage:pack
```

Then run it from the target project without an account or network access:

```bash
npm exec --yes --offline --package=C:\path\to\sage-avatar-kit-0.1.0.tgz -- sage-avatar add .
```

This is the shadcn-style distribution path for the current illustrated avatar.
The official shadcn registry format stores file contents as text, so it cannot
faithfully carry the eight binary WebP sprites in a single registry item. The
small installer preserves the same copy-and-own workflow while keeping the
images as efficient local assets rather than a CDN dependency.

### Copy/paste fallback

Copy these files from `packages/sage-avatar`:

```text
src/sage-avatar.tsx
src/sage-avatar.module.css
src/index.ts
assets/*.webp -> public/avatars/sage/*.webp
```

The package folder is deliberately self-contained, so copying it does not rely
on demo code elsewhere in this repository.

## Use the component

```tsx
"use client";

import { useState } from "react";
import {
  SageAvatar,
  type SageExpression,
} from "@/components/sage-avatar";

export function AssistantAvatar() {
  const [expression, setExpression] = useState<SageExpression>("idle");

  return (
    <>
      <SageAvatar expression={expression} size={420} intensity={1} />
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

- `expression`: the controlled expression.
- `size`: a number in pixels or any CSS width value.
- `intensity`: motion multiplier from `0.2` to `3`.
- `assetPath`: override `/avatars/sage` when assets are served elsewhere.
- `animateExpressionShift`: disable the scale-up pop while keeping expression
  crossfades.
- `expressionShiftCooldown`: quiet time in milliseconds between pop animations;
  defaults to `240`.
- `transitionDuration`: how long the pop remains active in milliseconds.
- `className` and `style`: compose it inside cards, dialogs, or shadcn layouts.
- `decorative`: hide it from assistive technology when adjacent text already
  describes the state.

The CSS module uses kebab-case classes prefixed with `sage-avatar-`, custom
properties prefixed with `--sage-avatar-`, and keyframes prefixed with
`sageAvatar`. It does not modify global styles.

## Send events to the demo

The demo includes an event adapter around the controlled React component:

```js
window.dispatchEvent(
  new CustomEvent("avatar:state", {
    detail: { expression: "thinking" },
  }),
);
```

It also supports `window.postMessage({ type: "avatar:state", expression:
"thinking" }, "*")` and
`window.avatarController.setExpression("happy")`.

## Checks

```bash
npm test
```

The test suite builds the demo, validates every sprite and CSS namespace, then
installs the kit into clean shadcn fixtures to verify alias detection,
idempotency, and conflict protection.
