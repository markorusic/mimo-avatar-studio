import type { GuideCharacter } from "../guide-character";
import { MimoGuide, type MimoGuideProps } from "../mimo-guide";

export const socratesCharacter = {
  id: "socrates",
  label: "Socrates",
  role: "Greek philosopher",
  assetPath: "/mimo-guides/socrates",
  assetExtension: "webp",
  stage: "#536a7c",
  accent: "#f1c86e",
} as const satisfies GuideCharacter;

export type SocratesGuideProps = Omit<MimoGuideProps, "character">;

export function SocratesGuide(props: SocratesGuideProps) {
  return <MimoGuide {...props} character={socratesCharacter} />;
}
