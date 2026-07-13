import type { Metadata } from "next";
import "./globals.css";

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const origin =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (productionHost ? `https://${productionHost}` : "http://localhost:3000");

export const metadata: Metadata = {
  title: {
    default: "Mimo Guide Studio",
    template: "%s",
  },
  description:
    "A portable React guide roster with four characters and eight event-driven expressions.",
  metadataBase: new URL(origin),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Mimo Guide Studio",
    description:
      "Try four illustrated characters, explore their expressions, and copy them into your React app.",
    type: "website",
    url: origin,
    images: [
      {
        url: "/og-wizard.png",
        width: 1672,
        height: 941,
        alt: "Sage the friendly illustrated wizard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mimo Guide Studio",
    description: "A portable React guide roster with four characters and eight expressions each.",
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
