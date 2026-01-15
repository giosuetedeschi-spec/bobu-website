import { GameIframe } from "@/components/games/GameIframe";

export default function BitwisePage() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex items-baseline justify-between">
                <h1 className="font-heading text-4xl font-bold text-white">Bitwise Visualizer</h1>
                <span className="text-white/40 font-mono">JS + Canvas</span>
            </div>
            <GameIframe src="/games/bitwise-ops/index.html" />
        </div>
    );
}
