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
    this.ctx.fillStyle = "#101827";
    this.ctx.fillRect(0, 0, w, h);
  }
  draw(grid) {
    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        this.ctx.fillStyle = cell === 0 ? "#111b2d" : cell === 2 ? "#62d6c8" : "#e7f4f2";
        this.ctx.fillRect(Math.floor(x * this.cellW), Math.floor(y * this.cellH), Math.ceil(this.cellW), Math.ceil(this.cellH));
      });
    });
  }
}
