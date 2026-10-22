import Container from "@mui/material/Container";
import { GamePageHeader } from "@/components/games/GamePageHeader";
import { KalahaGame } from "@/components/games/KalahaGame";

export default function KalahaPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GamePageHeader title="Kalaha" tag="TypeScript · AI" />
      <KalahaGame />
    </Container>
  );
}
