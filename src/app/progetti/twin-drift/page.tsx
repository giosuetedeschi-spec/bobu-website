export default function TwinDriftPage() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex items-baseline justify-between">
                <h1 className="font-heading text-4xl font-bold text-white">Twin Drift</h1>
                <span className="text-white/40 font-mono">React + Three.js</span>
            </div>

            <div className="glass-panel p-12 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-2xl">
                    TD
                </div>
                <h3 className="text-2xl font-bold text-white">Project Porting in Progress</h3>
                <p className="text-white/60 max-w-md">
                    Twin Drift is a complex React application being integrated into this Next.js portfolio.
                    Source code is available in `projects/js-demos/twin-drift`.
                </p>
            </div>
        </div>
    );
}
