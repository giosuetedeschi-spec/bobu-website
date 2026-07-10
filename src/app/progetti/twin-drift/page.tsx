import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import { GamePageHeader } from "@/components/games/GamePageHeader";

export default function TwinDriftPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GamePageHeader title="Twin Drift" tag="React + Three.js" />
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 6, textAlign: "center" }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "#2563eb15",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DirectionsCarIcon sx={{ fontSize: 32 }} />
            </Box>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Project Porting in Progress
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto" }}>
            Twin Drift is a complex React application being integrated into this Next.js portfolio.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
