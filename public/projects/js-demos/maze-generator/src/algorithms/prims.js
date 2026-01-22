export class PrimsAlgorithm {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.grid = Array(rows).fill(0).map(() => Array(cols).fill(0));
    }

    *run() {
        const frontier = [];
        const startX = 1;
        const startY = 1;
        this.grid[startY][startX] = 1;

        this.addFrontier(startX, startY, frontier);
        yield this.grid;

        while (frontier.length > 0) {
            const randIndex = Math.floor(Math.random() * frontier.length);
            const { x, y, px, py } = frontier[randIndex];
            frontier.splice(randIndex, 1);

            if (this.grid[y][x] === 0) {
                this.grid[y][x] = 1;
                this.grid[(y + py) / 2][(x + px) / 2] = 1;

                this.addFrontier(x, y, frontier);
                yield this.grid;
            }
        }
    }

    addFrontier(x, y, frontier) {
        const dirs = [
            { x: 0, y: -2 }, { x: 2, y: 0 }, { x: 0, y: 2 }, { x: -2, y: 0 }
        ];

        for (const dir of dirs) {
            const nx = x + dir.x;
            const ny = y + dir.y;

            if (nx > 0 && nx < this.cols - 1 && ny > 0 && ny < this.rows - 1) {
                if (this.grid[ny][nx] === 0) {
                    this.grid[ny][nx] = 2;
                    frontier.push({ x: nx, y: ny, px: x, py: y });
                }
            }
        }
    }
}
