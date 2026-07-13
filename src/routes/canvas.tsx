import { createFileRoute } from "@tanstack/react-router";
import CanvasDemo from "../components/CanvasDemo";
import "../styles/canvas.css";

export const Route = createFileRoute("/canvas")({
  head: () => ({
    meta: [
      { title: "Mimo Canvas · Guide Studio" },
      {
        name: "description",
        content:
          "An interactive example with switchable illustrated guides reacting to canvas events.",
      },
    ],
  }),
  component: CanvasDemo,
});
