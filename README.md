# Mimo animated avatar

Mimo is a self-contained sprite avatar engine for Sage, a friendly illustrated
wizard with eight expressions, smooth transitions, adjustable motion, and a
looping demo. There are no accounts, API keys, or runtime services.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Send avatar events

The avatar listens for a browser `CustomEvent`:

```js
window.dispatchEvent(
  new CustomEvent("avatar:state", {
    detail: { expression: "thinking" },
  }),
);
```

It also accepts same-window messages:

```js
window.postMessage(
  { type: "avatar:state", expression: "thinking" },
  "*",
);
```

Available expressions are `idle`, `happy`, `listening`, `thinking`,
`surprised`, `sad`, `angry`, and `sleepy`.

For direct control, call `window.avatarController.setExpression("happy")` or
`setState({ expression: "happy" })`.

## Reuse in another React app

Copy `app/SpriteAvatar.tsx`, `app/SpriteAvatar.module.css`, and
`public/avatars/sage/` into the other project. Keep the image folder under that
app's `public/` directory, then render:

```tsx
const [expression, setExpression] = useState<ExpressionId>("idle");

<SpriteAvatar expression={expression} intensity={1} />
```

The component uses a CSS module, so it can be placed inside a Tailwind app
without changing the Tailwind configuration. A future illustrated character
only needs the same eight filenames and a new `SpriteCharacter` definition
with its own `assetPath`.

## Checks

```bash
npm test
```
