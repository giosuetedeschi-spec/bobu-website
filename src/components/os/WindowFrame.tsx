"use client";

import React from 'react';
import { Rnd } from 'react-rnd';
import { useBobuOS } from '@/context/BobuOSContext';
import { X, Minus, Square, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface WindowFrameProps {
    id: string;
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    zIndex: number;
    isFocused: boolean;
    isMaximized: boolean;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
    id,
    title,
    children,
    icon,
    zIndex,
    isFocused,
    isMaximized
}) => {
    const { focusWindow, closeWindow, minimizeWindow, maximizeWindow } = useBobuOS();

    // Handle maximization styles
    const maximizedStyle = isMaximized ? {
        width: '100% !important',
        height: '100% !important',
        transform: 'translate(0px, 0px) !important',
    } : {};

    return (
        <Rnd
            default={{
                x: 100 + (parseInt(id.slice(-1)) || 0) * 20,
                y: 100 + (parseInt(id.slice(-1)) || 0) * 20,
                width: 800,
                height: 600,
            }}
            minWidth={300}
            minHeight={200}
            bounds=".os-desktop"
            dragHandleClassName="os-window-titlebar"
            onDragStart={() => focusWindow(id)}
            onResizeStart={() => focusWindow(id)}
            disableDragging={isMaximized}
            enableResizing={!isMaximized}
            style={{
                zIndex,
                ...maximizedStyle,
                display: 'flex'
            }}
            className={`os-window os-glass-bright os-animate-appear ${isFocused ? 'os-window-active' : ''}`}
        >
            <div className="flex flex-col w-full h-full overflow-hidden rounded-lg">
                {/* Title Bar */}
                <div className="os-window-titlebar shrink-0">
                    <div className="flex items-center gap-2 overflow-hidden mr-4">
                        {icon && <span className="opacity-70">{icon}</span>}
                        <span className="truncate text-xs font-semibold tracking-tight">{title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 no-drag">
                        <button
                            onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }}
                            className="p-1 hover:bg-white/10 rounded transition-colors text-white/50 hover:text-white"
                        >
                            <Minus size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); maximizeWindow(id); }}
                            className="p-1 hover:bg-white/10 rounded transition-colors text-white/50 hover:text-white"
                        >
                            {isMaximized ? <Square size={12} /> : <Maximize2 size={12} />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors text-white/50 hover:text-red-400"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div
                    className="os-window-content flex-1 bg-black/40 relative"
                    onMouseDown={() => focusWindow(id)}
                >
                    {children}
                </div>
            </div>
        </Rnd>
    );
};
