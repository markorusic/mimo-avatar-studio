# Mimo animated avatar

Mimo is a self-contained avatar engine with four selectable characters, eight
expressions, smooth CSS transitions, adjustable motion, and a looping demo.
It uses React and CSS only—there are no external assets, accounts, API keys, or
runtime services.

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
    detail: { character: "nova", expression: "happy" },
  }),
);
```

It also accepts same-window messages:

```js
window.postMessage(
  { type: "avatar:state", character: "pip", expression: "thinking" },
  "*",
);
```

Available characters are `mimo`, `nova`, `pip`, and `moss`. Available
expressions are `idle`, `happy`, `listening`, `thinking`, `surprised`, `sad`,
`angry`, and `sleepy`.

For direct control, call `window.avatarController.setCharacter("nova")`,
`setExpression("happy")`, or `setState({ character: "nova", expression:
"happy" })`.

## Checks

```bash
npm test
```
