import type { GuideCharacter } from "../guide-character";

const leonardoCharacter = {
  id: "leonardo",
  label: "Leonardo",
  role: "Renaissance polymath",
  assetPath: "/mimo-guides/leonardo",
  assetExtension: "webp",
  stage: "#71354c",
  accent: "#e0bb6e",
} as const satisfies GuideCharacter;

export default leonardoCharacter;
