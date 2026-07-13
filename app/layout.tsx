import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "Mimo — Multi-character Expression Avatar",
    description:
      "Four animated characters with event-driven expressions and fluid transitions.",
    metadataBase: new URL(origin),
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Mimo — Many faces. Every feeling.",
      description: "Four animated characters with event-driven expressions and fluid transitions.",
      type: "website",
      url: origin,
      images: [{ url: `${origin}/og-characters.png`, width: 1672, height: 941, alt: "Four Mimo animated characters" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Mimo — Many faces. Every feeling.",
      description: "Four animated characters with event-driven expressions and fluid transitions.",
      images: [`${origin}/og-characters.png`],
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
