"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SpriteAvatar, {
  expressionIds,
  isExpression,
  sageCharacter,
  type ExpressionId,
} from "./SpriteAvatar";

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
      setExpression: (expression: ExpressionId) => void;
      setState: (state: { expression?: ExpressionId }) => void;
      expressions: readonly ExpressionId[];
    };
  }
}

export default function AvatarStudio() {
  const [expression, setExpression] = useState<ExpressionId>("idle");
  const [intensity, setIntensity] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [eventCount, setEventCount] = useState(1);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeExpression = useMemo(
    () => expressions.find((item) => item.id === expression) ?? expressions[0],
    [expression],
  );

  const beginTransition = useCallback(() => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    setIsTransitioning(true);
    transitionTimer.current = setTimeout(() => setIsTransitioning(false), 520);
  }, []);

  const applyAvatarState = useCallback((next: { expression?: ExpressionId }) => {
    if (!next.expression) return;
    beginTransition();
    setExpression(next.expression);
    setEventCount((count) => count + 1);
  }, [beginTransition]);

  const triggerExpression = useCallback((next: ExpressionId) => {
    applyAvatarState({ expression: next });
  }, [applyAvatarState]);

  useEffect(() => {
    const receiveState = (value: unknown) => {
      if (isExpression(value)) {
        applyAvatarState({ expression: value });
        return;
      }
      if (typeof value !== "object" || value === null) return;
      const payload = value as { expression?: unknown };
      applyAvatarState({
        expression: isExpression(payload.expression) ? payload.expression : undefined,
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
      expressions: expressionIds,
    };
    window.addEventListener("avatar:expression", onCustomEvent);
    window.addEventListener("avatar:state", onCustomEvent);
    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("avatar:expression", onCustomEvent);
      window.removeEventListener("avatar:state", onCustomEvent);
      window.removeEventListener("message", onMessage);
      delete window.avatarController;
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, [applyAvatarState, triggerExpression]);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setExpression((current) => {
        const currentIndex = expressionIds.indexOf(current);
        const next = expressionIds[(currentIndex + 1) % expressionIds.length];
        beginTransition();
        setEventCount((count) => count + 1);
        return next;
      });
    }, 2400);
    return () => clearInterval(interval);
  }, [autoPlay, beginTransition]);

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Mimo home">
          <span className="brand-mark">M</span>
          <span>MIMO</span>
          <small>EXPRESSION ENGINE</small>
        </a>
        <div className="status-pill"><span /> LOCAL · READY</div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span>01</span> ILLUSTRATED AVATAR ENGINE</p>
          <h1>ONE WIZARD.<br /><em>EVERY FEELING.</em></h1>
          <p className="intro">
            Turn incoming events into expressive motion with Sage, a friendly illustrated
            wizard built from a consistent set of high-resolution animated states.
          </p>
        </div>
        <div className="hero-note" aria-hidden="true">
          <span>1×8</span>
          <p>avatar ×<br />expressions</p>
        </div>
      </section>

      <section className={`studio ${isTransitioning ? "is-transitioning" : ""}`}>
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
          <SpriteAvatar
            expression={expression}
            intensity={intensity}
            transitioning={isTransitioning}
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

      <footer>
        <p>BUILT WITH REACT + CSS MOTION</p>
        <p>1 ILLUSTRATED AVATAR · 8 EXPRESSIONS · ZERO EXTERNAL SERVICES</p>
      </footer>
    </main>
  );
}
