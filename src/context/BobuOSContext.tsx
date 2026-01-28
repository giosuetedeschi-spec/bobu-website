"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * Window state definition for BobuOS
 */
export interface BobuWindow {
  id: string;
  title: string;
  type: 'python-game' | 'rust-game' | 'terminal' | 'settings' | 'about' | 'project';
  icon?: React.ReactNode;
  href?: string;
  
  // Layout
  x: number;
  y: number;
  width: number | string;
  height: number | string;
  
  // Status
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  zIndex: number;
}

interface BobuOSContextType {
  windows: BobuWindow[];
  activeWindowId: string | null;
  openWindow: (app: Partial<BobuWindow>) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
}

const BobuOSContext = createContext<BobuOSContextType | undefined>(undefined);

export const BobuOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<BobuWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(10);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => {
      const windowToFocus = prev.find(w => w.id === id);
      if (!windowToFocus || (windowToFocus.isFocused && windowToFocus.zIndex === maxZIndex)) {
        return prev;
      }

      const newZ = maxZIndex + 1;
      setMaxZIndex(newZ);
      setActiveWindowId(id);

      return prev.map(w => ({
        ...w,
        isFocused: w.id === id,
        zIndex: w.id === id ? newZ : w.zIndex,
        isMinimized: w.id === id ? false : w.isMinimized // Auto-restore if minimized? Or maybe handled separately
      }));
    });
  }, [maxZIndex]);

  const openWindow = useCallback((app: Partial<BobuWindow>) => {
    if (!app.id) return;

    // If already open, just focus it
    const existing = windows.find(w => w.id === app.id);
    if (existing) {
      focusWindow(app.id);
      return;
    }

    const newZ = maxZIndex + 1;
    setMaxZIndex(newZ);
    setActiveWindowId(app.id);

    const newWindow: BobuWindow = {
      id: app.id,
      title: app.title || 'New Window',
      type: app.type || 'project',
      icon: app.icon,
      href: app.href,
      x: app.x ?? 50 + windows.length * 20,
      y: app.y ?? 50 + windows.length * 20,
      width: app.width ?? 800,
      height: app.height ?? 600,
      isMinimized: false,
      isMaximized: false,
      isFocused: true,
      zIndex: newZ,
    };

    setWindows(prev => [...prev.map(w => ({ ...w, isFocused: false })), newWindow]);
  }, [windows, maxZIndex, focusWindow]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  }, [activeWindowId]);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMinimized: true, isFocused: false } : w
    ));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  }, [activeWindowId]);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMaximized: !w.isMaximized, isMinimized: false } : w
    ));
    focusWindow(id);
  }, [focusWindow]);

  const restoreWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMinimized: false } : w
    ));
    focusWindow(id);
  }, [focusWindow]);

  const value = useMemo(() => ({
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow
  }), [windows, activeWindowId, openWindow, closeWindow, focusWindow, minimizeWindow, maximizeWindow, restoreWindow]);

  return (
    <BobuOSContext.Provider value={value}>
      {children}
    </BobuOSContext.Provider>
  );
};

export const useBobuOS = () => {
  const context = useContext(BobuOSContext);
  if (context === undefined) {
    throw new Error('useBobuOS must be used within a BobuOSProvider');
  }
  return context;
};
