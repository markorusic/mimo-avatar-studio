import type { GuideCharacter } from "../guide-character";
import { MimoGuide, type MimoGuideProps } from "../mimo-guide";

export const leonardoCharacter = {
  id: "leonardo",
  label: "Leonardo",
  role: "Renaissance polymath",
  assetPath: "/mimo-guides/leonardo",
  assetExtension: "webp",
  stage: "#71354c",
  accent: "#e0bb6e",
} as const satisfies GuideCharacter;

export type LeonardoGuideProps = Omit<MimoGuideProps, "character">;

export function LeonardoGuide(props: LeonardoGuideProps) {
  return <MimoGuide {...props} character={leonardoCharacter} />;
}
