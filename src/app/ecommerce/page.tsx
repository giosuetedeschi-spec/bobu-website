"use client";

import Link from "next/link";
import { Construction } from "lucide-react";

export default function EcommercePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-8">
            <div className="p-6 rounded-full bg-white/5 border border-white/10 animate-pulse">
                <Construction size={48} className="text-white/60" />
            </div>

            <div className="space-y-4 max-w-md">
                <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tighter">
                    Work in Progress
                </h1>
                <p className="text-white/60 leading-relaxed">
                    The shop is currently being built. We are crafting a curated experience for high-quality digital and physical goods.
                </p>
            </div>

            <div className="flex gap-4">
                <Link
                    href="/"
                    className="px-6 py-3 rounded-full glass-panel hover:bg-white/10 transition-colors"
                >
                    Back Home
                </Link>
            </div>
        </div>
    );
}
