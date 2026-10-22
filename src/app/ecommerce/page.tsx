import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ConstructionIcon from "@mui/icons-material/Construction";
import NextLink from "next/link";

export default function EcommercePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 12 }}>
      <Box sx={{ textAlign: "center" }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: "primary.main" + "15",
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
          }}
        >
          <ConstructionIcon sx={{ fontSize: 40 }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Shop concept
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          A concept preview of possible Bobu merchandise. No items are currently for sale and checkout is not available.
        </Typography>
        <NextLink href="/" style={{ color: "#2563eb", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontWeight: 600, textDecoration: "underline" }}>
          Back Home
        </NextLink>
      </Box>
    </Container>
  );
}
