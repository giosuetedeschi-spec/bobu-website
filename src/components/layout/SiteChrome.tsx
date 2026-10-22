"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return children;

  return (
    <>
      <Navbar />
      <Box component="main" sx={{ pt: { xs: 9, md: 10 }, minHeight: "100vh" }}>
        {children}
      </Box>
      <Footer />
    </>
  );
}
