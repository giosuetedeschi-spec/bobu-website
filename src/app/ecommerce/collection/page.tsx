import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import NextLink from "next/link";

export default function CollectionPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Collection
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Coming soon. Stay tuned.
      </Typography>
      <NextLink href="/" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "underline" }}>
        Back Home
      </NextLink>
    </Container>
  );
}
