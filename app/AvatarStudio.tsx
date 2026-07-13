"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  characterIds,
  characters,
  isCharacter,
  type Character,
  type CharacterId,
} from "./characters";

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

type ExpressionId = (typeof expressions)[number]["id"];

declare global {
  interface Window {
    avatarController?: {
      setExpression: (expression: ExpressionId) => void;
      setCharacter: (character: CharacterId) => void;
      setState: (state: { expression?: ExpressionId; character?: CharacterId }) => void;
      expressions: readonly ExpressionId[];
      characters: readonly CharacterId[];
    };
  }
}

const expressionIds = expressions.map((item) => item.id);

function isExpression(value: unknown): value is ExpressionId {
  return typeof value === "string" && expressionIds.includes(value as ExpressionId);
}

function Avatar({
  expression,
  intensity,
  character,
}: {
  expression: ExpressionId;
  intensity: number;
  character: Character;
}) {
  const characterStyle = {
    "--intensity": intensity,
    "--skin": character.skin,
    "--skin-shadow": character.skinShadow,
    "--hair": character.hair,
    "--character-accent": character.accent,
    "--eye-color": character.eye,
    "--cheek-color": character.cheek,
  } as React.CSSProperties;

  return (
    <div
      className="avatar-scene"
      data-expression={expression}
      data-character={character.id}
      data-character-shape={character.shape}
      style={characterStyle}
      aria-label={`${character.label} is ${expression}`}
      role="img"
    >
      <div className="orbit orbit-one" aria-hidden="true" />
      <div className="orbit orbit-two" aria-hidden="true" />
      <div className="signal signal-left" aria-hidden="true"><i /><i /><i /></div>
      <div className="signal signal-right" aria-hidden="true"><i /><i /><i /></div>
      <div className="thoughts" aria-hidden="true"><i /><i /><i /></div>
      <div className="sleep-notes" aria-hidden="true"><span>z</span><span>z</span><span>z</span></div>
      <div className="avatar-rig">
        <div className="character-details" aria-hidden="true">
          <span className="detail detail-one" />
          <span className="detail detail-two" />
          <span className="detail detail-three" />
        </div>
        <div className="avatar-shadow" />
        <div className="torso">
          <div className="collar-dot" />
        </div>
        <div className="ear ear-left"><span /></div>
        <div className="ear ear-right"><span /></div>
        <div className="head">
          <div className="head-shine" />
          <div className="brow brow-left" />
          <div className="brow brow-right" />
          <div className="eye eye-left"><span className="pupil"><i /></span></div>
          <div className="eye eye-right"><span className="pupil"><i /></span></div>
          <div className="cheek cheek-left" />
          <div className="cheek cheek-right" />
          <div className="nose" />
          <div className="mouth"><span /></div>
        </div>
      </div>
    </div>
  );
}

export default function AvatarStudio() {
  const [expression, setExpression] = useState<ExpressionId>("idle");
  const [characterId, setCharacterId] = useState<CharacterId>("mimo");
  const [intensity, setIntensity] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [eventCount, setEventCount] = useState(1);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeExpression = useMemo(
    () => expressions.find((item) => item.id === expression) ?? expressions[0],
    [expression],
  );
  const activeCharacter = useMemo(
    () => characters.find((item) => item.id === characterId) ?? characters[0],
    [characterId],
  );

  const beginTransition = useCallback(() => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    setIsTransitioning(true);
    transitionTimer.current = setTimeout(() => setIsTransitioning(false), 520);
  }, []);

  const applyAvatarState = useCallback((next: {
    expression?: ExpressionId;
    character?: CharacterId;
  }) => {
    if (!next.expression && !next.character) return;
    beginTransition();
    if (next.expression) setExpression(next.expression);
    if (next.character) setCharacterId(next.character);
    setEventCount((count) => count + 1);
  }, [beginTransition]);

  const triggerExpression = useCallback((next: ExpressionId) => {
    applyAvatarState({ expression: next });
  }, [applyAvatarState]);

  const triggerCharacter = useCallback((next: CharacterId) => {
    applyAvatarState({ character: next });
  }, [applyAvatarState]);

  useEffect(() => {
    const receiveState = (value: unknown) => {
      if (isExpression(value)) {
        applyAvatarState({ expression: value });
        return;
      }
      if (typeof value !== "object" || value === null) return;
      const payload = value as { expression?: unknown; character?: unknown };
      applyAvatarState({
        expression: isExpression(payload.expression) ? payload.expression : undefined,
        character: isCharacter(payload.character) ? payload.character : undefined,
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
      setCharacter: triggerCharacter,
      setState: applyAvatarState,
      expressions: expressionIds,
      characters: characterIds,
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
  }, [applyAvatarState, triggerCharacter, triggerExpression]);

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
          <p className="eyebrow"><span>01</span> MODULAR CHARACTER SYSTEM</p>
          <h1>MANY FACES.<br /><em>EVERY FEELING.</em></h1>
          <p className="intro">
            Choose a character, then turn incoming events into expressive motion. Identity
            and emotion are separate states, so your app can switch either one at any time.
          </p>
        </div>
        <div className="hero-note" aria-hidden="true">
          <span>4×8</span>
          <p>characters ×<br />expressions</p>
        </div>
      </section>

      <section className={`studio ${isTransitioning ? "is-transitioning" : ""}`}>
        <div
          className="stage-panel"
          style={{
            "--accent": activeExpression.color,
            "--stage": activeCharacter.stage,
          } as React.CSSProperties}
        >
          <div className="panel-heading">
            <span>LIVE AVATAR · {activeCharacter.label.toUpperCase()}</span>
            <span className="coordinates">EVENT #{String(eventCount).padStart(3, "0")}</span>
          </div>
          <Avatar expression={expression} intensity={intensity} character={activeCharacter} />
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
          <section className="character-picker" aria-labelledby="character-picker-title">
            <div className="character-picker-heading">
              <div>
                <p>CHARACTER ROSTER</p>
                <h2 id="character-picker-title">Choose your avatar</h2>
              </div>
              <span>
                {String(characters.findIndex((item) => item.id === characterId) + 1).padStart(2, "0")} / {String(characters.length).padStart(2, "0")}
              </span>
            </div>
            <div className="character-list">
              {characters.map((item) => (
                <button
                  key={item.id}
                  className={`character-button ${characterId === item.id ? "active" : ""}`}
                  style={{
                    "--portrait-stage": item.stage,
                    "--portrait-skin": item.skin,
                    "--portrait-accent": item.accent,
                    "--portrait-hair": item.hair,
                  } as React.CSSProperties}
                  onClick={() => triggerCharacter(item.id)}
                  aria-pressed={characterId === item.id}
                  data-testid={`character-${item.id}`}
                >
                  <span className="character-portrait" data-shape={item.shape}><i /></span>
                  <span className="character-label"><strong>{item.label}</strong><small>{item.kind}</small></span>
                </button>
              ))}
            </div>
          </section>

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
              &nbsp;&nbsp;&nbsp;&nbsp;detail: {`{`} character: <b>&quot;nova&quot;</b>,<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;expression: <b>&quot;happy&quot;</b> {`}`}<br />
              &nbsp;&nbsp;{`}`})<br />
              );
            </code>
          </div>
        </aside>
      </section>

      <footer>
        <p>BUILT WITH REACT + CSS MOTION</p>
        <p>4 CHARACTERS · 8 EXPRESSIONS · ZERO EXTERNAL SERVICES</p>
      </footer>
    </main>
  );
}
