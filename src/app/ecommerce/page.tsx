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
          Work in Progress
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          The shop is currently being built. We are crafting a curated experience for high-quality digital and physical goods.
        </Typography>
        <NextLink href="/" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "underline" }}>
          Back Home
        </NextLink>
      </Box>
    </Container>
  );
}
