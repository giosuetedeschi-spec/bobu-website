export default function BreakoutPage() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex items-baseline justify-between">
                <h1 className="font-heading text-4xl font-bold text-white">Breakout</h1>
                <span className="text-white/40 font-mono">Rust + Bevy + WASM</span>
            </div>

            <div className="glass-panel p-12 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-2xl">
                    B
                </div>
                <h3 className="text-2xl font-bold text-white">WASM Module Not Found</h3>
                <p className="text-white/60 max-w-md">
                    The Rust WASM module needs to be compiled.
                    Please run the build script `wasm-pack build --target web` in the `projects/rust-app` directory and move the output to `public/wasm`.
                </p>
            </div>
        </div>
    );
}
