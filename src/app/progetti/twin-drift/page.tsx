import Container from "@mui/material/Container";
import { GamePageHeader } from "@/components/games/GamePageHeader";
import { TwinDriftGame } from "@/components/games/TwinDriftGame";

export default function TwinDriftPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GamePageHeader title="Twin Drift" tag="TypeScript · Canvas racer" />
      <TwinDriftGame />
    </Container>
  );
}
