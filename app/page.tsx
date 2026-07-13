import type { Metadata } from "next";
import AvatarStudio from "./AvatarStudio";

export const metadata: Metadata = {
  title: "Mimo — Sage Expression Avatar",
  description:
    "A friendly illustrated wizard with eight event-driven animated expressions.",
};

export default function Home() {
  return <AvatarStudio />;
}
