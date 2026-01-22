export class RecursiveBacktracker {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.grid = Array(rows).fill(0).map(() => Array(cols).fill(0));
    }

    *run() {
        const stack = [];
        let current = { x: 1, y: 1 };
        this.grid[current.y][current.x] = 1;
        stack.push([current.x, current.y]);

        yield this.grid;

        while (stack.length > 0) {
            const [cx, cy] = stack[stack.length - 1];
            this.grid[cy][cx] = 2;
            yield this.grid;

            const neighbors = this.getUnvisitedNeighbors(cx, cy);

            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                const wx = (cx + next.x) / 2;
                const wy = (cy + next.y) / 2;

                this.grid[wy][wx] = 1;
                this.grid[next.y][next.x] = 1;

                stack.push([next.x, next.y]);

                this.grid[cy][cx] = 1;
                yield this.grid;
            } else {
                this.grid[cy][cx] = 1;
                stack.pop();
                yield this.grid;
            }
        }
    }

    getUnvisitedNeighbors(x, y) {
        const neighbors = [];
        const dirs = [
            { x: 0, y: -2 }, { x: 2, y: 0 }, { x: 0, y: 2 }, { x: -2, y: 0 }
        ];

        for (const dir of dirs) {
            const nx = x + dir.x;
            const ny = y + dir.y;

            if (nx > 0 && nx < this.cols - 1 && ny > 0 && ny < this.rows - 1) {
                if (this.grid[ny][nx] === 0) {
                    neighbors.push({ x: nx, y: ny });
                }
            }
        }
        return neighbors;
    }
}
