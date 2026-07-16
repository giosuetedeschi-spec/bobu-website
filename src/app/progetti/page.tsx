import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Link from "next/link";
import GamepadIcon from "@mui/icons-material/Gamepad";
import CodeIcon from "@mui/icons-material/Code";
import MemoryIcon from "@mui/icons-material/Memory";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

const projects = [
  {
    title: "Twin Drift",
    description: "A high-octane racing game built with React and Three.js.",
    href: "/progetti/twin-drift",
    icon: <GamepadIcon />,
    color: "#2563eb",
    status: "Porting...",
  },
  {
    title: "Breakout",
    description: "Classic Breakout in Rust with Bevy Engine, running via WASM.",
    href: "/progetti/breakout",
    icon: <MemoryIcon />,
    color: "#f97316",
    status: "WIP",
  },
  {
    title: "Kalaha AI",
    description: "Ancient board game against a Python AI running locally.",
    href: "/progetti/kalaha",
    icon: <CodeIcon />,
    color: "#22c55e",
    status: "Playable",
  },
  {
    title: "Pong",
    description: "The classic arcade game for two players. Vanilla JS implementation.",
    href: "/progetti/pong",
    icon: <GamepadIcon />,
    color: "#64748b",
    status: "Playable",
  },
  {
    title: "Flappy Bird",
    description: "One button, infinite frustration. Canvas remake of the classic.",
    href: "/progetti/flappy-bird",
    icon: <GamepadIcon />,
    color: "#fbbf24",
    status: "New!",
  },
  {
    title: "Tris",
    description: "Tic-tac-toe against an unbeatable minimax AI. Best you can do is draw.",
    href: "/progetti/tris",
    icon: <GamepadIcon />,
    color: "#f472b6",
    status: "New!",
  },
  {
    title: "Snake",
    description: "Retro Snake game. Eat the food, don't hit the wall.",
    href: "/progetti/snake",
    icon: <GamepadIcon />,
    color: "#eab308",
    status: "Playable",
  },
  {
    title: "Bitwise Ops",
    description: "Visualizer for bitwise operations and logic gates.",
    href: "/progetti/bitwise",
    icon: <MemoryIcon />,
    color: "#3b82f6",
    status: "Demo",
  },
  {
    title: "Sudoku Solver",
    description: "Interactive Python Sudoku solver running in browser.",
    href: "/progetti/sudoku",
    icon: <CodeIcon />,
    color: "#ec4899",
    status: "Playable",
  },
  {
    title: "Flip 7",
    description: "Neon-noir push-your-luck card game. Don't bust!",
    href: "/progetti/flip-7",
    icon: <GamepadIcon />,
    color: "#06b6d4",
    status: "New!",
  },
  {
    title: "Maze Generator",
    description: "Garden-themed visualization of maze generation algorithms.",
    href: "/progetti/maze-generator",
    icon: <AutoAwesomeIcon />,
    color: "#22c55e",
    status: "Native JS",
  },
  {
    title: "Maze Solver",
    description: "Flow-based visualization of pathfinding algorithms.",
    href: "/progetti/maze-solver",
    icon: <AutoAwesomeIcon />,
    color: "#3b82f6",
    status: "Native JS",
  },  {
    title: "Abalone",
    description: "Hexagonal board game. Push opponent marbles off the edge.",
    href: "/progetti/abalone",
    icon: <GamepadIcon />,
    color: "#3b82f6",
    status: "Playable",
  },
  {
    title: "Mastermind",
    description: "Code-breaking game. Guess the secret color sequence.",
    href: "/progetti/mastermind",
    icon: <CodeIcon />,
    color: "#a855f7",
    status: "Playable",
  },
  {
    title: "Azul",
    description: "Tile drafting game. Build beautiful mosaic patterns.",
    href: "/progetti/azul",
    icon: <AutoAwesomeIcon />,
    color: "#22c55e",
    status: "Playable",
  },

];

function getStatusColor(status: string) {
  if (status === "Playable") return "success";
  if (status === "New!") return "primary";
  if (status === "WIP") return "warning";
  return "default";
}

export default function ProjectsPage() {
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
          Passion Projects
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
          Games, tools, and experiments. Built for fun and learning.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {projects.map((project) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.title}>
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
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: project.color + "15",
                        color: project.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {project.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem", lineHeight: 1.3 }}>
                        {project.title}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, lineHeight: 1.6 }}
                  >
                    {project.description}
                  </Typography>
                  <Chip
                    label={project.status}
                    size="small"
                    color={getStatusColor(project.status) as "success" | "primary" | "warning" | "default"}
                    sx={{ fontSize: "0.7rem", height: 22 }}
                  />
                </CardContent>
              </Link>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
