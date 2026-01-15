import React, { useState, useEffect } from 'react';
import { GameMode } from './types';
import GameCanvas from './components/GameCanvas';
import { peerService } from './services/peerService';
import { Copy, Users, Play, Smartphone, Wifi, ArrowRight } from 'lucide-react';
import { COLORS } from './constants';

function App() {
  const [mode, setMode] = useState<GameMode>(GameMode.MENU);
  const [hostId, setHostId] = useState('');
  const [joinId, setJoinId] = useState('');
  const [score, setScore] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile('ontouchstart' in window);
  }, []);

  const startGame = () => {
    setMode(GameMode.SINGLE_PLAYER);
  };

  const startHost = async () => {
    setMode(GameMode.HOST_WAITING);
    try {
      const id = await peerService.initialize();
      setHostId(id);
      
      peerService.hostGame(
        () => {
          setMode(GameMode.MULTIPLAYER_HOST);
        }
      );
    } catch (err) {
      console.error("Failed to init peer", err);
      alert("Could not start multiplayer host.");
      setMode(GameMode.MENU);
    }
  };

  const joinGame = async () => {
    if (!joinId) return;
    setMode(GameMode.CLIENT_WAITING);
    try {
      await peerService.initialize();
      peerService.joinGame(
        joinId,
        () => {
          setMode(GameMode.MULTIPLAYER_CLIENT);
        }
      );
    } catch (err) {
      console.error("Failed to join", err);
      alert("Could not join game.");
      setMode(GameMode.MENU);
    }
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setMode(GameMode.GAME_OVER);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hostId);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900 font-mono">
      
      {/* GAME VIEW */}
      {(mode === GameMode.SINGLE_PLAYER || 
        mode === GameMode.MULTIPLAYER_HOST || 
        mode === GameMode.MULTIPLAYER_CLIENT) && (
        <GameCanvas 
          mode={mode} 
          onGameOver={handleGameOver}
          isMobile={isMobile}
        />
      )}

      {/* MENU OVERLAYS */}
      {mode === GameMode.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F3EAC2] text-[#1A1A1A]">
          <div className="w-full max-w-md p-8 flex flex-col items-center gap-6">
            <h1 className="text-6xl font-bold tracking-tighter mb-4">TWIN<br/>DRIFT</h1>
            
            <button 
              onClick={startGame}
              className="w-full bg-[#1A1A1A] text-[#F3EAC2] p-4 text-xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
            >
              <Play size={24} /> SINGLE PLAYER
            </button>

            <div className="w-full h-px bg-[#1A1A1A] opacity-20 my-2"></div>

            <button 
              onClick={startHost}
              className="w-full border-2 border-[#1A1A1A] p-4 text-lg font-bold flex items-center justify-center gap-2 hover:bg-[#1A1A1A] hover:text-[#F3EAC2] transition-colors"
            >
              <Wifi size={24} /> HOST MULTIPLAYER
            </button>

            <div className="flex w-full gap-2">
              <input 
                type="text" 
                placeholder="Enter Host ID"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                className="flex-1 bg-transparent border-b-2 border-[#1A1A1A] p-2 outline-none placeholder-gray-500 uppercase"
              />
              <button 
                onClick={joinGame}
                className="bg-[#1A1A1A] text-[#F3EAC2] px-6 font-bold hover:opacity-90"
              >
                JOIN
              </button>
            </div>
            
            <p className="text-xs mt-8 opacity-60 max-w-xs text-center">
              Controls: Tap sides or use A/D (Left/Right) arrows. 
              Keep both balls alive. Cross the center to switch sides.
            </p>
          </div>
        </div>
      )}

      {/* HOST WAITING ROOM */}
      {mode === GameMode.HOST_WAITING && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A1A] text-[#F3EAC2]">
          <h2 className="text-3xl mb-8">WAITING FOR PLAYER 2</h2>
          
          <div className="bg-[#2A2A2A] p-6 rounded-lg flex flex-col items-center gap-4 animate-pulse">
            <span className="text-sm opacity-50">YOUR ID</span>
            <div className="text-4xl font-mono tracking-widest">{hostId || "GENERATING..."}</div>
            {hostId && (
              <button onClick={copyToClipboard} className="flex items-center gap-2 text-xs bg-[#F3EAC2] text-[#1A1A1A] px-3 py-1 rounded font-bold">
                <Copy size={12} /> COPY ID
              </button>
            )}
          </div>
          
          <button onClick={() => setMode(GameMode.MENU)} className="mt-12 opacity-50 hover:opacity-100">
            CANCEL
          </button>
        </div>
      )}

      {/* CLIENT WAITING */}
      {mode === GameMode.CLIENT_WAITING && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A1A] text-[#F3EAC2]">
           <div className="animate-spin mb-4">
             <Wifi size={48} />
           </div>
           <h2 className="text-xl">CONNECTING TO HOST...</h2>
        </div>
      )}

      {/* GAME OVER */}
      {mode === GameMode.GAME_OVER && (
        <div className="absolute inset-0 flex flex-col md:flex-row">
          {/* Split Screen Design for Game Over */}
          <div className="flex-1 bg-[#F3EAC2] flex flex-col items-center justify-center text-[#1A1A1A]">
            <h2 className="text-xl font-bold mb-2">SCORE</h2>
            <div className="text-6xl font-bold">{score}</div>
          </div>
          <div className="flex-1 bg-[#1A1A1A] flex flex-col items-center justify-center text-[#F3EAC2]">
            <h1 className="text-4xl font-bold mb-8">GAME OVER</h1>
            <button 
              onClick={() => setMode(GameMode.MENU)}
              className="border-2 border-[#F3EAC2] px-8 py-3 text-lg font-bold hover:bg-[#F3EAC2] hover:text-[#1A1A1A] transition-all"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
