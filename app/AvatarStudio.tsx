"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SageAvatar, {
  sageExpressions,
  isSageExpression,
  sageCharacter,
  type SageExpression,
} from "../packages/sage-avatar/src/sage-avatar";

const expressions = [
  { id: "idle", label: "Idle", symbol: "✦", event: "SYSTEM_READY", color: "#c8ff4d" },
  { id: "happy", label: "Happy", symbol: "☀", event: "TASK_COMPLETE", color: "#ffd33d" },
  { id: "listening", label: "Listening", symbol: "◖", event: "VOICE_INPUT", color: "#5ee8ff" },
  { id: "thinking", label: "Thinking", symbol: "…", event: "PROCESSING", color: "#bda6ff" },
  { id: "surprised", label: "Surprised", symbol: "!", event: "NEW_MESSAGE", color: "#ff9c55" },
  { id: "sad", label: "Sad", symbol: "⌢", event: "CONNECTION_LOST", color: "#77a7ff" },
  { id: "angry", label: "Angry", symbol: "×", event: "ERROR_DETECTED", color: "#ff6363" },
  { id: "sleepy", label: "Sleepy", symbol: "z", event: "INACTIVE", color: "#a9b4cc" },
] as const;

declare global {
  interface Window {
    avatarController?: {
      setExpression: (expression: SageExpression) => void;
      setState: (state: { expression?: SageExpression }) => void;
      expressions: readonly SageExpression[];
    };
  }
}

export default function AvatarStudio() {
  const [expression, setExpression] = useState<SageExpression>("idle");
  const [intensity, setIntensity] = useState(1);
  const [autoPlay, setAutoPlay] = useState(false);
  const [eventCount, setEventCount] = useState(1);

  const activeExpression = useMemo(
    () => expressions.find((item) => item.id === expression) ?? expressions[0],
    [expression],
  );

  const applyAvatarState = useCallback((next: { expression?: SageExpression }) => {
    if (!next.expression) return;
    setExpression(next.expression);
    setEventCount((count) => count + 1);
  }, []);

  const triggerExpression = useCallback((next: SageExpression) => {
    applyAvatarState({ expression: next });
  }, [applyAvatarState]);

  useEffect(() => {
    const receiveState = (value: unknown) => {
      if (isSageExpression(value)) {
        applyAvatarState({ expression: value });
        return;
      }
      if (typeof value !== "object" || value === null) return;
      const payload = value as { expression?: unknown };
      applyAvatarState({
        expression: isSageExpression(payload.expression) ? payload.expression : undefined,
      });
    };

    const onCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      receiveState(detail);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      const payload = event.data;
      if (payload?.type === "avatar:state" || payload?.type === "avatar:expression") {
        receiveState(payload);
      }
    };

    window.avatarController = {
      setExpression: triggerExpression,
      setState: applyAvatarState,
      expressions: sageExpressions,
    };
    window.addEventListener("avatar:expression", onCustomEvent);
    window.addEventListener("avatar:state", onCustomEvent);
    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("avatar:expression", onCustomEvent);
      window.removeEventListener("avatar:state", onCustomEvent);
      window.removeEventListener("message", onMessage);
      delete window.avatarController;
    };
  }, [applyAvatarState, triggerExpression]);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setExpression((current) => {
        const currentIndex = sageExpressions.indexOf(current);
        const next = sageExpressions[(currentIndex + 1) % sageExpressions.length];
        setEventCount((count) => count + 1);
        return next;
      });
    }, 2400);
    return () => clearInterval(interval);
  }, [autoPlay]);

  return (
    <main className="site-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Mimo home">
          <span className="brand-mark">M</span>
          <span>MIMO</span>
          <small>EXPRESSION ENGINE</small>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#studio">Studio</a>
          <Link href="/canvas">Canvas demo</Link>
          <a href="#install">Install</a>
          <a href="https://github.com/markorusic/mimo-avatar-studio" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </header>

      <section className="studio" id="studio">
        <div
          className="stage-panel"
          style={{
            "--accent": activeExpression.color,
            "--stage": sageCharacter.stage,
          } as React.CSSProperties}
        >
          <div className="panel-heading">
            <span>LIVE AVATAR · SAGE</span>
            <span className="coordinates">EVENT #{String(eventCount).padStart(3, "0")}</span>
          </div>
          <SageAvatar
            expression={expression}
            intensity={intensity}
            className="studio-avatar"
            expressionShiftCooldown={240}
          />
          <div className="now-playing">
            <div>
              <span className="event-dot" />
              <p>NOW PLAYING</p>
              <strong>{activeExpression.label}</strong>
            </div>
            <code>{activeExpression.event}</code>
          </div>
        </div>

        <aside className="control-panel" aria-label="Avatar controls">
          <div className="control-heading">
            <div>
              <p>EVENT PANEL</p>
              <h2>Send an expression</h2>
            </div>
            <button
              className={`autoplay ${autoPlay ? "active" : ""}`}
              onClick={() => setAutoPlay((value) => !value)}
              aria-pressed={autoPlay}
            >
              <span>{autoPlay ? "Ⅱ" : "▶"}</span> {autoPlay ? "Pause loop" : "Play loop"}
            </button>
          </div>

          <div className="expression-grid">
            {expressions.map((item, index) => (
              <button
                key={item.id}
                className={`expression-button ${expression === item.id ? "active" : ""}`}
                style={{ "--button-accent": item.color } as React.CSSProperties}
                onClick={() => {
                  setAutoPlay(false);
                  triggerExpression(item.id);
                }}
                aria-pressed={expression === item.id}
                data-testid={`expression-${item.id}`}
              >
                <span className="key-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="expression-symbol">{item.symbol}</span>
                <span className="expression-name">{item.label}</span>
                <span className="arrow">↗</span>
              </button>
            ))}
          </div>

          <div className="intensity-control">
            <label htmlFor="intensity">Motion intensity <output>{Math.round(intensity * 100)}%</output></label>
            <input
              id="intensity"
              type="range"
              min="0.6"
              max="1.4"
              step="0.1"
              value={intensity}
              onChange={(event) => setIntensity(Number(event.target.value))}
            />
          </div>

          <div className="event-recipe">
            <div className="recipe-top">
              <span>TRIGGER FROM YOUR APP</span>
              <span className="language">JS</span>
            </div>
            <code>
              <span>window</span>.dispatchEvent(<br />
              &nbsp;&nbsp;new CustomEvent(<b>&quot;avatar:state&quot;</b>, {`{`}<br />
              &nbsp;&nbsp;&nbsp;&nbsp;detail: {`{`} expression: <b>&quot;thinking&quot;</b> {`}`}<br />
              &nbsp;&nbsp;{`}`})<br />
              );
            </code>
          </div>
        </aside>
      </section>

      <section className="install-section" id="install">
        <div className="install-heading">
          <p className="section-kicker">COPY-OWNED · SHADCN-STYLE</p>
          <h2>Bring Sage into your React app.</h2>
          <p>
            Install the component source and all eight local sprites directly into your
            project. No account, hosted runtime, or proprietary animation tool required.
          </p>
        </div>

        <div className="install-grid">
          <article className="install-card install-card-primary">
            <div className="install-card-top">
              <span>CLI</span>
              <strong>Recommended</strong>
            </div>
            <h3>One command</h3>
            <p>
              Run this from your React project. The installer detects shadcn aliases,
              places the component in your components folder, and copies sprites to public.
            </p>
            <pre><code>npx --yes github:markorusic/mimo-avatar-studio add .</code></pre>
            <p className="install-note">Existing customized files are protected unless you add <code>--force</code>.</p>
          </article>

          <article className="install-card">
            <div className="install-card-top">
              <span>MANUAL</span>
              <strong>Copy and own</strong>
            </div>
            <h3>Three source files + sprites</h3>
            <ol>
              <li>Copy <code>packages/sage-avatar/src</code> into your component folder.</li>
              <li>Copy <code>packages/sage-avatar/assets</code> to <code>public/avatars/sage</code>.</li>
              <li>Import <code>SageAvatar</code> and control it with an expression prop.</li>
            </ol>
            <a href="https://github.com/markorusic/mimo-avatar-studio/tree/main/packages/sage-avatar" target="_blank" rel="noreferrer">
              Open the portable kit ↗
            </a>
          </article>
        </div>

        <div className="usage-example">
          <div>
            <span>USE IT</span>
            <strong>Controlled React component</strong>
          </div>
          <pre><code>{`import { SageAvatar } from "@/components/sage-avatar";

<SageAvatar
  expression="thinking"
  expressionShiftCooldown={240}
/>`}</code></pre>
        </div>
      </section>

      <footer>
        <p>MIMO / SAGE AVATAR KIT</p>
        <p>React component · 8 illustrated expressions · MIT licensed</p>
      </footer>
    </main>
  );
}
