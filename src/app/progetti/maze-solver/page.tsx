"use client";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import { GameIframe } from "@/components/games/GameIframe";
import { GamePageHeader } from "@/components/games/GamePageHeader";

export default function MazeSolverPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GamePageHeader title="Maze Solver" tag="JS Native" />
      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Visualize pathfinding algorithms solving mazes in real-time.
          </Typography>
          <Grid container spacing={2}>
            {[
              { name: "DFS", desc: "Depth-First Search. The persistent explorer.", color: "secondary" },
              { name: "BFS", desc: "Breadth-First Search. The expanding flood.", color: "secondary" },
              { name: "A* (A-Star)", desc: "Heuristic search. The intelligent pathfinder.", color: "secondary" },
            ].map((algo) => (
              <Grid size={{xs: 12, md: 4}} key={algo.name}>
                <Box sx={{ p: 2, bgcolor: "secondary.main" + "08", borderRadius: 2, height: "100%" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "secondary.main", mb: 0.5 }}>
                    {algo.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {algo.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
      <Box sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
        <GameIframe src="/projects/js-demos/maze-solver/index.html" />
      </Box>
    </Container>
  );
}
