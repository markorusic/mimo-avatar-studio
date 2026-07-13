export const characters = [
  {
    id: "mimo",
    label: "Mimo",
    kind: "Original",
    shape: "human",
    stage: "#7657ff",
    skin: "#efe7d5",
    skinShadow: "#d6ccb8",
    hair: "#17191f",
    accent: "#c8ff4d",
    eye: "#17191f",
    cheek: "#ff8c83",
  },
  {
    id: "nova",
    label: "Nova",
    kind: "Robot",
    shape: "robot",
    stage: "#126c87",
    skin: "#d9f6f7",
    skinShadow: "#7fc9d4",
    hair: "#263238",
    accent: "#5ee8ff",
    eye: "#123c48",
    cheek: "#5ee8ff",
  },
  {
    id: "pip",
    label: "Pip",
    kind: "Cat",
    shape: "cat",
    stage: "#ce547b",
    skin: "#ffd9c8",
    skinShadow: "#e8a994",
    hair: "#5b3448",
    accent: "#ffdf5d",
    eye: "#402437",
    cheek: "#ff7198",
  },
  {
    id: "moss",
    label: "Moss",
    kind: "Alien",
    shape: "alien",
    stage: "#34704f",
    skin: "#b9f28f",
    skinShadow: "#79c56d",
    hair: "#23543a",
    accent: "#d7ff66",
    eye: "#452f68",
    cheek: "#78d69a",
  },
] as const;

export type Character = (typeof characters)[number];
export type CharacterId = Character["id"];

export const characterIds = characters.map((character) => character.id);

export function isCharacter(value: unknown): value is CharacterId {
  return typeof value === "string" && characterIds.includes(value as CharacterId);
}
