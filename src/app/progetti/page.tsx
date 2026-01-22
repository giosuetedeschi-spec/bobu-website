import { ArrowRight, Gamepad2, Code2, Cpu, Calculator } from "lucide-react";
import Link from "next/link";

const projects = [
    {
        title: "Twin Drift",
        description: "A high-octane racing game built with React and Three.js.",
        href: "/progetti/twin-drift",
        icon: <Gamepad2 className="text-primary w-8 h-8" />,
        gradient: "from-blue-500/20 to-purple-500/20",
        status: "Porting..."
    },
    {
        title: "Breakout",
        description: "Classic Breakout implemented in Rust with Bevy Engine, running via WASM.",
        href: "/progetti/breakout",
        icon: <Cpu className="text-orange-500 w-8 h-8" />,
        gradient: "from-orange-500/20 to-red-500/20",
        status: "Playable"
    },
    {
        title: "Kalaha AI",
        description: "Ancient board game played against a Python AI agent running locally.",
        href: "/progetti/kalaha",
        icon: <Code2 className="text-green-500 w-8 h-8" />,
        gradient: "from-green-500/20 to-emerald-500/20",
        status: "Playable"
    },
    {
        title: "Pong",
        description: "The classic arcade game. Vanilla JS implementation.",
        href: "/progetti/pong",
        icon: <Gamepad2 className="text-white w-8 h-8" />,
        gradient: "from-white/10 to-white/5",
        status: "Playable"
    },
    {
        title: "Snake",
        description: "Retro Snake game. Eat the food, don't hit the wall.",
        href: "/progetti/snake",
        icon: <Gamepad2 className="text-yellow-500 w-8 h-8" />,
        gradient: "from-yellow-500/20 to-orange-500/20",
        status: "Playable"
    },
    {
        title: "Bitwise Ops",
        description: "Visualizer for bitwise operations and logic gates.",
        href: "/progetti/bitwise",
        icon: <Cpu className="text-blue-400 w-8 h-8" />,
        gradient: "from-blue-400/20 to-cyan-400/20",
        status: "Demo"
    },
    {
        title: "Sudoku Solver",
        description: "Interactive Python Sudoku solver with multiple algorithms, running in browser.",
        href: "/progetti/sudoku",
        icon: <Code2 className="text-pink-500 w-8 h-8" />,
        gradient: "from-pink-500/20 to-purple-500/20",
        status: "Playable"
    },
    {
        title: "Flip 7",
        description: "Neon-noir push-your-luck card game. Don't bust!",
        href: "/progetti/flip-7",
        icon: <Gamepad2 className="text-cyan-500 w-8 h-8" />,
        gradient: "from-cyan-500/20 to-blue-500/20",
        status: "New!"
    },
    {
        title: "Maze Generator",
        description: "Garden-themed visualization of maze generation algorithms.",
        href: "/progetti/maze-generator",
        icon: <Code2 className="text-green-500 w-8 h-8" />,
        gradient: "from-green-500/20 to-emerald-500/20",
        status: "Native JS"
    },
    {
        title: "Maze Solver",
        description: "Flow-based visualization of pathfinding algorithms.",
        href: "/progetti/maze-solver",
        icon: <Code2 className="text-blue-500 w-8 h-8" />,
        gradient: "from-blue-500/20 to-indigo-500/20",
        status: "Native JS"
    },
    {
        title: "Interpolation Engine",
        description: "Declarative interpolation engine for smooth state transitions.",
        href: "#",
        icon: <Code2 className="text-cyan-500 w-8 h-8" />,
        gradient: "from-cyan-500/20 to-blue-500/20",
        status: "Library"
    },
    {
        title: "Pygame Calculator",
        description: "Calculator with GUI built in Pygame.",
        href: "#",
        icon: <Calculator className="text-yellow-500 w-8 h-8" />,
        gradient: "from-yellow-500/20 to-orange-500/20",
        status: "Desktop App"
    }
];

export default function ProjectsPage() {
    return (
        <div className="space-y-12 py-8">
            <div className="text-center space-y-4">
                <h1 className="font-heading text-5xl font-bold tracking-tighter text-white">Passion Projects</h1>
                <p className="text-white/60 max-w-2xl mx-auto">
                    Experimental games, visual essays, and technical demonstrations.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Link
                        key={project.title}
                        href={project.href}
                        className={`group glass-panel rounded-2xl p-8 hover:bg-white/5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[200px]`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:scale-110 transition-transform duration-300">
                                    {project.icon}
                                </div>
                                <span className="text-xs font-mono px-2 py-1 rounded bg-white/10 text-white/60">{project.status}</span>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">{project.title}</h3>
                            <p className="text-white/60 text-sm leading-relaxed">{project.description}</p>
                        </div>

                        <div className="relative z-10 pt-6 flex items-center text-primary font-medium text-sm group-hover:translate-x-2 transition-transform">
                            Play Now <ArrowRight size={16} className="ml-2" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
