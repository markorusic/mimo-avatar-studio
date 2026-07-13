import type { Metadata } from "next";
import CanvasDemo from "./CanvasDemo";
import "./canvas.css";

export const metadata: Metadata = {
  title: "Mimo Canvas · Guide Studio",
  description:
    "An interactive example with switchable illustrated guides reacting to canvas events.",
};

export default function CanvasPage() {
  return <CanvasDemo />;
}
