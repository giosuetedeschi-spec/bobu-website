"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
      >
        <div className="absolute -inset-4 bg-gradient-to-r from-primary to-secondary rounded-full blur-2xl opacity-20 animate-pulse" />
        <h1 className="relative font-heading text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
          BOBU
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="max-w-xl text-lg md:text-xl text-white/60 font-light"
      >
        Developer & Creative Coder. Building digital experiences with <span className="text-white font-medium">Next.js</span>, <span className="text-white font-medium">Rust</span>, and <span className="text-white font-medium">Python</span>.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="flex gap-4"
      >
        <a href="/portfolio" className="px-6 py-3 rounded-full bg-white text-black font-medium hover:scale-105 transition-transform">
          View Work
        </a>
        <a href="/progetti" className="px-6 py-3 rounded-full glass-panel hover:bg-white/10 transition-colors">
          Play Games
        </a>
      </motion.div>
    </div>
  );
}
