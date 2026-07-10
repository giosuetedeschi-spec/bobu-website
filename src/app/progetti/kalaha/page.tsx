import { PyodideGamePage } from "@/components/games/PyodideGamePage";

export default function KalahaPage() {
  return (
    <PyodideGamePage
      title="Kalaha"
      tag="Python + Pyodide"
      scriptPath="/games/kalaha/main.py"
      description="This runs the Python implementation of Kalaha in your browser. Check the console output below."
    />
  );
}
