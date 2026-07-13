"use client";

import type { CSSProperties } from "react";
import styles from "./SpriteAvatar.module.css";

export const expressionIds = [
  "idle",
  "happy",
  "listening",
  "thinking",
  "surprised",
  "sad",
  "angry",
  "sleepy",
] as const;

export type ExpressionId = (typeof expressionIds)[number];

export type SpriteCharacter = {
  id: string;
  label: string;
  assetPath: string;
  stage: string;
};

export const sageCharacter: SpriteCharacter = {
  id: "sage",
  label: "Sage",
  assetPath: "/avatars/sage",
  stage: "#51408b",
};

export function isExpression(value: unknown): value is ExpressionId {
  return typeof value === "string" && expressionIds.includes(value as ExpressionId);
}

export default function SpriteAvatar({
  expression,
  intensity = 1,
  character = sageCharacter,
  transitioning = false,
}: {
  expression: ExpressionId;
  intensity?: number;
  character?: SpriteCharacter;
  transitioning?: boolean;
}) {
  return (
    <div
      className={`${styles.scene} ${transitioning ? styles.transitioning : ""}`}
      data-expression={expression}
      data-character={character.id}
      style={{ "--intensity": intensity } as CSSProperties}
      aria-label={`${character.label} is ${expression}`}
      role="img"
    >
      <div className={`${styles.orbit} ${styles.orbitOne}`} aria-hidden="true" />
      <div className={`${styles.orbit} ${styles.orbitTwo}`} aria-hidden="true" />
      <div className={`${styles.signal} ${styles.signalLeft}`} aria-hidden="true"><i /><i /><i /></div>
      <div className={styles.thoughts} aria-hidden="true"><i /><i /><i /></div>
      <div className={styles.sleepNotes} aria-hidden="true"><span>z</span><span>z</span><span>z</span></div>

      <div className={styles.spriteRig}>
        <div className={styles.spriteShadow} aria-hidden="true" />
        {expressionIds.map((spriteExpression) => (
          <img
            key={spriteExpression}
            className={`${styles.expressionSprite} ${spriteExpression === expression ? styles.active : ""}`}
            src={`${character.assetPath}/${spriteExpression}.webp`}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}
