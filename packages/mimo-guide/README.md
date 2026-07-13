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

To author a character, add `src/characters/<id>.ts`, export it from
`src/characters/index.ts`, and place its eight named expression sprites in
`assets/<id>/`. The installer discovers selectable characters from those asset folders.

## State and events

`MimoGuide` is a controlled React component. It does not register window events:
pass the installed character to `character` and drive `expression` with your
app's React state. The Studio's `mimo-guide:expression` event is an optional
demo adapter. A `character` field is only useful in a custom host that has
installed multiple character packs and intentionally supports switching them.
