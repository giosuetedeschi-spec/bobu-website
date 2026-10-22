import Container from "@mui/material/Container";
import { GamePageHeader } from "@/components/games/GamePageHeader";
import { BreakoutGame } from "@/components/games/BreakoutGame";

export default function BreakoutPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GamePageHeader title="Breakout" tag="TypeScript · Canvas" />
      <BreakoutGame />
    </Container>
  );
}
