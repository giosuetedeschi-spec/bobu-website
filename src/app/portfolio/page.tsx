"use client";

import testimonials from "@/data/testimonials.json";
import { ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function PortfolioPage() {
    return (
        <div className="space-y-20 py-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="font-heading text-5xl font-bold tracking-tighter text-white">Selected Works</h1>
                <p className="text-white/60 max-w-2xl mx-auto">
                    A collection of web applications, experiments, and visual explorations.
                </p>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Placeholder for Coding Projects */}
                {/* Coding Projects */}
                {[
                    {
                        id: "twin-drift",
                        title: "Twin Drift",
                        category: "React + Three.js",
                        description: "A high-octane racing game built with React and Three.js, featuring physics-based drifting mechanics.",
                        image: "/assets/projects/twin-drift.png",
                        href: "/progetti/twin-drift"
                    },
                    {
                        id: "breakout",
                        title: "Breakout WASM",
                        category: "Rust + Bevy",
                        description: "Classic arcade action reimplemented in Rust using the Bevy engine, compiled to WebAssembly for the browser.",
                        image: "/assets/projects/breakout.png",
                        href: "/progetti/breakout"
                    },
                    {
                        id: "kalaha",
                        title: "Kalaha AI",
                        category: "Python + Pyodide",
                        description: "Ancient board game played against a Python AI agent running fully in the browser via Pyodide.",
                        image: "/assets/projects/kalaha.png",
                        href: "/progetti/kalaha"
                    }
                ].map((project) => (
                    <div key={project.id} className="group relative glass-card rounded-2xl overflow-hidden aspect-[4/5] hover:scale-[1.02] transition-transform duration-500 cursor-pointer">
                        <Link href={project.href} className="absolute inset-0 z-30" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                        <Image
                            src={project.image}
                            alt={project.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                            <p className="text-primary text-xs font-mono mb-1 uppercase">{project.category}</p>
                            <h3 className="text-2xl font-bold text-white mb-2">{project.title}</h3>
                            <p className="text-white/60 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                                {project.description}
                            </p>
                        </div>
                    </div>
                ))}
                {/* Coding Projects Link Card */}
                <a href="/progetti" className="glass-card rounded-2xl flex flex-col items-center justify-center aspect-[4/5] p-6 hover:bg-white/5 transition-colors group">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <ArrowRight className="text-white group-hover:text-primary transition-colors" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Coding Games</h3>
                    <p className="text-white/60 text-center text-sm">Check out my playable Passion Projects (Rust, Python, JS)</p>
                </a>
            </div>

            {/* Testimonials */}
            <section className="py-12 border-t border-white/5">
                <h2 className="font-heading text-3xl font-bold text-white mb-10 text-center">Testimonials</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((t) => (
                        <div key={t.id} className="glass-panel p-8 rounded-2xl relative">
                            <div className="absolute top-8 right-8 text-yellow-500 flex gap-0.5">
                                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                            </div>
                            <p className="text-white/80 leading-relaxed mb-6 italic">"{t.text}"</p>
                            <div>
                                <h4 className="text-white font-medium">{t.name}</h4>
                                <p className="text-primary text-sm">{t.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
