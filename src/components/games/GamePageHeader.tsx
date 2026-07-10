import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";

export function GamePageHeader({ title, tag }: { title: string; tag: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Chip label={tag} size="small" variant="outlined" />
    </Box>
  );
}
