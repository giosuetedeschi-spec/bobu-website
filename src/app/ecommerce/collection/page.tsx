import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import NextLink from "next/link";

const products = [
  {
    name: "Bobu Terminal Tee",
    price: "Concept only",
    gradient: "linear-gradient(135deg,#2563eb,#7c3aed)",
    status: "Not for sale",
  },
  {
    name: "BobuOS Sticker Pack",
    price: "Concept only",
    gradient: "linear-gradient(135deg,#22c55e,#16a34a)",
    status: "Not for sale",
  },
  {
    name: "Pixel Bobu Hoodie",
    price: "Concept only",
    gradient: "linear-gradient(135deg,#f97316,#ea580c)",
    status: "Not for sale",
  },
  {
    name: "Retro Arcade Mug",
    price: "Concept only",
    gradient: "linear-gradient(135deg,#ec4899,#db2777)",
    status: "Not for sale",
  },
  {
    name: "Kalaha Wooden Set",
    price: "Concept only",
    gradient: "linear-gradient(135deg,#eab308,#ca8a04)",
    status: "Not for sale",
  },
  {
    name: "Bobu Enamel Pin",
    price: "Concept only",
    gradient: "linear-gradient(135deg,#06b6d4,#0891b2)",
    status: "Not for sale",
  },
];

function getStatusColor(status: string) {
  if (status === "In Stock") return "success";
  if (status === "Preorder") return "primary";
  return "default";
}

export default function CollectionPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Concept collection
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Design mockups only; these products, prices, and stock are not available for purchase.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {products.map((product) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.name}>
            <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", height: "100%" }}>
              <Box sx={{ aspectRatio: "4/3", background: product.gradient }} />
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {product.name}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    {product.price}
                  </Typography>
                  <Chip
                    label={product.status}
                    size="small"
                    color={getStatusColor(product.status) as "success" | "primary" | "default"}
                    sx={{ fontSize: "0.7rem", height: 22 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <NextLink href="/ecommerce" style={{ display: "inline-block", marginTop: 32, color: "#2563eb", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontWeight: 600, textDecoration: "underline" }}>
        Back to Shop
      </NextLink>
    </Container>
  );
}
