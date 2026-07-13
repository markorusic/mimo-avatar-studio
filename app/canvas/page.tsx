import type { Metadata } from "next";
import CanvasDemo from "./CanvasDemo";
import "./canvas.css";

export const metadata: Metadata = {
  title: "Sage Canvas · Mimo Avatar Studio",
  description: "An interactive example of Sage reacting to drawing canvas events.",
};

export default function CanvasPage() {
  return <CanvasDemo />;
}
