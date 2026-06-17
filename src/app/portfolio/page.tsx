"use client";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";

const projects = [
  {
    id: "twin-drift",
    title: "Twin Drift",
    category: "React + Three.js",
    description: "A high-octane racing game built with React and Three.js, featuring physics-based drifting mechanics.",
    image: "/projects/twins.webp",
    href: "/progetti/twin-drift",
  },
  {
    id: "breakout",
    title: "Breakout WASM",
    category: "Rust + Bevy",
    description: "Classic arcade action reimplemented in Rust using the Bevy engine, compiled to WebAssembly.",
    image: "/projects/breakout.png",
    href: "/progetti/breakout",
  },
  {
    id: "kalaha",
    title: "Kalaha AI",
    category: "Python + Pyodide",
    description: "Ancient board game played against a Python AI agent running fully in the browser via Pyodide.",
    image: "/projects/kalaha.webp",
    href: "/progetti/kalaha",
  },
  {
    id: "abalone",
    title: "Abalone",
    category: "Strategy Board",
    description: "Hexagonal marble board game with AI opponent using minimax + alpha-beta pruning.",
    image: "/projects/breakout.png",
    href: "/progetti/abalone",
  },
  {
    id: "mastermind",
    title: "Mastermind",
    category: "Puzzle",
    description: "Classic code-breaking game. Crack the secret color sequence in 10 guesses.",
    image: "/projects/kalaha.webp",
    href: "/progetti/mastermind",
  },
  {
    id: "azul",
    title: "Azul",
    category: "Tile Drafting",
    description: "Beautiful tile drafting and mosaic building game.",
    image: "/projects/twins.webp",
    href: "/progetti/azul",
  },
];

export default function PortfolioPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: "2.5rem", md: "3rem" },
            fontWeight: 800,
            letterSpacing: "-0.03em",
            mb: 2,
          }}
        >
          Selected Works
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
          A collection of web applications, experiments, and visual explorations.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {projects.map((project) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                height: "100%",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                },
              }}
            >
              <Link
                href={project.href}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={project.image}
                  alt={project.title}
                  sx={{ objectFit: "cover" }}
                />
                <CardContent sx={{ p: 3, flex: 1 }}>
                  <Chip
                    label={project.category}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 1.5, fontSize: "0.75rem" }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {project.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {project.description}
                  </Typography>
                </CardContent>
              </Link>
            </Card>
          </Grid>
        ))}

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 300,
              border: "2px dashed",
              borderColor: "divider",
              bgcolor: "transparent",
              transition: "border-color 0.2s",
              "&:hover": {
                borderColor: "primary.main",
              },
            }}
          >
            <Link
              href="/progetti"
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
                padding: 32,
                textAlign: "center",
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowForwardIcon sx={{ color: "#fff", fontSize: 28 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  View All Projects
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                  Explore games, tools, and experiments
                </Typography>
              </Box>
            </Link>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
