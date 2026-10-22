import { Calculator } from "./calculator";
import { COLORS, HEIGHT, TITLE, WIDTH } from "./constants";

export function mountCalculator(root: HTMLElement): () => void {
  const calculator = new Calculator();
  root.replaceChildren();
  root.style.cssText = `box-sizing:border-box;width:min(100%,${WIDTH}px);min-height:${HEIGHT}px;padding:20px;background:${COLORS.background};font:16px system-ui;color:${COLORS.buttonText};border-radius:18px`;
  const title = document.createElement("h1");
  title.textContent = TITLE;
  title.style.cssText = "font-size:1.25rem;margin:0 0 16px";
  const display = document.createElement("output");
  display.setAttribute("aria-live", "polite");
  display.style.cssText = `display:block;box-sizing:border-box;width:100%;height:88px;overflow:hidden;padding:20px 12px;background:${COLORS.display};color:${COLORS.text};font:2rem monospace;text-align:right;border-radius:10px;overflow-wrap:anywhere`;
  const grid = document.createElement("div");
  grid.style.cssText = "display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px";
  const keys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "C", "0", "=", "+", "DELETE"];
  const render = () => { display.textContent = calculator.input || "0"; };
  for (const key of keys) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = key;
    button.style.cssText = `min-height:${key === "DELETE" ? 52 : 68}px;grid-column:${key === "DELETE" ? "span 4" : "span 1"};border:0;border-radius:10px;color:${COLORS.buttonText};background:${key === "C" ? COLORS.clear : "+-*/=".includes(key) || key === "DELETE" ? COLORS.operator : COLORS.number};font:600 1.15rem system-ui;cursor:pointer`;
    button.addEventListener("click", () => {
      if (key === "C") calculator.clear();
      else if (key === "DELETE") calculator.deleteLast();
      else if (key === "=") calculator.calculate();
      else calculator.add(key);
      render();
    });
    grid.append(button);
  }
  root.append(title, display, grid);
  const onKey = (event: KeyboardEvent) => {
    if (/^[0-9.+\-*/]$/.test(event.key)) calculator.add(event.key);
    else if (event.key === "Backspace") calculator.deleteLast();
    else if (event.key === "Enter") calculator.calculate();
    else if (event.key === "Escape") calculator.clear();
    else return;
    event.preventDefault();
    render();
  };
  root.addEventListener("keydown", onKey);
  root.tabIndex = 0;
  render();
  return () => { root.removeEventListener("keydown", onKey); root.replaceChildren(); };
}
