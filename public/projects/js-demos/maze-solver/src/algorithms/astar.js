export class AStar {
    constructor(grid, cols, rows) {
        this.grid = grid.map(row => [...row]);
        this.cols = cols;
        this.rows = rows;
    }

    *run(start, end) {
        const openSet = [];
        const closedSet = new Set();
        const parentMap = new Map();

        openSet.push({ ...start, f: 0, g: 0 });

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();

            this.grid[current.y][current.x] = 3;
            yield { grid: this.grid, current: current };

            if (current.x === end.x && current.y === end.y) {
                yield* this.reconstructPath(parentMap, end);
                return;
            }

            closedSet.add(`${current.x},${current.y}`);

            const neighbors = this.getNeighbors(current);
            for (const next of neighbors) {
                if (closedSet.has(`${next.x},${next.y}`)) continue;

                const gScore = current.g + 1;
                const hScore = Math.abs(next.x - end.x) + Math.abs(next.y - end.y);
                const fScore = gScore + hScore;

                const existingNode = openSet.find(n => n.x === next.x && n.y === next.y);
                if (!existingNode) {
                    parentMap.set(`${next.x},${next.y}`, { x: current.x, y: current.y });
                    openSet.push({ ...next, f: fScore, g: gScore });
                } else if (gScore < existingNode.g) {
                    existingNode.g = gScore;
                    existingNode.f = fScore;
                    parentMap.set(`${next.x},${next.y}`, { x: current.x, y: current.y });
                }
            }
        }
    }

    *reconstructPath(parentMap, end) {
        let curr = end;
        while (curr) {
            this.grid[curr.y][curr.x] = 4;
            curr = parentMap.get(`${curr.x},${curr.y}`);
            yield { grid: this.grid, current: end };
        }
    }

    getNeighbors(pos) {
        const dirs = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
        const neighbors = [];
        for (const dir of dirs) {
            const nx = pos.x + dir.x;
            const ny = pos.y + dir.y;
            if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows && this.grid[ny][nx] !== 0) {
                neighbors.push({ x: nx, y: ny });
            }
        }
        return neighbors;
    }
}
