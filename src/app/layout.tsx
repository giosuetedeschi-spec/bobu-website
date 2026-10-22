import type { Metadata } from "next";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { ThemeRegistry } from "@/components/layout/ThemeRegistry";
import "./globals.css";

export const metadata: Metadata = {
  title: "BobuOS | Desktop",
  description: "BobuOS - A desktop-like web experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/*
        No `overflow: hidden` here: it belongs to the desktop OS route, which
        sets it on its own root. Putting it on <body> made every content page
        (CV, portfolio, projects) unscrollable below the fold.
      */}
      <body style={{ margin: 0, padding: 0, background: "#fafafa" }}>
        <ThemeRegistry>
            <SiteChrome>{children}</SiteChrome>
        </ThemeRegistry>
      </body>
    </html>
  );
}
