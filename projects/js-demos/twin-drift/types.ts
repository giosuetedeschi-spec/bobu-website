export enum GameMode {
  MENU = 'MENU',
  SINGLE_PLAYER = 'SINGLE_PLAYER',
  HOST_WAITING = 'HOST_WAITING',
  CLIENT_WAITING = 'CLIENT_WAITING',
  MULTIPLAYER_HOST = 'MULTIPLAYER_HOST',
  MULTIPLAYER_CLIENT = 'MULTIPLAYER_CLIENT',
  GAME_OVER = 'GAME_OVER'
}

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  radius: number;
  color: string;
  active: boolean;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  text?: string;
}

export interface Obstacle {
  id: number;
  y: number;
  type: 'spike' | 'gap';
  side: 'left' | 'right' | 'center'; 
  height: number;
  width: number;
}

export interface Orb {
  id: number;
  x: number;
  y: number;
  radius: number;
  active: boolean;
  value: number;
  type: 'score' | 'split';
}

export interface GameState {
  balls: Ball[];
  obstacles: Obstacle[];
  particles: Particle[];
  orbs: Orb[];
  score: number;
  speed: number;
  distance: number;
  nextSpawnDistance: number;
  isGameOver: boolean;
  frameCount: number;
}

export interface PlayerInput {
  leftPressed: boolean;
  rightPressed: boolean;
}

export type PeerMessage = 
  | { type: 'SYNC_STATE'; payload: GameState }
  | { type: 'INPUT'; payload: PlayerInput }
  | { type: 'START_GAME' }
  | { type: 'GAME_OVER'; score: number };
