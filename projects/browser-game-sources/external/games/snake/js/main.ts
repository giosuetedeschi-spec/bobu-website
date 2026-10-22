/**
 * Snake - Main Game Loop
 * Entry point and game loop
 */

import * as C from './constants.js';
import { TitleScene, type Scene, type SceneHost } from './scenes.js';

class Game implements SceneHost {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    sceneStack: Scene[] = [];
    keys: Record<string, boolean> = {};
    lastTime = 0;
    accumulator = 0;
    fixedTimeStep = 1000 / C.FPS;
    running = true;

    constructor() {
        const canvas = document.getElementById('game-canvas');
        if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Missing Snake game canvas.');
        this.canvas = canvas;
        const context = this.canvas.getContext('2d');
        if (!context) throw new Error('Could not create Snake canvas context.');
        this.ctx = context;

        // Set canvas size
        this.canvas.width = C.SCREEN_WIDTH;
        this.canvas.height = C.SCREEN_HEIGHT;

        // Scene stack
        this.pushScene(new TitleScene(this));

        // Input tracking
        this.setupInput();

        // Game loop timing
        // Start game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    setupInput(): void {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            // Prevent scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    pushScene(scene: Scene): void {
        this.sceneStack.push(scene);
    }

    popScene(): void {
        if (this.sceneStack.length > 1) {
            this.sceneStack.pop();
        }
    }

    gameLoop(currentTime: number): void {
        if (!this.running || this.sceneStack.length === 0) {
            return;
        }

        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.accumulator += deltaTime;

        // Fixed timestep updates
        while (this.accumulator >= this.fixedTimeStep) {
            const currentScene = this.sceneStack[this.sceneStack.length - 1];

            // Handle input
            currentScene.handleInput(this.keys);

            // Update
            currentScene.update(this.fixedTimeStep / 1000);

            this.accumulator -= this.fixedTimeStep;
        }

        // Render
        const currentScene = this.sceneStack[this.sceneStack.length - 1];
        currentScene.draw(this.ctx);

        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => new Game());
}
