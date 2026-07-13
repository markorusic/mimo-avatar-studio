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
  showExpressionEffects = true,
}: SageAvatarProps) {
  const previousExpression = useRef(expression);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!animateExpressionShift) {
      previousExpression.current = expression;
      const resetTimer = window.setTimeout(() => setIsTransitioning(false), 0);
      return () => window.clearTimeout(resetTimer);
    }

    if (previousExpression.current === expression) return;

    previousExpression.current = expression;
    setIsTransitioning(false);

    const frame = requestAnimationFrame(() => setIsTransitioning(true));
    const timer = window.setTimeout(
      () => setIsTransitioning(false),
      transitionDuration,
    );

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [animateExpressionShift, expression, transitionDuration]);

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
