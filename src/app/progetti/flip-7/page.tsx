"use client";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import { GameIframe } from "@/components/games/GameIframe";
import { GamePageHeader } from "@/components/games/GamePageHeader";

export default function Flip7Page() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GamePageHeader title="Flip 7" tag="TypeScript · DOM" />
      <Box sx={{ mb: 3, borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
        <GameIframe src="/projects/js-demos/flip-7/index.html" title="Flip 7" />
      </Box>
      <Grid container spacing={2}>
        <Grid size={{xs: 12, md: 6}}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                How to Play
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div">
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li>Flip to score numbers; choose <strong>Stay</strong> to bank the hand.</li>
                  <li>A duplicate number ends your turn with no points unless you have <strong>Second Chance</strong>.</li>
                  <li>Seven different number cards end the turn and add <strong>15 bonus points</strong>.</li>
                  <li>Freeze banks the hand; Flip Three forces three draws. Plus cards add points and x2 doubles number points.</li>
                </ul>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs: 12, md: 6}}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                About
              </Typography>
              <Typography variant="body2" color="text.secondary">
                A solo score challenge based on the rules and card set of the multiplayer Flip 7 game. Reach 200 points across turns.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
