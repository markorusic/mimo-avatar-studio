import type { Metadata } from "next";
import "./globals.css";

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const origin = process.env.NEXT_PUBLIC_SITE_URL
  ?? (productionHost ? `https://${productionHost}` : "http://localhost:3000");

export const metadata: Metadata = {
  title: {
    default: "Mimo Avatar Studio",
    template: "%s",
  },
  description: "A portable React avatar with eight illustrated, event-driven expressions.",
  metadataBase: new URL(origin),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Mimo Avatar Studio",
    description: "Try Sage, explore the canvas integration, and copy the avatar into your React app.",
    type: "website",
    url: origin,
    images: [{ url: "/og-wizard.png", width: 1672, height: 941, alt: "Sage the friendly illustrated wizard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mimo Avatar Studio",
    description: "A portable React avatar with eight illustrated, event-driven expressions.",
    images: ["/og-wizard.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
