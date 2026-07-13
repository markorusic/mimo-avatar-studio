import leonardoCharacter from "./leonardo";
import sageCharacter from "./sage";
import socratesCharacter from "./socrates";
import teslaCharacter from "./tesla";

export { leonardoCharacter, sageCharacter, socratesCharacter, teslaCharacter };

export const guideCharacters = [
  sageCharacter,
  socratesCharacter,
  teslaCharacter,
  leonardoCharacter,
] as const;

export type GuideCharacterId = (typeof guideCharacters)[number]["id"];
export type RegisteredGuideCharacter = (typeof guideCharacters)[number];

export function isGuideCharacterId(value: unknown): value is GuideCharacterId {
  return typeof value === "string" && guideCharacters.some((character) => character.id === value);
}

export function getGuideCharacter(id: GuideCharacterId): RegisteredGuideCharacter {
  return guideCharacters.find((character) => character.id === id) ?? sageCharacter;
}
