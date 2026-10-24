export class Renderer {
  ctx;
  cols;
  rows;
  cellW = 0;
  cellH = 0;
  constructor(ctx, cols, rows) {
    this.ctx = ctx;
    this.cols = cols;
    this.rows = rows;
  }
  reset(w, h) {
    this.cellW = w / this.cols;
    this.cellH = h / this.rows;
  }
  draw(grid, current = null, _pathNodes = []) {
    this.ctx.fillStyle = "#101827";
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        let color = "#111b2d";
        if (cell === 1)
          color = "#e7f4f2";
        else if (cell === 3)
          color = "#4e9bb8";
        else if (cell === 4)
          color = "#f3c969";
        this.ctx.fillStyle = color;
        if (current && current.x === x && current.y === y) {
          this.ctx.fillStyle = "#f472b6";
        }
        if (cell !== 0) {
          this.ctx.fillRect(Math.floor(x * this.cellW), Math.floor(y * this.cellH), Math.ceil(this.cellW), Math.ceil(this.cellH));
        }
      });
    });
    this.ctx.fillStyle = "#62d6c8";
    this.ctx.fillRect(Math.floor(1 * this.cellW), Math.floor(1 * this.cellH), this.cellW, this.cellH);
    this.ctx.fillStyle = "#f472b6";
    this.ctx.fillRect(Math.floor((this.cols - 2) * this.cellW), Math.floor((this.rows - 2) * this.cellH), this.cellW, this.cellH);
  }
}
