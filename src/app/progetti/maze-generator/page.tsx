"use client";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import { GameIframe } from "@/components/games/GameIframe";
import { GamePageHeader } from "@/components/games/GamePageHeader";

export default function MazeGeneratorPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GamePageHeader title="Maze Generator" tag="JS Native" />
      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Explore different maze generation algorithms in a peaceful, garden-like visualization.
          </Typography>
          <Grid container spacing={2}>
            {[
              { name: "Recursive Backtracker", desc: "Long, winding corridors perfect for exploring." },
              { name: "Prim's Algorithm", desc: "Organic, short-branching paths that grow like crystal." },
              { name: "Recursive Division", desc: "Structured, rectangular rooms created by slicing space." },
            ].map((algo) => (
              <Grid size={{xs: 12, md: 4}} key={algo.name}>
                <Box sx={{ p: 2, bgcolor: "primary.main" + "08", borderRadius: 2, height: "100%" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "primary.main", mb: 0.5 }}>
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
        <GameIframe src="/projects/js-demos/maze-generator/index.html" />
      </Box>
    </Container>
  );
}
