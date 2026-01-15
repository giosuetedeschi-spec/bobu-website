import { GameIframe } from "@/components/games/GameIframe";

export default function PongPage() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex items-baseline justify-between">
                <h1 className="font-heading text-4xl font-bold text-white">Pong</h1>
                <span className="text-white/40 font-mono">Vanilla JS</span>
            </div>
            <GameIframe src="/games/pong/index.html" />
        </div>
    );
}
