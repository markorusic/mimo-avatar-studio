import type { GuideCharacter } from "../guide-character";

const sageCharacter = {
  id: "sage",
  label: "Sage",
  role: "Friendly wizard",
  assetPath: "/mimo-guides/sage",
  assetExtension: "webp",
  stage: "#51408b",
  accent: "#c8ff4d",
} as const satisfies GuideCharacter;

export default sageCharacter;
