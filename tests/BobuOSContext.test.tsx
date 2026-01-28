import { renderHook, act } from '@testing-library/react';
import { BobuOSProvider, useBobuOS } from '@/context/BobuOSContext';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BobuOSProvider>{children}</BobuOSProvider>
);

describe('BobuOSContext', () => {
    it('should initialize with an empty window list', () => {
        const { result } = renderHook(() => useBobuOS(), { wrapper });
        expect(result.current.windows).toEqual([]);
        expect(result.current.activeWindowId).toBeNull();
    });

    it('should open a new window', () => {
        const { result } = renderHook(() => useBobuOS(), { wrapper });

        act(() => {
            result.current.openWindow({ id: 'test-win', title: 'Test Window', type: 'project' });
        });

        expect(result.current.windows.length).toBe(1);
        expect(result.current.windows[0].id).toBe('test-win');
        expect(result.current.activeWindowId).toBe('test-win');
        expect(result.current.windows[0].isFocused).toBe(true);
    });

    it('should focus an existing window', () => {
        const { result } = renderHook(() => useBobuOS(), { wrapper });

        act(() => {
            result.current.openWindow({ id: 'win1', title: 'Window 1' });
            result.current.openWindow({ id: 'win2', title: 'Window 2' });
        });

        expect(result.current.activeWindowId).toBe('win2');

        act(() => {
            result.current.focusWindow('win1');
        });

        expect(result.current.activeWindowId).toBe('win1');
        const win1 = result.current.windows.find(w => w.id === 'win1');
        const win2 = result.current.windows.find(w => w.id === 'win2');
        expect(win1?.isFocused).toBe(true);
        expect(win2?.isFocused).toBe(false);
        expect(win1!.zIndex).toBeGreaterThan(win2!.zIndex);
    });

    it('should close a window', () => {
        const { result } = renderHook(() => useBobuOS(), { wrapper });

        act(() => {
            result.current.openWindow({ id: 'test-win' });
        });
        expect(result.current.windows.length).toBe(1);

        act(() => {
            result.current.closeWindow('test-win');
        });
        expect(result.current.windows.length).toBe(0);
        expect(result.current.activeWindowId).toBeNull();
    });

    it('should minimize and restore a window', () => {
        const { result } = renderHook(() => useBobuOS(), { wrapper });

        act(() => {
            result.current.openWindow({ id: 'test-win' });
        });

        act(() => {
            result.current.minimizeWindow('test-win');
        });
        expect(result.current.windows[0].isMinimized).toBe(true);
        expect(result.current.activeWindowId).toBeNull();

        act(() => {
            result.current.restoreWindow('test-win');
        });
        expect(result.current.windows[0].isMinimized).toBe(false);
        expect(result.current.activeWindowId).toBe('test-win');
    });

    it('should toggle maximization', () => {
        const { result } = renderHook(() => useBobuOS(), { wrapper });

        act(() => {
            result.current.openWindow({ id: 'test-win' });
        });

        act(() => {
            result.current.maximizeWindow('test-win');
        });
        expect(result.current.windows[0].isMaximized).toBe(true);

        act(() => {
            result.current.maximizeWindow('test-win');
        });
        expect(result.current.windows[0].isMaximized).toBe(false);
    });
});
