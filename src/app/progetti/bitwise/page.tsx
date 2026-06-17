import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { GameIframe } from "@/components/games/GameIframe";

export default function BitwisePage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Bitwise Visualizer
        </Typography>
        <Chip label="JS + Canvas" size="small" variant="outlined" />
      </Box>
      <GameIframe src="/projects/js-demos/bitwise-ops/index.html" />
    </Container>
  );
}
