import type { Metadata } from "next";
import GuideStudio from "./GuideStudio";

export const metadata: Metadata = {
  title: "Mimo Guide Studio",
  description:
    "Try four illustrated characters, explore their expressions, and copy them into your React app.",
};

export default function Home() {
  return <GuideStudio />;
}
