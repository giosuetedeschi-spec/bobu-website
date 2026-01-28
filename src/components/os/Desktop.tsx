"use client";

import React from 'react';
import { useBobuOS } from '@/context/BobuOSContext';
import { motion, AnimatePresence } from 'framer-motion';
import { WindowFrame } from "@/components/os";

/**
 * The Desktop component is the main canvas for BobuOS.
 * it manages the wallpaper and window rendering area.
 */
export const Desktop: React.FC = () => {
    const { windows } = useBobuOS();

    return (
        <div className="os-desktop rounded-3xl border border-white/5 overflow-hidden relative">
            {/* 1. Animated Wallpaper Backdrop */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                {/* Subtle moving gradients for a premium feel */}
                <div
                    className="absolute inset-0 bg-neutral-950"
                    style={{
                        background: `
              radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.1) 0%, transparent 40%)
            `
                    }}
                />

                {/* Simple Mesh/Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Floating background particles (Framer Motion) */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-white/5"
                        style={{
                            width: Math.random() * 300 + 100,
                            height: Math.random() * 300 + 100,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            filter: 'blur(80px)',
                        }}
                        animate={{
                            x: [0, Math.random() * 100 - 50, 0],
                            y: [0, Math.random() * 100 - 50, 0],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                ))}
            </div>

            {/* 2. Window Rendering Area */}
            <div className="relative w-full h-full p-4">
                <AnimatePresence>
                    {windows.map((window) => (
                        !window.isMinimized && (
                            <WindowFrame
                                key={window.id}
                                id={window.id}
                                title={window.title}
                                zIndex={window.zIndex}
                                isFocused={window.isFocused}
                                isMaximized={window.isMaximized}
                                icon={window.icon}
                            >
                                <div className="w-full h-full flex items-center justify-center text-white/20 font-mono text-sm">
                                    {/* Content based on window.type goes here in Phase 4 */}
                                    Content: {window.type}
                                </div>
                            </WindowFrame>
                        )
                    ))}
                </AnimatePresence>
            </div>

            {/* 3. Empty State / Desktop Icons (Optional for now) */}
            {windows.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-2 opacity-20"
                    >
                        <div className="text-4xl font-bold tracking-tighter font-heading text-white">BobuOS</div>
                        <div className="text-xs font-mono text-white/50 uppercase tracking-widest">System Ready • v1.0.0</div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
