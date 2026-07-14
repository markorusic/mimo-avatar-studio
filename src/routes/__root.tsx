import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import "../styles/globals.css";

const title = "Mimo Guide Studio";
const description =
  "A portable React guide roster with four characters and 15 event-driven expressions.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      {
        property: "og:description",
        content:
          "Try four illustrated characters, explore their expressions, and copy them into your React app.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-wizard.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      {
        name: "twitter:description",
        content: "A portable React guide roster with four characters and 15 expressions each.",
      },
      { name: "twitter:image", content: "/og-wizard.png" },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg" },
      { rel: "shortcut icon", href: "/favicon.svg" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
