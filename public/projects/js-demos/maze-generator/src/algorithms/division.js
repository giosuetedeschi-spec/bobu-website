export class SimpleRecursiveDivision {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.grid = Array(rows).fill(0).map(() => Array(cols).fill(1));
        for (let i = 0; i < cols; i++) { this.grid[0][i] = 0; this.grid[rows - 1][i] = 0; }
        for (let i = 0; i < rows; i++) { this.grid[i][0] = 0; this.grid[i][cols - 1] = 0; }
    }

    *run() {
        const stack = [{ r1: 1, r2: this.rows - 2, c1: 1, c2: this.cols - 2 }];
        yield this.grid;

        while (stack.length) {
            const { r1, r2, c1, c2 } = stack.pop();
            if (r2 - r1 < 2 || c2 - c1 < 2) continue;

            const width = c2 - c1;
            const height = r2 - r1;
            const horizontal = Math.random() < 0.5 ? height > width : height < width;

            if (horizontal) {
                const possibilitiesY = [];
                for (let y = r1; y <= r2; y++) if (y % 2 === 0) possibilitiesY.push(y);
                if (possibilitiesY.length === 0) continue;
                const chosenY = possibilitiesY[Math.floor(Math.random() * possibilitiesY.length)];
                const holeX = Math.floor(Math.random() * (c2 - c1 + 1)) + c1;

                for (let c = c1; c <= c2; c++) {
                    if (c !== holeX) this.grid[chosenY][c] = 0;
                }
                yield this.grid;

                stack.push({ r1: r1, r2: chosenY - 1, c1: c1, c2: c2 });
                stack.push({ r1: chosenY + 1, r2: r2, c1: c1, c2: c2 });
            } else {
                const possibilitiesX = [];
                for (let x = c1; x <= c2; x++) if (x % 2 === 0) possibilitiesX.push(x);
                if (possibilitiesX.length === 0) continue;
                const chosenX = possibilitiesX[Math.floor(Math.random() * possibilitiesX.length)];
                const holeY = Math.floor(Math.random() * (r2 - r1 + 1)) + r1;

                for (let r = r1; r <= r2; r++) {
                    if (r !== holeY) this.grid[r][chosenX] = 0;
                }
                yield this.grid;

                stack.push({ r1: r1, r2: r2, c1: c1, c2: chosenX - 1 });
                stack.push({ r1: r1, r2: r2, c1: chosenX + 1, c2: c2 });
            }
        }
    }
}
