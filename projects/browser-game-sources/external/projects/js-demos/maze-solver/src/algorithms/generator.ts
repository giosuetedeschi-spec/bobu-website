type Point = { x: number; y: number };

export class RecursiveBacktracker {
    cols: number;
    rows: number;
    grid: number[][];

    constructor(cols: number, rows: number) {
        this.cols = cols;
        this.rows = rows;
        this.grid = Array(rows).fill(0).map(() => Array(cols).fill(0));
    }

    generate(): number[][] {
        const stack: Point[] = [];
        const current = { x: 1, y: 1 };
        this.grid[current.y][current.x] = 1;
        stack.push(current);

        while (stack.length > 0) {
            const { x, y } = stack[stack.length - 1];
            const neighbors = this.getNeighbors(x, y);

            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.grid[(y + next.y) / 2][(x + next.x) / 2] = 1;
                this.grid[next.y][next.x] = 1;
                stack.push(next);
            } else {
                stack.pop();
            }
        }
        return this.grid;
    }

    getNeighbors(x: number, y: number): Point[] {
        const neighbors: Point[] = [];
        const dirs = [{ x: 0, y: -2 }, { x: 2, y: 0 }, { x: 0, y: 2 }, { x: -2, y: 0 }];
        for (const dir of dirs) {
            const nx = x + dir.x;
            const ny = y + dir.y;
            if (nx > 0 && nx < this.cols - 1 && ny > 0 && ny < this.rows - 1) {
                if (this.grid[ny][nx] === 0) neighbors.push({ x: nx, y: ny });
            }
        }
        return neighbors;
    }
}
