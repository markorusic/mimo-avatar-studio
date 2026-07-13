# Sage Avatar Kit

This folder is the complete portable component: React source, isolated CSS,
the eight expression sprites, and a zero-dependency installer.

Install it from the public repository with:

```bash
npx --yes github:markorusic/mimo-avatar-studio add .
```

From a local clone, point the installer at another React project with:

```bash
node packages/sage-avatar/bin/sage-avatar.mjs add ../your-react-app
```

The installer detects shadcn's `components.json` aliases. Without shadcn, it
uses `src/components/sage-avatar` when the project has a `src` folder, or
`components/sage-avatar` otherwise. Sprites go to `public/avatars/sage`.

Run `node packages/sage-avatar/bin/sage-avatar.mjs --help` for safe overwrite,
dry-run, and custom target options.

For manual installation, copy the three files in `src/` to a component folder
and copy `assets/` to `public/avatars/sage/`.
