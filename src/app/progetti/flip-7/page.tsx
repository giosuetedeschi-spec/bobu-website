"use client";

import React, { useRef, useState } from "react";
import { GameIframe } from "@/components/games/GameIframe";

export default function Flip7Page() {
    return (
        <div className="w-full max-w-6xl mx-auto space-y-8">
            <div className="flex items-baseline justify-between">
                <h1 className="font-heading text-4xl font-bold text-white">Flip 7</h1>
                <span className="text-white/40 font-mono">Vanilla JS + Canvas</span>
            </div>

            <div className="glass-panel p-1 rounded-xl overflow-hidden aspect-video relative min-h-[600px]">
                <GameIframe
                    src="/projects/js-demos/flip-7/index.html"
                    title="Flip 7"
                    className="w-full h-full border-0"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-xl space-y-4">
                    <h3 className="text-xl font-bold text-white">How to Play</h3>
                    <ul className="text-white/60 space-y-2 list-disc list-inside">
                        <li>Flip cards to accumulate points.</li>
                        <li>Don't flip a duplicate number or you <strong>BUST</strong>!</li>
                        <li><strong>Action Cards</strong> can help or hurt you.</li>
                        <li>Flip **7 unique cards** for the Jackpot!</li>
                    </ul>
                </div>
                <div className="glass-panel p-6 rounded-xl space-y-4">
                    <h3 className="text-xl font-bold text-white">About</h3>
                    <p className="text-white/60">
                        A cyber-noir push-your-luck game built with modular Vanilla JavaScript.
                        Designed to be lightweight and addictive.
                    </p>
                </div>
            </div>
        </div>
    );
}
