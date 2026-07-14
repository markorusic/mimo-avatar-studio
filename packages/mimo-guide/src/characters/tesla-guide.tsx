import type { GuideCharacter } from "../guide-character";
import { MimoGuide, type MimoGuideProps } from "../mimo-guide";

export const teslaCharacter = {
  id: "tesla",
  label: "Nikola Tesla",
  role: "Visionary inventor",
  assetPath: "/mimo-guides/tesla",
  assetExtension: "webp",
  stage: "#214859",
  accent: "#67e7ff",
} as const satisfies GuideCharacter;

export type TeslaGuideProps = Omit<MimoGuideProps, "character">;

export function TeslaGuide(props: TeslaGuideProps) {
  return <MimoGuide {...props} character={teslaCharacter} />;
}
