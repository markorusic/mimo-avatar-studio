# Mimo animated avatar

Mimo is a self-contained animated avatar with eight expressions, smooth CSS
transitions, button controls, adjustable motion intensity, and a looping demo.
It uses React and CSS only—there are no external assets, accounts, API keys, or
runtime services.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Send expression events

The avatar listens for a browser `CustomEvent`:

```js
window.dispatchEvent(
  new CustomEvent("avatar:expression", {
    detail: { expression: "happy" },
  }),
);
```

It also accepts same-window messages:

```js
window.postMessage(
  { type: "avatar:expression", expression: "thinking" },
  "*",
);
```

Available values are `idle`, `happy`, `listening`, `thinking`, `surprised`,
`sad`, `angry`, and `sleepy`.

For direct control, call `window.avatarController.setExpression("happy")`.

## Checks

```bash
npm test
```
