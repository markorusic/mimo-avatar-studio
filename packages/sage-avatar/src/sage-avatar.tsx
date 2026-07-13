"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import styles from "./sage-avatar.module.css";

export const sageExpressions = [
  "idle",
  "happy",
  "listening",
  "thinking",
  "surprised",
  "sad",
  "angry",
  "sleepy",
] as const;

export type SageExpression = (typeof sageExpressions)[number];

export type SageAvatarCharacter = {
  id: string;
  label: string;
  assetPath: string;
  assetExtension?: string;
  stage: string;
};

export const sageCharacter: SageAvatarCharacter = {
  id: "sage",
  label: "Sage",
  assetPath: "/avatars/sage",
  assetExtension: "webp",
  stage: "#51408b",
};

export type SageAvatarProps = {
  expression?: SageExpression;
  intensity?: number;
  character?: SageAvatarCharacter;
  assetPath?: string;
  size?: CSSProperties["width"];
  className?: string;
  style?: CSSProperties;
  label?: string;
  decorative?: boolean;
  transitionDuration?: number;
  animateExpressionShift?: boolean;
  expressionShiftCooldown?: number;
  showExpressionEffects?: boolean;
};

export function isSageExpression(value: unknown): value is SageExpression {
  return typeof value === "string" && sageExpressions.includes(value as SageExpression);
}

export function SageAvatar({
  expression = "idle",
  intensity = 1,
  character = sageCharacter,
  assetPath,
  size = 520,
  className,
  style,
  label,
  decorative = false,
  transitionDuration = 520,
  animateExpressionShift = true,
  expressionShiftCooldown = 240,
  showExpressionEffects = true,
}: SageAvatarProps) {
  const previousExpression = useRef(expression);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionAvailableAt = useRef(0);
  const transitionFrame = useRef<number | null>(null);
  const transitionTimer = useRef<number | null>(null);
  const queuedTransitionTimer = useRef<number | null>(null);

  useEffect(() => {
    const clearScheduledTransition = () => {
      if (queuedTransitionTimer.current !== null) {
        window.clearTimeout(queuedTransitionTimer.current);
        queuedTransitionTimer.current = null;
      }
    };

    if (!animateExpressionShift) {
      previousExpression.current = expression;
      transitionAvailableAt.current = 0;
      clearScheduledTransition();

      if (transitionFrame.current !== null) {
        cancelAnimationFrame(transitionFrame.current);
        transitionFrame.current = null;
      }

      if (transitionTimer.current !== null) {
        window.clearTimeout(transitionTimer.current);
        transitionTimer.current = null;
      }

      const resetTimer = window.setTimeout(() => setIsTransitioning(false), 0);
      return () => window.clearTimeout(resetTimer);
    }

    if (previousExpression.current === expression) return;

    previousExpression.current = expression;
    clearScheduledTransition();

    const safeTransitionDuration = Math.max(0, transitionDuration);
    const safeCooldown = Math.max(0, expressionShiftCooldown);

    const playTransition = () => {
      queuedTransitionTimer.current = null;
      transitionAvailableAt.current = Date.now() + safeTransitionDuration + safeCooldown;

      if (transitionFrame.current !== null) {
        cancelAnimationFrame(transitionFrame.current);
      }

      if (transitionTimer.current !== null) {
        window.clearTimeout(transitionTimer.current);
      }

      setIsTransitioning(false);
      transitionFrame.current = requestAnimationFrame(() => {
        transitionFrame.current = null;
        setIsTransitioning(true);
        transitionTimer.current = window.setTimeout(() => {
          transitionTimer.current = null;
          setIsTransitioning(false);
        }, safeTransitionDuration);
      });
    };

    const wait = transitionAvailableAt.current - Date.now();
    if (wait <= 0) {
      playTransition();
      return;
    }

    queuedTransitionTimer.current = window.setTimeout(playTransition, wait);
  }, [
    animateExpressionShift,
    expression,
    expressionShiftCooldown,
    transitionDuration,
  ]);

  useEffect(() => () => {
    if (transitionFrame.current !== null) {
      cancelAnimationFrame(transitionFrame.current);
    }
    if (transitionTimer.current !== null) {
      window.clearTimeout(transitionTimer.current);
    }
    if (queuedTransitionTimer.current !== null) {
      window.clearTimeout(queuedTransitionTimer.current);
    }
  }, []);

  const resolvedAssetPath = (assetPath ?? character.assetPath).replace(/\/$/, "");
  const extension = character.assetExtension ?? "webp";
  const safeIntensity = Math.min(3, Math.max(0.2, intensity));
  const resolvedSize = typeof size === "number" ? `${size}px` : size;
  const accessibleLabel = label ?? `${character.label} is ${expression}`;

  return (
    <div
      className={[
        styles["sage-avatar-scene"],
        animateExpressionShift && isTransitioning ? styles["sage-avatar-transitioning"] : "",
        className ?? "",
      ].filter(Boolean).join(" ")}
      data-expression={expression}
      data-character={character.id}
      data-expression-shift={animateExpressionShift ? "on" : "off"}
      style={{
        ...style,
        "--sage-avatar-intensity": safeIntensity,
        "--sage-avatar-size": resolvedSize,
      } as CSSProperties}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : accessibleLabel}
      role={decorative ? undefined : "img"}
    >
      <div className={`${styles["sage-avatar-orbit"]} ${styles["sage-avatar-orbit-one"]}`} aria-hidden="true" />
      <div className={`${styles["sage-avatar-orbit"]} ${styles["sage-avatar-orbit-two"]}`} aria-hidden="true" />
      {showExpressionEffects && (
        <>
          <div className={`${styles["sage-avatar-signal"]} ${styles["sage-avatar-signal-left"]}`} aria-hidden="true"><i /><i /><i /></div>
          <div className={styles["sage-avatar-thoughts"]} aria-hidden="true"><i /><i /><i /></div>
          <div className={styles["sage-avatar-sleep-notes"]} aria-hidden="true"><span>z</span><span>z</span><span>z</span></div>
        </>
      )}

      <div className={styles["sage-avatar-sprite-rig"]}>
        <div className={styles["sage-avatar-sprite-shadow"]} aria-hidden="true" />
        {sageExpressions.map((spriteExpression) => (
          <img
            key={spriteExpression}
            className={`${styles["sage-avatar-expression-sprite"]} ${spriteExpression === expression ? styles["sage-avatar-active"] : ""}`}
            src={`${resolvedAssetPath}/${spriteExpression}.${extension}`}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}

export default SageAvatar;
