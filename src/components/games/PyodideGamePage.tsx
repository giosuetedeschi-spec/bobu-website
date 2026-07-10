import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import { GamePageHeader } from "@/components/games/GamePageHeader";
import { PyodideRunner } from "@/components/games/PyodideRunner";

export function PyodideGamePage({
  title,
  tag,
  scriptPath,
  description,
}: {
  title: string;
  tag: string;
  scriptPath: string;
  description: string;
}) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GamePageHeader title={title} tag={tag} />
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        {description}
      </Alert>
      <PyodideRunner scriptPath={scriptPath} />
    </Container>
  );
}
