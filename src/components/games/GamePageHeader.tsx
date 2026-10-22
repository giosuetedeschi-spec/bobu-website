import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";

export function GamePageHeader({ title, tag }: { title: string; tag: string }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 3, minWidth: 0 }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Chip label={tag} size="small" variant="outlined" />
    </Box>
  );
}
