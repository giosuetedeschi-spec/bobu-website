import { ExternalLink } from "lucide-react";

export default function ResumePage() {
    return (
        <div className="max-w-3xl mx-auto space-y-16 py-12">
            {/* Header */}
            <section className="space-y-4">
                <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tighter text-white">
                    Giosuè "Bobu" Tedeschi
                </h1>
                <p className="text-xl text-white/60 font-light">
                    Full Stack Engineer & Creative Technologist
                </p>
                <div className="flex gap-4 text-sm text-white/40">
                    <span>Milan, Italy</span>
                    <span>•</span>
                    <span>giosue@example.com</span>
                </div>
            </section>

            {/* Experience */}
            <section className="space-y-8">
                <h2 className="font-heading text-2xl font-semibold text-primary border-b border-white/10 pb-2">
                    Experience
                </h2>

                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <h3 className="text-xl font-medium text-white">Senior Frontend Developer</h3>
                        <span className="text-sm text-white/40 font-mono">2023 - Present</span>
                    </div>
                    <p className="text-white/60 leading-relaxed">
                        Leading the frontend architecture for high-scale web applications. Implementing WASM modules for performance-critical tasks.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <h3 className="text-xl font-medium text-white">Freelance Creative Coder</h3>
                        <span className="text-sm text-white/40 font-mono">2021 - 2023</span>
                    </div>
                    <p className="text-white/60 leading-relaxed">
                        Developed interactive websites and generative art pieces for various clients using Three.js, React, and Rust.
                    </p>
                </div>
            </section>

            {/* Education */}
            <section className="space-y-8">
                <h2 className="font-heading text-2xl font-semibold text-secondary border-b border-white/10 pb-2">
                    Education
                </h2>

                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <h3 className="text-xl font-medium text-white">BSc Computer Science</h3>
                        <span className="text-sm text-white/40 font-mono">2018 - 2021</span>
                    </div>
                    <p className="text-white/60 leading-relaxed">
                        Politecnico di Milano. Thesis on "WebAssembly in Modern Game Development".
                    </p>
                </div>
            </section>

            {/* Skills */}
            <section className="space-y-8">
                <h2 className="font-heading text-2xl font-semibold text-accent border-b border-white/10 pb-2">
                    Technical Skills
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="glass-panel p-4 rounded-xl">
                        <h4 className="font-medium text-white mb-2">Languages</h4>
                        <p className="text-sm text-white/60">TypeScript, Rust, Python, C++</p>
                    </div>
                    <div className="glass-panel p-4 rounded-xl">
                        <h4 className="font-medium text-white mb-2">Frontend</h4>
                        <p className="text-sm text-white/60">Next.js, React, Tailwind, Framer Motion, GSAP</p>
                    </div>
                    <div className="glass-panel p-4 rounded-xl">
                        <h4 className="font-medium text-white mb-2">Backend & Tools</h4>
                        <p className="text-sm text-white/60">Node.js, MongoDB, Docker, Git</p>
                    </div>
                </div>
            </section>

            <div className="pt-8 text-center">
                <a
                    href="/cv.pdf"
                    target="_blank"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium hover:scale-105 transition-transform"
                >
                    Download Full CV <ExternalLink size={16} />
                </a>
            </div>
        </div>
    );
}
