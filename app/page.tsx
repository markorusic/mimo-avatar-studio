import type { Metadata } from "next";
import AvatarStudio from "./AvatarStudio";

export const metadata: Metadata = {
  title: "Mimo — Multi-character Expression Avatar",
  description:
    "Five animated characters with event-driven expressions and fluid transitions.",
};

export default function Home() {
  return <AvatarStudio />;
}
