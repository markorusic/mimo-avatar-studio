import { createFileRoute } from "@tanstack/react-router";
import GuideStudio from "../components/GuideStudio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mimo Guide Studio" },
      {
        name: "description",
        content:
          "Try four illustrated characters, explore their expressions, and copy them into your React app.",
      },
    ],
  }),
  component: GuideStudio,
});
