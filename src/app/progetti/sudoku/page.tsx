import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import { PyodideRunner } from "@/components/games/PyodideRunner";

export default function SudokuPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Sudoku Solver
        </Typography>
        <Chip label="Python + Pyodide" size="small" variant="outlined" />
      </Box>
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        This runs the Python Sudoku solver in your browser. Check the console output below.
      </Alert>
      <PyodideRunner scriptPath="/games/sudoku/main.py" />
    </Container>
  );
}
