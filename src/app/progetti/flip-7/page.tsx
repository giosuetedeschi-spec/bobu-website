"use client";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import { GameIframe } from "@/components/games/GameIframe";

export default function Flip7Page() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Flip 7
        </Typography>
        <Chip label="Vanilla JS + Canvas" size="small" variant="outlined" />
      </Box>
      <Box sx={{ mb: 3, borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
        <GameIframe src="/projects/js-demos/flip-7/index.html" />
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
                  <li>Flip cards to accumulate points.</li>
                  <li>Don&apos;t flip a duplicate number or you <strong>BUST</strong>!</li>
                  <li><strong>Action Cards</strong> can help or hurt you.</li>
                  <li>Flip <strong>7 unique cards</strong> for the Jackpot!</li>
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
                A cyber-noir push-your-luck game built with modular Vanilla JavaScript.
                Designed to be lightweight and addictive.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
