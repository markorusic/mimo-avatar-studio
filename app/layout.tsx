import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "Mimo — Sage Expression Avatar",
    description:
      "A friendly illustrated wizard with eight event-driven animated expressions.",
    metadataBase: new URL(origin),
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Sage — One wizard. Every feeling.",
      description: "A friendly illustrated wizard with eight event-driven animated expressions.",
      type: "website",
      url: origin,
      images: [{ url: `${origin}/og-wizard.png`, width: 1672, height: 941, alt: "Sage the friendly illustrated wizard" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Sage — One wizard. Every feeling.",
      description: "A friendly illustrated wizard with eight event-driven animated expressions.",
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
