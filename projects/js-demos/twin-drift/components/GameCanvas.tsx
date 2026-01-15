import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, GameMode, PlayerInput } from '../types';
import { peerService } from '../services/peerService';
import { Pause, Play } from 'lucide-react';
import { initPhysics, updateGameState } from '../utils/physics';
import { renderGame } from '../utils/renderer';

interface GameCanvasProps {
  mode: GameMode;
  onGameOver: (score: number) => void;
  isMobile: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ mode, onGameOver, isMobile }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const gameStateRef = useRef<GameState | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // We need to track current AND previous input for rising edge detection
  const inputRef = useRef<PlayerInput>({ leftPressed: false, rightPressed: false });
  const prevInputRef = useRef<PlayerInput>({ leftPressed: false, rightPressed: false });
  
  const remoteStateRef = useRef<GameState | null>(null);

  const initGame = useCallback(() => {
    gameStateRef.current = initPhysics();
  }, []);

  // --- Input Listeners ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') setIsPaused(p => !p);
      if (isPaused) return;

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') inputRef.current.leftPressed = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') inputRef.current.rightPressed = true;
      
      if (mode === GameMode.MULTIPLAYER_CLIENT) {
        peerService.send({ type: 'INPUT', payload: inputRef.current });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') inputRef.current.leftPressed = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') inputRef.current.rightPressed = false;

      if (mode === GameMode.MULTIPLAYER_CLIENT) {
        peerService.send({ type: 'INPUT', payload: inputRef.current });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode, isPaused]);

  const handleTouchStart = (side: 'left' | 'right') => {
    if (isPaused) return;
    if (side === 'left') inputRef.current.leftPressed = true;
    else inputRef.current.rightPressed = true;
    if (mode === GameMode.MULTIPLAYER_CLIENT) peerService.send({ type: 'INPUT', payload: inputRef.current });
  };

  const handleTouchEnd = (side: 'left' | 'right') => {
    if (side === 'left') inputRef.current.leftPressed = false;
    else inputRef.current.rightPressed = false;
    if (mode === GameMode.MULTIPLAYER_CLIENT) peerService.send({ type: 'INPUT', payload: inputRef.current });
  };

  // --- Game Loop ---
  const loop = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Paused Rendering (Static)
    if (isPaused) {
      // Just render the last frame with pause overlay
      // We assume state is available
      const currentState = mode === GameMode.MULTIPLAYER_CLIENT ? remoteStateRef.current : gameStateRef.current;
      if (currentState) {
         renderGame(ctx, currentState, canvas.width, canvas.height, true);
      }
      requestRef.current = requestAnimationFrame(loop);
      return; 
    }

    if (mode === GameMode.SINGLE_PLAYER || mode === GameMode.MULTIPLAYER_HOST) {
      if (!gameStateRef.current) initGame();
      const state = gameStateRef.current!;

      if (!state.isGameOver) {
        updateGameState(state, inputRef.current, prevInputRef.current);
        
        // Sync prev input
        prevInputRef.current = { ...inputRef.current };

        if (mode === GameMode.MULTIPLAYER_HOST) {
           peerService.send({ type: 'SYNC_STATE', payload: state });
        }
      } else {
        onGameOver(state.score);
        if (mode === GameMode.MULTIPLAYER_HOST) {
          peerService.send({ type: 'GAME_OVER', score: state.score });
        }
        return; 
      }
      renderGame(ctx, state, canvas.width, canvas.height, false);
    
    } else if (mode === GameMode.MULTIPLAYER_CLIENT) {
      if (remoteStateRef.current) {
        renderGame(ctx, remoteStateRef.current, canvas.width, canvas.height, false);
        if (remoteStateRef.current.isGameOver) {
           onGameOver(remoteStateRef.current.score);
           return;
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#888';
        ctx.textAlign = 'center';
        ctx.fillText("Connecting...", canvas.width/2, canvas.height/2);
      }
    }
    requestRef.current = requestAnimationFrame(loop);
  };

  // --- Effects ---
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const cleanup = peerService.addMessageListener((data) => {
       if (mode === GameMode.MULTIPLAYER_HOST) {
          if (data.type === 'INPUT') inputRef.current.rightPressed = data.payload.rightPressed;
       } else if (mode === GameMode.MULTIPLAYER_CLIENT) {
          if (data.type === 'SYNC_STATE') remoteStateRef.current = data.payload;
          else if (data.type === 'GAME_OVER') onGameOver(data.score);
       }
    });
    return cleanup;
  }, [mode, onGameOver]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [mode, isPaused]);

  return (
    <>
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={() => setIsPaused(!isPaused)}
          className="bg-black/20 hover:bg-black/40 text-[#F3EAC2] p-2 rounded-full backdrop-blur-sm transition-colors"
        >
          {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
        </button>
      </div>

      {isMobile && !isPaused && (
        <div className="absolute inset-0 flex z-10 pointer-events-none">
          <div 
            className="w-1/2 h-full pointer-events-auto active:bg-yellow-100 active:bg-opacity-10"
            onTouchStart={() => handleTouchStart('left')}
            onTouchEnd={() => handleTouchEnd('left')}
          />
          <div 
            className="w-1/2 h-full pointer-events-auto active:bg-gray-900 active:bg-opacity-10"
            onTouchStart={() => handleTouchStart('right')}
            onTouchEnd={() => handleTouchEnd('right')}
          />
        </div>
      )}
      
      {!isMobile && !isPaused && (
        <div className="absolute inset-0 flex pointer-events-none opacity-50">
          <div className="w-1/2 flex items-end pb-10 justify-center text-xs tracking-widest text-slate-800">
             PRESS 'A'
          </div>
          <div className="w-1/2 flex items-end pb-10 justify-center text-xs tracking-widest text-yellow-100">
             PRESS 'D'
          </div>
        </div>
      )}
    </>
  );
};

export default GameCanvas;