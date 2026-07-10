import Container from "@mui/material/Container";
import { GamePageHeader } from "@/components/games/GamePageHeader";
import { GameIframe } from "@/components/games/GameIframe";

export function GameIframePage({ title, tag, src }: { title: string; tag: string; src: string }) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GamePageHeader title={title} tag={tag} />
      <GameIframe src={src} />
    </Container>
  );
}
