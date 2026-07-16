import { PyodideGamePage } from "@/components/games/PyodideGamePage";

const MODULES = ["game_logic.py", "ai_engine.py", "endgame_db.py", "zobrist_hashing.py"];

export default function KalahaPage() {
  return (
    <PyodideGamePage
      title="Kalaha"
      tag="Python + Pyodide"
      scriptPath="/games/kalaha/main.py"
      moduleFiles={MODULES}
      description="This runs the Python implementation of Kalaha in your browser. Check the console output below."
    />
  );
}
