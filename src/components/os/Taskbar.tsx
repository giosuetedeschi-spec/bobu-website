"use client";

import React from 'react';
import { useBobuOS } from '@/context/BobuOSContext';
import { motion } from 'framer-motion';
import { Terminal, Settings, Info, Box } from 'lucide-react';

export const Taskbar: React.FC = () => {
    const { windows, restoreWindow, focusWindow, openWindow } = useBobuOS();

    return (
        <div className="os-taskbar os-glass border-white/10 shadow-2xl">
            {/* 1. Start / System Button */}
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors group">
                <Box size={20} className="text-white/70 group-hover:text-white" />
            </button>

            <div className="w-[1px] h-6 bg-white/10 mx-1" />

            {/* 2. App Shortcuts (Demo launch buttons) */}
            <div className="flex gap-2">
                <button
                    onClick={() => openWindow({ id: 'terminal', title: 'System Terminal', type: 'terminal' })}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
                >
                    <Terminal size={20} className="text-white/70 group-hover:text-white" />
                </button>
                <button
                    onClick={() => openWindow({ id: 'settings', title: 'BobuOS Settings', type: 'settings' })}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
                >
                    <Settings size={20} className="text-white/70 group-hover:text-white" />
                </button>
            </div>

            {/* 3. Dynamic Active Tasks */}
            <div className="flex gap-2 mx-2">
                {windows.map((window) => (
                    <motion.button
                        key={window.id}
                        layoutId={`task-${window.id}`}
                        onClick={() => {
                            if (window.isMinimized) {
                                restoreWindow(window.id);
                            } else {
                                focusWindow(window.id);
                            }
                        }}
                        className={`
              h-9 px-3 rounded-lg flex items-center gap-2 transition-all border
              ${window.isFocused
                                ? 'bg-white/15 border-white/20 text-white shadow-lg'
                                : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'}
            `}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${window.isFocused ? 'bg-indigo-400' : 'bg-white/20'}`} />
                        <span className="text-xs font-medium truncate max-w-[100px]">{window.title}</span>
                    </motion.button>
                ))}
            </div>

            <div className="flex-1" />

            {/* 4. System Tray */}
            <div className="flex items-center gap-4 px-2 text-[10px] font-mono text-white/40 uppercase tracking-tighter">
                <div className="flex gap-2">
                    <Settings size={14} className="hover:text-white/70 cursor-pointer" />
                    <Info size={14} className="hover:text-white/70 cursor-pointer" />
                </div>
                <div className="hidden md:block">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );
};
