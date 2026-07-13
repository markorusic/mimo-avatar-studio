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
      "Five animated characters with event-driven expressions and fluid transitions.",
    metadataBase: new URL(origin),
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Mimo — Many faces. Every feeling.",
      description: "Five animated characters with event-driven expressions and fluid transitions.",
      type: "website",
      url: origin,
      images: [{ url: `${origin}/og-wizard.png`, width: 1672, height: 941, alt: "Sage the friendly wizard with the Mimo character roster" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Mimo — Many faces. Every feeling.",
      description: "Five animated characters with event-driven expressions and fluid transitions.",
      images: [`${origin}/og-wizard.png`],
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
