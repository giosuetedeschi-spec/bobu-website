import { PyodideRunner } from "@/components/games/PyodideRunner";

export default function KalahaPage() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex items-baseline justify-between">
                <h1 className="font-heading text-4xl font-bold text-white">Kalaha</h1>
                <span className="text-white/40 font-mono">Python + Pyodide</span>
            </div>
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm mb-4">
                Note: This runs the Python implementation of Kalaha in your browser. Check the console output below.
            </div>
            <PyodideRunner scriptPath="/games/kalaha/main.py" />
        </div>
    );
}
