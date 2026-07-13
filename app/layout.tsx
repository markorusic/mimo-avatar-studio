import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "Mimo — Animated Expression Avatar",
    description:
      "A playful animated avatar with event-driven expressions and fluid transitions.",
    metadataBase: new URL(origin),
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Mimo — One face. Every feeling.",
      description: "An animated avatar with event-driven expressions and fluid transitions.",
      type: "website",
      url: origin,
      images: [{ url: `${origin}/og.png`, width: 1672, height: 941, alt: "Mimo animated expression avatar" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Mimo — One face. Every feeling.",
      description: "An animated avatar with event-driven expressions and fluid transitions.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
