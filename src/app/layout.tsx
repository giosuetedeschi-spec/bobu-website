import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

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
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      {/*
        No `overflow: hidden` here: it belongs to the desktop OS route, which
        sets it on its own root. Putting it on <body> made every content page
        (CV, portfolio, projects) unscrollable below the fold.
      */}
      <body style={{ margin: 0, padding: 0, background: "#0a0a0a" }}>
        {/*
          Emotion needs its cache wired into the App Router, otherwise MUI's
          styles are only injected on the client: the server markup does not
          match, React throws a hydration error and re-renders the whole tree,
          and the page flashes unstyled on the way in.
        */}
        <AppRouterCacheProvider options={{ key: "mui" }}>
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
