import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { GameIframe } from "@/components/games/GameIframe";

export default function SnakePage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Snake
        </Typography>
        <Chip label="Vanilla JS" size="small" variant="outlined" />
      </Box>
      <GameIframe src="/games/snake/index.html" />
    </Container>
  );
}
