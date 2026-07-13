export type GuideCharacter = {
  id: string;
  label: string;
  role: string;
  assetPath: string;
  assetExtension?: string;
  stage: string;
  accent: string;
};

export const guideCharacters = [
  {
    id: "sage",
    label: "Sage",
    role: "Friendly wizard",
    assetPath: "/mimo-guides/sage",
    assetExtension: "webp",
    stage: "#51408b",
    accent: "#c8ff4d",
  },
  {
    id: "socrates",
    label: "Socrates",
    role: "Greek philosopher",
    assetPath: "/mimo-guides/socrates",
    assetExtension: "webp",
    stage: "#536a7c",
    accent: "#f1c86e",
  },
  {
    id: "tesla",
    label: "Nikola Tesla",
    role: "Visionary inventor",
    assetPath: "/mimo-guides/tesla",
    assetExtension: "webp",
    stage: "#214859",
    accent: "#67e7ff",
  },
  {
    id: "leonardo",
    label: "Leonardo",
    role: "Renaissance polymath",
    assetPath: "/mimo-guides/leonardo",
    assetExtension: "webp",
    stage: "#71354c",
    accent: "#e0bb6e",
  },
] as const satisfies readonly GuideCharacter[];

export type GuideCharacterId = (typeof guideCharacters)[number]["id"];
export type RegisteredGuideCharacter = (typeof guideCharacters)[number];

export const sageCharacter = guideCharacters[0];
export const socratesCharacter = guideCharacters[1];
export const teslaCharacter = guideCharacters[2];
export const leonardoCharacter = guideCharacters[3];

export function isGuideCharacterId(value: unknown): value is GuideCharacterId {
  return typeof value === "string" && guideCharacters.some((character) => character.id === value);
}

export function getGuideCharacter(id: GuideCharacterId): RegisteredGuideCharacter {
  return guideCharacters.find((character) => character.id === id) ?? sageCharacter;
}
