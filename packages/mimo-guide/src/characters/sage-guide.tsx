import type { GuideCharacter } from "../guide-character";
import { MimoGuide, type MimoGuideProps } from "../mimo-guide";

export const sageCharacter = {
  id: "sage",
  label: "Sage",
  role: "Friendly wizard",
  assetPath: "/mimo-guides/sage",
  assetExtension: "webp",
  stage: "#51408b",
  accent: "#c8ff4d",
} as const satisfies GuideCharacter;

export type SageGuideProps = Omit<MimoGuideProps, "character">;

export function SageGuide(props: SageGuideProps) {
  return <MimoGuide {...props} character={sageCharacter} />;
}
