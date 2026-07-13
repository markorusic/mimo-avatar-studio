"use client";

import {
  ArrowLeft,
  Brush,
  Download,
  Eraser,
  Redo2,
  RotateCcw,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import {
  type ComponentProps,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { type GuideExpression, MimoGuide } from "@/packages/mimo-guide/src";
import {
  type GuideCharacterId,
  getGuideCharacter,
  guideCharacters,
  isGuideCharacterId,
} from "@/packages/mimo-guide/src/characters";

const PAPER_COLOR = "#fffdf7";
const PALETTE = ["#17181d", "#6651d8", "#f15b45", "#22a77a", "#e5a91a"];

type Tool = "brush" | "eraser";

type Reaction = {
  expression: GuideExpression;
  message: string;
};

type CanvasButtonProps = ComponentProps<"button"> & {
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "icon";
};

const idleReaction: Reaction = {
  expression: "idle",
  message: "Ready when you are.",
};

function CanvasButton({
  className = "",
  variant = "ghost",
  size = "sm",
  ...props
}: CanvasButtonProps) {
  return (
    <button
      className={`canvas-button canvas-button-${variant} canvas-button-${size} ${className}`.trim()}
      {...props}
    />
  );
}

export default function CanvasDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const historyRef = useRef<string[]>([]);
  const redoRef = useRef<string[]>([]);
  const reactionTimerRef = useRef<number | null>(null);

  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState(PALETTE[0]);
  const [brushSize, setBrushSize] = useState(6);
  const [historyState, setHistoryState] = useState({ undo: 0, redo: 0 });
  const [reaction, setReaction] = useState<Reaction>(idleReaction);
  const [eventPop, setEventPop] = useState(true);
  const [characterId, setCharacterId] = useState<GuideCharacterId>("sage");
  const activeCharacter = getGuideCharacter(characterId);

  const updateHistoryState = useCallback(() => {
    setHistoryState({
      undo: historyRef.current.length,
      redo: redoRef.current.length,
    });
  }, []);

  const reactAsGuide = useCallback((next: Reaction, duration = 1700) => {
    if (reactionTimerRef.current) window.clearTimeout(reactionTimerRef.current);
    setReaction(next);
    reactionTimerRef.current = window.setTimeout(() => {
      setReaction(idleReaction);
      reactionTimerRef.current = null;
    }, duration);
  }, []);

  const getCanvasContext = useCallback(() => {
    return canvasRef.current?.getContext("2d") ?? null;
  }, []);

  const recordSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    historyRef.current.push(canvas.toDataURL("image/png"));
    if (historyRef.current.length > 30) historyRef.current.shift();
    redoRef.current = [];
    updateHistoryState();
  }, [updateHistoryState]);

  const restoreSnapshot = useCallback(
    (snapshot: string) => {
      const canvas = canvasRef.current;
      const context = getCanvasContext();
      if (!canvas || !context) return;

      const image = new Image();
      image.onload = () => {
        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        context.restore();
      };
      image.src = snapshot;
    },
    [getCanvasContext],
  );

  const fillCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = getCanvasContext();
    if (!canvas || !context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PAPER_COLOR;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }, [getCanvasContext]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      const previous = document.createElement("canvas");
      previous.width = canvas.width;
      previous.height = canvas.height;
      previous.getContext("2d")?.drawImage(canvas, 0, 0);

      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = Math.round(bounds.width * ratio);
      const nextHeight = Math.round(bounds.height * ratio);
      if (canvas.width === nextWidth && canvas.height === nextHeight) return;

      canvas.width = nextWidth;
      canvas.height = nextHeight;
      const context = canvas.getContext("2d");
      if (!context) return;

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.fillStyle = PAPER_COLOR;
      context.fillRect(0, 0, bounds.width, bounds.height);
      if (previous.width && previous.height) {
        context.drawImage(
          previous,
          0,
          0,
          previous.width,
          previous.height,
          0,
          0,
          bounds.width,
          bounds.height,
        );
      }
    };

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    resizeCanvas();
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (reactionTimerRef.current) window.clearTimeout(reactionTimerRef.current);
    },
    [],
  );

  const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  };

  const startDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const context = getCanvasContext();
    if (!context) return;

    recordSnapshot();
    isDrawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = tool === "eraser" ? brushSize * 2.4 : brushSize;
    context.strokeStyle = tool === "eraser" ? PAPER_COLOR : color;

    reactAsGuide(
      {
        expression: tool === "eraser" ? "thinking" : "listening",
        message: tool === "eraser" ? "Cleaning that edge…" : "I’m following your line.",
      },
      2400,
    );
  };

  const continueDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const context = getCanvasContext();
    if (!context) return;
    const point = pointFromEvent(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    getCanvasContext()?.closePath();
    reactAsGuide({ expression: "happy", message: "That stroke has character!" });
  };

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    const previous = historyRef.current.pop();
    if (!canvas || !previous) return;
    redoRef.current.push(canvas.toDataURL("image/png"));
    restoreSnapshot(previous);
    updateHistoryState();
    reactAsGuide({ expression: "sad", message: "Rewinding that idea." });
  }, [reactAsGuide, restoreSnapshot, updateHistoryState]);

  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    const next = redoRef.current.pop();
    if (!canvas || !next) return;
    historyRef.current.push(canvas.toDataURL("image/png"));
    restoreSnapshot(next);
    updateHistoryState();
    reactAsGuide({ expression: "happy", message: "Back it comes!" });
  }, [reactAsGuide, restoreSnapshot, updateHistoryState]);

  const clearCanvas = useCallback(() => {
    recordSnapshot();
    fillCanvas();
    reactAsGuide({ expression: "surprised", message: "A completely fresh page!" }, 2000);
  }, [fillCanvas, reactAsGuide, recordSnapshot]);

  const resetCanvas = useCallback(() => {
    fillCanvas();
    historyRef.current = [];
    redoRef.current = [];
    updateHistoryState();
    reactAsGuide({ expression: "idle", message: "New sketch, new possibilities." }, 2200);
  }, [fillCanvas, reactAsGuide, updateHistoryState]);

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "sage-canvas-sketch.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    reactAsGuide({ expression: "happy", message: "Your sketch is safely exported." }, 2200);
  };

  const chooseTool = useCallback(
    (nextTool: Tool) => {
      setTool(nextTool);
      reactAsGuide(
        nextTool === "eraser"
          ? { expression: "thinking", message: "Precision mode: eraser ready." }
          : { expression: "happy", message: "Brush ready. Make a mark!" },
      );
    },
    [reactAsGuide],
  );

  const chooseCharacter = useCallback(
    (nextCharacter: string) => {
      if (!isGuideCharacterId(nextCharacter)) return;
      const character = getGuideCharacter(nextCharacter);
      setCharacterId(nextCharacter);
      reactAsGuide({
        expression: "happy",
        message: `${character.label} is ready to help.`,
      });
    },
    [reactAsGuide],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (event.target instanceof HTMLInputElement) return;
      if (event.key.toLowerCase() === "b") chooseTool("brush");
      if (event.key.toLowerCase() === "e") chooseTool("eraser");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chooseTool, redo, undo]);

  return (
    <div
      className="sage-canvas-page"
      style={
        {
          "--primary": activeCharacter.accent,
          "--ring": activeCharacter.accent,
        } as React.CSSProperties
      }
    >
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-icon">
            <Sparkles aria-hidden="true" />
          </span>
          <div>
            <strong>Mimo Canvas</strong>
            <span>Interactive integration example</span>
          </div>
        </div>
        <div className="canvas-header-actions">
          <label className="canvas-character-select">
            <span>Guide</span>
            <select
              value={characterId}
              onChange={(event) => chooseCharacter(event.target.value)}
              aria-label="Canvas guide character"
            >
              {guideCharacters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.label}
                </option>
              ))}
            </select>
          </label>
          <Link className="canvas-back-link" href="/">
            <ArrowLeft aria-hidden="true" /> Studio
          </Link>
        </div>
      </header>

      <section className="toolbar" aria-label="Drawing controls">
        <fieldset className="toolbar-group tool-picker" aria-label="Drawing tool">
          <CanvasButton
            variant={tool === "brush" ? "default" : "ghost"}
            onClick={() => chooseTool("brush")}
            aria-pressed={tool === "brush"}
          >
            <Brush /> Brush <kbd>B</kbd>
          </CanvasButton>
          <CanvasButton
            variant={tool === "eraser" ? "default" : "ghost"}
            onClick={() => chooseTool("eraser")}
            aria-pressed={tool === "eraser"}
          >
            <Eraser /> Eraser <kbd>E</kbd>
          </CanvasButton>
        </fieldset>

        <div className="toolbar-divider" />

        <fieldset className="toolbar-group color-picker" aria-label="Brush color">
          {PALETTE.map((paletteColor) => (
            <button
              type="button"
              key={paletteColor}
              className="color-swatch"
              style={{ "--swatch-color": paletteColor } as React.CSSProperties}
              onClick={() => {
                setColor(paletteColor);
                setTool("brush");
                reactAsGuide({
                  expression: "surprised",
                  message: "That color changes everything!",
                });
              }}
              aria-label={`Use color ${paletteColor}`}
              aria-pressed={color === paletteColor && tool === "brush"}
            />
          ))}
        </fieldset>

        <div className="toolbar-divider" />

        <label className="toolbar-group size-control">
          <span>Size</span>
          <input
            type="range"
            value={brushSize}
            min={2}
            max={24}
            step={1}
            onChange={(event) => {
              const value = Number(event.target.value);
              setBrushSize(value);
              reactAsGuide(
                { expression: "thinking", message: `A ${value}px stroke—good choice.` },
                1000,
              );
            }}
            aria-label="Brush size"
          />
          <output>{brushSize}px</output>
        </label>

        <div className="toolbar-spacer" />

        <div className="toolbar-group history-controls">
          <CanvasButton
            size="icon"
            onClick={undo}
            disabled={!historyState.undo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 />
          </CanvasButton>
          <CanvasButton
            size="icon"
            onClick={redo}
            disabled={!historyState.redo}
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 />
          </CanvasButton>
          <CanvasButton
            size="icon"
            onClick={clearCanvas}
            aria-label="Clear canvas"
            title="Clear canvas"
          >
            <Trash2 />
          </CanvasButton>
          <CanvasButton variant="outline" onClick={downloadCanvas}>
            <Download /> Export
          </CanvasButton>
        </div>
      </section>

      <main className="workspace">
        <div className="canvas-heading">
          <div>
            <span>Untitled sketch</span>
            <small>Responsive paper · PNG export</small>
          </div>
          <CanvasButton onClick={resetCanvas}>
            <RotateCcw /> New canvas
          </CanvasButton>
        </div>

        <div className="canvas-frame">
          <canvas
            ref={canvasRef}
            className="drawing-canvas"
            aria-label="Drawing canvas"
            onPointerDown={startDrawing}
            onPointerMove={continueDrawing}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={(event) => {
              if (event.buttons === 0) stopDrawing(event);
            }}
          />
          <div className="canvas-corner-label">
            {activeCharacter.label.toUpperCase()} /{" "}
            {String(guideCharacters.findIndex((item) => item.id === characterId) + 1).padStart(
              2,
              "0",
            )}
          </div>
          <aside
            className="sage-helper"
            data-expression={reaction.expression}
            data-character={activeCharacter.id}
            aria-label={`${activeCharacter.label} drawing assistant`}
          >
            <div className="sage-message" aria-live="polite">
              <div className="sage-message-header">
                <span className="sage-message-label">{activeCharacter.label} says</span>
                <button
                  type="button"
                  className="sage-pop-toggle"
                  aria-label={`${eventPop ? "Disable" : "Enable"} event pop animation`}
                  aria-pressed={eventPop}
                  onClick={() => {
                    const nextValue = !eventPop;
                    setEventPop(nextValue);
                    reactAsGuide({
                      expression: nextValue ? "happy" : "listening",
                      message: nextValue ? "Event pop is on." : "Crossfade only—nice and calm.",
                    });
                  }}
                >
                  Pop <i aria-hidden="true" />
                </button>
              </div>
              <p>{reaction.message}</p>
              <span className="sage-thought-bridge" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
            <MimoGuide
              key={activeCharacter.id}
              character={activeCharacter}
              expression={reaction.expression}
              intensity={0.9}
              size={230}
              className="mimo-guide-helper"
              label={`${activeCharacter.label}, your drawing assistant, is ${reaction.expression}`}
              animateExpressionShift={eventPop}
              expressionShiftCooldown={320}
              showExpressionEffects={reaction.expression !== "thinking"}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
