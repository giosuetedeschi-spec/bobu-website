import { ArrowRight, Gamepad2, Code2, Cpu, Calculator, Play } from "lucide-react";
import Link from "next/link";
import { Desktop, Taskbar } from "@/components/os";

const projects = [
    // ... rest of projects array remains same for reference or mobile fallback
];

export default function ProjectsPage() {
    return (
        <div className="space-y-8 py-4 h-[calc(100vh-140px)] flex flex-col">
            <div className="text-center space-y-2 shrink-0">
                <h1 className="font-heading text-4xl font-bold tracking-tighter text-white">BobuOS Terminal</h1>
                <p className="text-white/40 text-sm max-w-2xl mx-auto">
                    Virtual environment for passion projects and experimental software.
                </p>
            </div>

            {/* BobuOS Workspace */}
            <div className="flex-1 relative min-h-0">
                <Desktop />
                <Taskbar />
            </div>

            {/* Mobile / Legacy Fallback (Hidden for now as we transition) */}
            <div className="hidden grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* ... existing card map logic if needed ... */}
            </div>
        </div>
    );
}
