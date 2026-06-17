import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import MemoryIcon from "@mui/icons-material/Memory";

export default function BreakoutPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Breakout
        </Typography>
        <Chip label="Rust + Bevy + WASM" size="small" variant="outlined" />
      </Box>
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 6, textAlign: "center" }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "#f9731615",
                color: "#f97316",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MemoryIcon sx={{ fontSize: 32 }} />
            </Box>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            WASM Module Not Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto" }}>
            The Rust WASM module needs to be compiled. Run{" "}
            <code>wasm-pack build --target web</code> in the rust project directory.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
