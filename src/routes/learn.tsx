import { createFileRoute } from "@tanstack/react-router";
import LearningLab from "../components/LearningLab";
import "../styles/learn.css";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Mimo Learning Lab · Interactive Avatar Demo" },
      {
        name: "description",
        content:
          "A guided learning experience where illustrated Mimo characters listen, think, and react to real product state.",
      },
    ],
  }),
  component: LearningLab,
});
