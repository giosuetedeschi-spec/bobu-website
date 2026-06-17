"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useState } from "react";

const navItems = [
  { name: "Home", href: "/" },
  { name: "CV", href: "/cv" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Progetti", href: "/progetti" },
];

export function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          bgcolor: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ maxWidth: 1200, mx: "auto", width: "100%" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Button sx={{
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 700,
              fontSize: "1.25rem",
              letterSpacing: "-0.025em",
              color: "text.primary",
              mr: "auto",
              "&:hover": { bgcolor: "transparent", color: "primary.main" },
            }}
          >
            BOBU
          </Button>
          </Link>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <Button sx={{
                  color: isActive(item.href) ? "primary.main" : "text.secondary",
                  fontWeight: isActive(item.href) ? 600 : 500,
                  "&:hover": { bgcolor: "primary.main", color: "#fff" },
                }}
              >
                {item.name}
              </Button>
              </Link>
            ))}
          </Box>

          {/* Mobile menu button */}
          <IconButton
            sx={{ display: { md: "none" } }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250, pt: 4 }}>
          <List>
            {navItems.map((item) => (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  component="a"
                  href={item.href}
                  selected={isActive(item.href)}
                  onClick={() => setDrawerOpen(false)}
                >
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
