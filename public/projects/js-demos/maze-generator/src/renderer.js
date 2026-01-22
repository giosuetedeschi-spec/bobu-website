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

        this.ctx.fillStyle = '#6b705c';
        this.ctx.fillRect(0, 0, w, h);
    }

    draw(grid) {
        grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell === 0) {
                    this.ctx.fillStyle = '#6b705c';
                } else if (cell === 1) {
                    this.ctx.fillStyle = '#fcefe3';
                } else if (cell === 2) {
                    this.ctx.fillStyle = '#b5838d';
                }

                this.ctx.fillRect(
                    Math.floor(x * this.cellW),
                    Math.floor(y * this.cellH),
                    Math.ceil(this.cellW),
                    Math.ceil(this.cellH)
                );
            });
        });
    }
}
