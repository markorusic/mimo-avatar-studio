# Mimo Guide

This folder is the complete portable component: React source, isolated CSS,
four eight-expression character packs, and a zero-dependency installer.

Install it from the public repository with:

```bash
npx --yes github:markorusic/mimo-avatar-studio add .
```

From a local clone, point the installer at another React project with:

```bash
node packages/mimo-guide/bin/mimo-guide.mjs add ../your-react-app
```

The installer detects shadcn's `components.json` aliases. Without shadcn, it
uses `src/components/mimo-guide` when the project has a `src` folder, or
`components/mimo-guide` otherwise. Sprites go to `public/mimo-guides/<character>`.

Run `node packages/mimo-guide/bin/mimo-guide.mjs --help` for safe overwrite,
dry-run, and custom target options.

For manual installation, copy the four files in `src/` to a component folder
and copy the character folders in `assets/` to `public/mimo-guides/`.

To add a character, add its metadata to `src/characters.ts` and place its eight
named expression sprites in `assets/<id>/`. The installer discovers asset
folders automatically.
