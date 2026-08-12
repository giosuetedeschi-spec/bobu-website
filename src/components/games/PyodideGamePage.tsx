import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import { GamePageHeader } from "@/components/games/GamePageHeader";
import { PyodideRunner } from "@/components/games/PyodideRunner";

export function PyodideGamePage({
  title,
  tag,
  scriptPath,
  description,
  moduleFiles,
  gameId,
}: {
  title: string;
  tag: string;
  scriptPath: string;
  description: string;
  moduleFiles?: string[];
  gameId?: string;
}) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GamePageHeader title={title} tag={tag} />
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        {description}
      </Alert>
      <PyodideRunner scriptPath={scriptPath} moduleFiles={moduleFiles} gameId={gameId} title={title} />
    </Container>
  );
}
