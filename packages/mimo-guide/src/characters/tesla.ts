import type { GuideCharacter } from "../guide-character";

const teslaCharacter = {
  id: "tesla",
  label: "Nikola Tesla",
  role: "Visionary inventor",
  assetPath: "/mimo-guides/tesla",
  assetExtension: "webp",
  stage: "#214859",
  accent: "#67e7ff",
} as const satisfies GuideCharacter;

export default teslaCharacter;
