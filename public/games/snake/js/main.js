import * as C from "./constants.js";
import { TitleScene } from "./scenes.js";

class Game {
  canvas;
  ctx;
  sceneStack = [];
  keys = {};
  lastTime = 0;
  accumulator = 0;
  fixedTimeStep = 1000 / C.FPS;
  running = true;
  constructor() {
    const canvas = document.getElementById("game-canvas");
    if (!(canvas instanceof HTMLCanvasElement))
      throw new Error("Missing Snake game canvas.");
    this.canvas = canvas;
    const context = this.canvas.getContext("2d");
    if (!context)
      throw new Error("Could not create Snake canvas context.");
    this.ctx = context;
    this.canvas.width = C.SCREEN_WIDTH;
    this.canvas.height = C.SCREEN_HEIGHT;
    this.pushScene(new TitleScene(this));
    this.setupInput();
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  setupInput() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.key] = true;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.key] = false;
    });
  }
  pushScene(scene) {
    this.sceneStack.push(scene);
  }
  popScene() {
    if (this.sceneStack.length > 1) {
      this.sceneStack.pop();
    }
  }
  gameLoop(currentTime) {
    if (!this.running || this.sceneStack.length === 0) {
      return;
    }
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.accumulator += deltaTime;
    while (this.accumulator >= this.fixedTimeStep) {
      const currentScene = this.sceneStack[this.sceneStack.length - 1];
      currentScene.handleInput(this.keys);
      currentScene.update(this.fixedTimeStep / 1000);
      this.accumulator -= this.fixedTimeStep;
    }
    const currentScene = this.sceneStack[this.sceneStack.length - 1];
    currentScene.draw(this.ctx);
    requestAnimationFrame((time) => this.gameLoop(time));
  }
}
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => new Game);
}
