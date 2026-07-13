import { Link } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type GuideExpression,
  guideExpressions,
  isGuideExpression,
  MimoGuide,
} from "../../packages/mimo-guide/src";
import {
  type GuideCharacterId,
  getGuideCharacter,
  guideCharacters,
  isGuideCharacterId,
} from "../../packages/mimo-guide/src/characters";

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
    mimoGuideController?: {
      setExpression: (expression: GuideExpression) => void;
      setCharacter: (character: GuideCharacterId) => void;
      setState: (state: GuideState) => void;
      expressions: readonly GuideExpression[];
      characters: readonly GuideCharacterId[];
    };
  }
}

type GuideState = {
  expression?: GuideExpression;
  character?: GuideCharacterId;
};

type StudioCodeBlockProps = {
  code: string;
  language: "shell" | "tsx";
};

const tsxKeywords = new Set(["as", "const", "export", "from", "import", "type"]);
const tsxProperties = new Set([
  "character",
  "expression",
  "expressionShiftCooldown",
  "intensity",
  "size",
]);

function syntaxClass(token: string, language: StudioCodeBlockProps["language"]) {
  if (/^\s+$/.test(token)) return undefined;
  if (/^["']/.test(token)) return "syntax-string";
  if (/^\d+$/.test(token)) return "syntax-number";

  if (language === "shell") {
    if (token.startsWith("--")) return "syntax-flag";
    if (token === "npx" || token === "add") return "syntax-command";
    if (token.startsWith("github:")) return "syntax-string";
    if (/^[./]|[{}=<>/]$/.test(token)) return "syntax-punctuation";
    return "syntax-value";
  }

  if (tsxKeywords.has(token)) return "syntax-keyword";
  if (/^[A-Z]/.test(token)) return "syntax-component";
  if (tsxProperties.has(token)) return "syntax-property";
  if (/^[{}()[\]<>/=;,.]+$/.test(token)) return "syntax-punctuation";
  return "syntax-variable";
}

function highlightCode(code: string, language: StudioCodeBlockProps["language"]) {
  const tokens = code.match(
    /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|--[a-z-]+|[A-Za-z_$@.][\w$:@./-]*|\d+|\s+|[^\s]/g,
  ) ?? [code];

  let offset = 0;
  return tokens.map((token) => {
    const className = syntaxClass(token, language);
    const key = `${offset}-${token}`;
    offset += token.length;
    return className ? (
      <span className={className} key={key}>
        {token}
      </span>
    ) : (
      token
    );
  });
}

async function writeCodeToClipboard(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = code;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Clipboard is unavailable");
  }
}

function StudioCodeBlock({ code, language }: StudioCodeBlockProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const copyCode = async () => {
    try {
      await writeCodeToClipboard(code);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 1800);
  };

  const copyLabel =
    copyState === "copied" ? "Copied" : copyState === "error" ? "Try again" : "Copy";

  return (
    <div className="studio-code-block" data-language={language}>
      <div className="studio-code-toolbar">
        <span>{language}</span>
        <button type="button" onClick={copyCode} aria-label={`Copy ${language} code`}>
          {copyState === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          <span aria-live="polite">{copyLabel}</span>
        </button>
      </div>
      <pre>
        <code>{highlightCode(code, language)}</code>
      </pre>
    </div>
  );
}

export default function GuideStudio() {
  const [expression, setExpression] = useState<GuideExpression>("idle");
  const [intensity, setIntensity] = useState(1);
  const [autoPlay, setAutoPlay] = useState(false);
  const [eventCount, setEventCount] = useState(1);
  const [characterId, setCharacterId] = useState<GuideCharacterId>("sage");

  const activeExpression = useMemo(
    () => expressions.find((item) => item.id === expression) ?? expressions[0],
    [expression],
  );
  const activeCharacter = getGuideCharacter(characterId);
  const installCommand = `npx --yes github:markorusic/mimo-avatar-studio add . --character ${activeCharacter.id}`;
  const usageCode = `import { MimoGuide } from "@/components/mimo-guide";
import guideCharacter from "@/components/mimo-guide/characters/${activeCharacter.id}";

<MimoGuide
  character={guideCharacter}
  expression="thinking"
  expressionShiftCooldown={240}
/>`;

  const applyGuideState = useCallback((next: GuideState) => {
    if (!next.expression && !next.character) return;
    if (next.expression) setExpression(next.expression);
    if (next.character) setCharacterId(next.character);
    setEventCount((count) => count + 1);
  }, []);

  const triggerExpression = useCallback(
    (next: GuideExpression) => {
      applyGuideState({ expression: next });
    },
    [applyGuideState],
  );

  const selectCharacter = useCallback(
    (next: GuideCharacterId) => {
      applyGuideState({ character: next });
    },
    [applyGuideState],
  );

  useEffect(() => {
    const receiveState = (value: unknown) => {
      if (isGuideExpression(value)) {
        applyGuideState({ expression: value });
        return;
      }
      if (isGuideCharacterId(value)) {
        applyGuideState({ character: value });
        return;
      }
      if (typeof value !== "object" || value === null) return;
      const payload = value as { expression?: unknown; character?: unknown };
      applyGuideState({
        expression: isGuideExpression(payload.expression) ? payload.expression : undefined,
        character: isGuideCharacterId(payload.character) ? payload.character : undefined,
      });
    };

    const onCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      receiveState(detail);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      const payload = event.data;
      if (payload?.type === "mimo-guide:state" || payload?.type === "mimo-guide:expression") {
        receiveState(payload);
      }
    };

    window.mimoGuideController = {
      setExpression: triggerExpression,
      setCharacter: selectCharacter,
      setState: applyGuideState,
      expressions: guideExpressions,
      characters: guideCharacters.map((character) => character.id),
    };
    window.addEventListener("mimo-guide:expression", onCustomEvent);
    window.addEventListener("mimo-guide:state", onCustomEvent);
    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("mimo-guide:expression", onCustomEvent);
      window.removeEventListener("mimo-guide:state", onCustomEvent);
      window.removeEventListener("message", onMessage);
      delete window.mimoGuideController;
    };
  }, [applyGuideState, selectCharacter, triggerExpression]);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setExpression((current) => {
        const currentIndex = guideExpressions.indexOf(current);
        const next = guideExpressions[(currentIndex + 1) % guideExpressions.length];
        setEventCount((count) => count + 1);
        return next;
      });
    }, 2400);
    return () => clearInterval(interval);
  }, [autoPlay]);

  return (
    <main className="site-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Mimo home">
          <span className="brand-mark">M</span>
          <span>MIMO</span>
          <small>EXPRESSION ENGINE</small>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#studio">Studio</a>
          <Link to="/canvas">Canvas demo</Link>
          <a href="#install">Install</a>
          <a
            href="https://github.com/markorusic/mimo-avatar-studio"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </header>

      <section className="studio" id="studio">
        <div
          className="stage-panel"
          style={
            {
              "--accent": activeExpression.color,
              "--stage": activeCharacter.stage,
            } as React.CSSProperties
          }
        >
          <div className="panel-heading">
            <span>LIVE GUIDE · {activeCharacter.label.toUpperCase()}</span>
            <span className="coordinates">EVENT #{String(eventCount).padStart(3, "0")}</span>
          </div>
          <MimoGuide
            key={activeCharacter.id}
            character={activeCharacter}
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

        <aside className="control-panel" aria-label="Mimo Guide controls">
          <div className="character-control">
            <div>
              <p>CHARACTER ROSTER</p>
              <span>{activeCharacter.role}</span>
            </div>
            <fieldset className="character-picker" aria-label="Choose a character">
              {guideCharacters.map((character, index) => (
                <button
                  type="button"
                  key={character.id}
                  className={character.id === characterId ? "active" : ""}
                  style={
                    {
                      "--character-stage": character.stage,
                      "--character-accent": character.accent,
                    } as React.CSSProperties
                  }
                  onClick={() => selectCharacter(character.id)}
                  aria-pressed={character.id === characterId}
                  data-testid={`character-${character.id}`}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{character.label}</strong>
                </button>
              ))}
            </fieldset>
          </div>

          <div className="control-heading">
            <div>
              <p>EVENT PANEL</p>
              <h2>Send an expression</h2>
            </div>
            <button
              type="button"
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
                type="button"
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
              </button>
            ))}
          </div>

          <div className="intensity-control">
            <label htmlFor="intensity">
              Motion intensity <output>{Math.round(intensity * 100)}%</output>
            </label>
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
              <span>STUDIO EVENT ADAPTER</span>
              <span className="language">JS</span>
            </div>
            <code>
              <span>window</span>.dispatchEvent(
              <br />
              &nbsp;&nbsp;new CustomEvent(<b>&quot;mimo-guide:expression&quot;</b>, {`{`}
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;detail: {`{`} expression: <b>&quot;thinking&quot;</b> {`}`}
              <br />
              &nbsp;&nbsp;{`}`})<br />
              );
            </code>
          </div>
        </aside>
      </section>

      <section className="install-section" id="install">
        <div className="install-heading">
          <p className="section-kicker">COPY-OWNED · SHADCN-STYLE</p>
          <h2>Bring one guide into your React app.</h2>
          <p>
            Install the reusable component with only the selected character and its eight local
            sprites. No account, hosted runtime, or proprietary animation tool required.
          </p>
        </div>

        <div className="install-grid">
          <article className="install-card install-card-primary">
            <div className="install-card-top">
              <span>CLI</span>
              <strong>Recommended</strong>
            </div>
            <h3>One character, one command</h3>
            <p>
              Run this from your React project. The installer detects shadcn aliases, places the
              reusable component in your components folder, and copies only {activeCharacter.label}
              &apos;s sprites to public.
            </p>
            <StudioCodeBlock code={installCommand} language="shell" />
            <p className="install-note">
              Existing customized files are protected unless you add <code>--force</code>.
            </p>
          </article>

          <article className="install-card">
            <div className="install-card-top">
              <span>MANUAL</span>
              <strong>Copy and own</strong>
            </div>
            <h3>Reusable core + one character</h3>
            <ol>
              <li>
                Copy the four core files from <code>packages/mimo-guide/src</code>.
              </li>
              <li>
                Copy <code>src/characters/{activeCharacter.id}.ts</code> beside the core.
              </li>
              <li>
                Copy only <code>assets/{activeCharacter.id}</code> to{" "}
                <code>public/mimo-guides/{activeCharacter.id}</code>.
              </li>
            </ol>
            <a
              href="https://github.com/markorusic/mimo-avatar-studio/tree/main/packages/mimo-guide"
              target="_blank"
              rel="noreferrer"
            >
              Open the portable kit ↗
            </a>
          </article>
        </div>

        <div className="usage-example">
          <div>
            <span>USE IT</span>
            <strong>Controlled React component</strong>
          </div>
          <StudioCodeBlock code={usageCode} language="tsx" />
        </div>
      </section>

      <footer>
        <p>MIMO / ILLUSTRATED GUIDE KIT</p>
        <p>4 characters · 8 expressions each · MIT licensed</p>
      </footer>
    </main>
  );
}
