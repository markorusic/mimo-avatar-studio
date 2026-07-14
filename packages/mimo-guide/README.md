# Mimo Guide

This folder contains the reusable React core, isolated CSS, individually
selectable character packs, and a zero-dependency installer.

Install it from the public repository with:

```bash
npx --yes github:markorusic/mimo-avatar-studio add . --character tesla
```

From a local clone, point the installer at another React project with:

```bash
node packages/mimo-guide/bin/mimo-guide.mjs add ../your-react-app --character tesla
```

The installer detects shadcn's `components.json` aliases. Without shadcn, it
uses `src/components/mimo-guide` when the project has a `src` folder, or
`components/mimo-guide` otherwise. It copies the reusable core, the selected
character module, and only that character's sprites to `public/mimo-guides/<character>`.

Run `node packages/mimo-guide/bin/mimo-guide.mjs --help` for safe overwrite,
dry-run, and custom target options.

For manual installation, copy the four core files in `src/`, one file from
`src/characters/`, and its matching folder from `assets/`.

## Author a character

Character authoring does not require changes to `MimoGuide`:

1. Choose a lowercase kebab-case ID.
2. Add transparent, consistently framed `idle.webp`, `happy.webp`,
   `listening.webp`, `thinking.webp`, `surprised.webp`, `sad.webp`,
   `angry.webp`, `sleepy.webp`, `encouraging.webp`, `explaining.webp`,
   `curious.webp`, `celebrating.webp`, `focused.webp`, `reassuring.webp`, and
   `impressed.webp` files to `assets/<id>/`.
3. Add `src/characters/<id>.ts` with matching `id`, `assetPath`, label, role,
   stage color, and accent color.
4. Export the module from `src/characters/index.ts` and add it to
   `guideCharacters` for multi-character hosts such as the Studio.

The installer discovers selectable IDs from the folders in `assets/`, requires
the matching character module, and copies only the selected module and its 15
sprites. In the Studio repository, mirror the sprite folder to
`public/mimo-guides/<id>/` and keep both copies byte-for-byte identical.

See the root README's **Add another character** section for the complete example,
repository bookkeeping, and validation commands.

## State and events

`MimoGuide` is a controlled React component. It does not register window events:
pass the installed character to `character` and drive `expression` with your
app's React state. The Studio's `mimo-guide:expression` event is an optional
demo adapter. A `character` field is only useful in a custom host that has
installed multiple character packs and intentionally supports switching them.
