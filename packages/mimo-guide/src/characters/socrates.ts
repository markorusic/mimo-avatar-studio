import type { GuideCharacter } from "../guide-character";

const socratesCharacter = {
  id: "socrates",
  label: "Socrates",
  role: "Greek philosopher",
  assetPath: "/mimo-guides/socrates",
  assetExtension: "webp",
  stage: "#536a7c",
  accent: "#f1c86e",
} as const satisfies GuideCharacter;

export default socratesCharacter;
