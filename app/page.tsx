import type { Metadata } from "next";
import AvatarStudio from "./AvatarStudio";

export const metadata: Metadata = {
  title: "Mimo Avatar Studio",
  description:
    "Try Sage, explore the canvas integration, and copy the avatar into your React app.",
};

export default function Home() {
  return <AvatarStudio />;
}
