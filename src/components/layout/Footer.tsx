import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        mt: 8,
      }}
    >
      <Container maxWidth="lg">
        <Divider sx={{ mb: 3 }} />
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            &copy; {new Date().getFullYear()} Bobu. All rights reserved.
          </Typography>
          <Box sx={{ display: "flex", gap: 3 }}>
            <Link
              href="https://github.com/giosuetedeschi-spec"
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              GitHub
            </Link>
            <Link
              href="https://it.linkedin.com/in/giosu%C3%A8-tedeschi-b287b9225"
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              LinkedIn
            </Link>
            <Link
              href="https://x.com/Pizzibarbaro"
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              Twitter
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
