export class Renderer {
    constructor(ctx, cols, rows) {
        this.ctx = ctx;
        this.cols = cols;
        this.rows = rows;
        this.cellW = 0;
        this.cellH = 0;
    }

    reset(w, h) {
        this.cellW = w / this.cols;
        this.cellH = h / this.rows;
    }

    draw(grid, current, pathNodes) {
        this.ctx.fillStyle = '#37474f';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                let color = '#37474f';
                if (cell === 1) color = '#ffffff';
                else if (cell === 3) color = 'rgba(2, 136, 209, 0.3)';
                else if (cell === 4) color = '#ffb74d';

                this.ctx.fillStyle = color;

                if (current && current.x === x && current.y === y) {
                    this.ctx.fillStyle = '#ff5252';
                }

                if (cell !== 0) {
                    this.ctx.fillRect(
                        Math.floor(x * this.cellW),
                        Math.floor(y * this.cellH),
                        Math.ceil(this.cellW),
                        Math.ceil(this.cellH)
                    );
                }
            });
        });

        this.ctx.fillStyle = '#4caf50';
        this.ctx.fillRect(Math.floor(1 * this.cellW), Math.floor(1 * this.cellH), this.cellW, this.cellH);

        this.ctx.fillStyle = '#f44336';
        this.ctx.fillRect(Math.floor((this.cols - 2) * this.cellW), Math.floor((this.rows - 2) * this.cellH), this.cellW, this.cellH);
    }
}
