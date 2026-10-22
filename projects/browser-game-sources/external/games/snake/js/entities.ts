/**
 * Snake - Game Entities
 * Snake and Food classes
 */

import * as C from './constants.js';

export class Vector2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(dir: C.Direction) {
        return new Vector2(this.x + dir.x, this.y + dir.y);
    }

    equals(other: Vector2): boolean {
        return this.x === other.x && this.y === other.y;
    }
}

export class Snake {
    body: Vector2[];
    direction: C.Direction;
    nextDirection: C.Direction;
    growPending: number;

    constructor() {
        // Start in middle
        const startX = Math.floor(C.GRID_WIDTH / 2);
        const startY = Math.floor(C.GRID_HEIGHT / 2);

        // Snake body (head first)
        this.body = [
            new Vector2(startX, startY),
            new Vector2(startX - 1, startY),
            new Vector2(startX - 2, startY)
        ];

        this.direction = C.RIGHT;
        this.nextDirection = C.RIGHT;
        this.growPending = 0;
    }

    setDirection(newDir: C.Direction): void {
        // Prevent 180-degree turns
        if (newDir.x + this.direction.x === 0 &&
            newDir.y + this.direction.y === 0) {
            return;
        }
        this.nextDirection = newDir;
    }

    update(): void {
        this.direction = this.nextDirection;

        // Calculate new head
        const head = this.body[0];
        const newHead = head.add(this.direction);

        // Add new head
        this.body.unshift(newHead);

        // Remove tail (unless growing)
        if (this.growPending > 0) {
            this.growPending--;
        } else {
            this.body.pop();
        }
    }

    grow(amount = C.GROWTH_PER_FOOD): void {
        this.growPending += amount;
    }

    getHead(): Vector2 {
        return this.body[0];
    }

    checkSelfCollision(): boolean {
        const head = this.getHead();
        for (let i = 1; i < this.body.length; i++) {
            if (head.equals(this.body[i])) {
                return true;
            }
        }
        return false;
    }

    checkWallCollision(): boolean {
        const head = this.getHead();
        return head.x < 0 || head.x >= C.GRID_WIDTH ||
            head.y < 0 || head.y >= C.GRID_HEIGHT;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        this.body.forEach((segment, i) => {
            // Gradient effect
            const brightness = 1.0 - (i / this.body.length) * 0.5;
            const r = Math.floor(16 * brightness);
            const g = Math.floor(185 * brightness);
            const b = Math.floor(129 * brightness);

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(
                segment.x * C.GRID_SIZE,
                segment.y * C.GRID_SIZE,
                C.GRID_SIZE - 2,
                C.GRID_SIZE - 2
            );

            // Head highlight
            if (i === 0) {
                ctx.strokeStyle = C.GOLD;
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    segment.x * C.GRID_SIZE,
                    segment.y * C.GRID_SIZE,
                    C.GRID_SIZE - 2,
                    C.GRID_SIZE - 2
                );
            }
        });
    }
}

export class Food {
    pos: Vector2;

    constructor(snake: Snake) {
        this.pos = new Vector2(0, 0);
        this.respawn(snake);
    }

    respawn(snake: Snake): void {
        // Find spot not on snake
        do {
            this.pos = new Vector2(
                Math.floor(Math.random() * C.GRID_WIDTH),
                Math.floor(Math.random() * C.GRID_HEIGHT)
            );
        } while (snake.body.some(segment => segment.equals(this.pos)));
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = C.RED;
        ctx.fillRect(
            this.pos.x * C.GRID_SIZE,
            this.pos.y * C.GRID_SIZE,
            C.GRID_SIZE - 2,
            C.GRID_SIZE - 2
        );
    }
}
