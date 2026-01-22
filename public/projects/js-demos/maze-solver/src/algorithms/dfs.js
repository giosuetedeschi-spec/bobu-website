export class DFS {
    constructor(grid, cols, rows) {
        this.grid = grid.map(row => [...row]);
        this.cols = cols;
        this.rows = rows;
        this.visited = Array(rows).fill(false).map(() => Array(cols).fill(false));
    }

    *run(start, end) {
        const stack = [start];
        const parentMap = new Map();
        this.visited[start.y][start.x] = true;

        while (stack.length > 0) {
            const current = stack.pop();

            if (this.grid[current.y][current.x] !== 1) {
                this.grid[current.y][current.x] = 3;
            }

            yield { grid: this.grid, current: current };

            if (current.x === end.x && current.y === end.y) {
                yield* this.reconstructPath(parentMap, end);
                return;
            }

            const neighbors = this.getNeighbors(current);
            for (const next of neighbors) {
                if (!this.visited[next.y][next.x]) {
                    this.visited[next.y][next.x] = true;
                    parentMap.set(`${next.x},${next.y}`, current);
                    stack.push(next);
                }
            }
        }
    }

    *reconstructPath(parentMap, end) {
        let curr = end;
        while (curr) {
            this.grid[curr.y][curr.x] = 4;
            const key = `${curr.x},${curr.y}`;
            curr = parentMap.get(key);
            yield { grid: this.grid, current: end };
        }
    }

    getNeighbors(pos) {
        const dirs = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
        const neighbors = [];
        for (const dir of dirs) {
            const nx = pos.x + dir.x;
            const ny = pos.y + dir.y;
            if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
                if (this.grid[ny][nx] !== 0) {
                    neighbors.push({ x: nx, y: ny });
                }
            }
        }
        return neighbors;
    }
}
