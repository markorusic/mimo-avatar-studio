import type { Metadata } from "next";
import AvatarStudio from "./AvatarStudio";

export const metadata: Metadata = {
  title: "Mimo — Animated Expression Avatar",
  description:
    "A playful animated avatar with event-driven expressions and fluid transitions.",
};

export default function Home() {
  return <AvatarStudio />;
}
