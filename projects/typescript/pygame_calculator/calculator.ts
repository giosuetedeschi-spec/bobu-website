export function evaluateExpression(source: string): number {
  const tokens = source.match(/\d*\.?\d+|[()+\-*/]/g) ?? [];
  if (tokens.join("") !== source.replace(/\s/g, "") || tokens.length === 0) throw new Error("Invalid expression");
  let index = 0;
  const peek = () => tokens[index];
  const take = () => tokens[index++];
  const factor = (): number => {
    const token = take();
    if (token === "+") return factor();
    if (token === "-") return -factor();
    if (token === "(") {
      const value = expression();
      if (take() !== ")") throw new Error("Missing closing parenthesis");
      return value;
    }
    const value = Number(token);
    if (!Number.isFinite(value)) throw new Error("Expected a number");
    return value;
  };
  const product = (): number => {
    let value = factor();
    while (peek() === "*" || peek() === "/") {
      const operator = take();
      const right = factor();
      if (operator === "/" && right === 0) throw new Error("Division by zero");
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  };
  const expression = (): number => {
    let value = product();
    while (peek() === "+" || peek() === "-") {
      const operator = take();
      const right = product();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };
  const result = expression();
  if (index !== tokens.length || !Number.isFinite(result)) throw new Error("Invalid expression");
  return result;
}

export class Calculator {
  input = "";
  add(value: string) { this.input += value; }
  clear() { this.input = ""; }
  deleteLast() { this.input = this.input.slice(0, -1); }
  calculate() {
    try { this.input = String(evaluateExpression(this.input)); }
    catch { this.input = "Error"; }
    return this.input;
  }
}
