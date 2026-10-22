export type Easing = "linear" | "easeInOutExponential" | "easeInBack" | "easeOutBack" | "easeOutElastic";
export type Clock = () => number;
export type Point = { x: number; y: number };
export type Interpolatable = number | Point;

export const easingFunctions: Record<Easing, (t: number) => number> = {
  linear: (t) => t,
  easeInOutExponential: (t) => t === 0 || t === 1 ? t : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2,
  easeInBack: (t) => { const c1 = 1.70158; return (c1 + 1) * t ** 3 - c1 * t ** 2; },
  easeOutBack: (t) => { const c1 = 1.70158; return 1 + (c1 + 1) * (t - 1) ** 3 + c1 * (t - 1) ** 2; },
  easeOutElastic: (t) => t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1,
};

const nowSeconds = () => (typeof performance === "undefined" ? Date.now() : performance.now()) / 1000;

export class Interpolated<T extends Interpolatable = number> {
  private start: T;
  private end: T;
  private startTime: number;

  constructor(initialValue: T, public duration = 0.5, public easing: Easing = "linear", private readonly clock: Clock = nowSeconds) {
    this.start = initialValue;
    this.end = initialValue;
    this.startTime = clock();
  }

  setValue(value: T): void {
    this.start = this.getValue();
    this.end = value;
    this.startTime = this.clock();
  }

  setDuration(duration: number): void {
    this.start = this.getValue();
    this.startTime = this.clock();
    this.duration = duration;
  }

  setSpeed(speed: number): void {
    this.start = this.getValue();
    this.startTime = this.clock();
    this.duration = speed > 0 ? this.distance(this.start, this.end) / speed : 0;
  }

  getValue(): T {
    if (this.duration <= 0) return this.end;
    const progress = Math.max(0, Math.min(1, (this.clock() - this.startTime) / this.duration));
    return this.interpolate(this.start, this.end, easingFunctions[this.easing](progress));
  }

  get value(): T { return this.getValue(); }
  set value(next: T) { this.setValue(next); }

  private interpolate(start: T, end: T, amount: number): T {
    if (typeof start === "number" && typeof end === "number") return (start + (end - start) * amount) as T;
    if (typeof start === "object" && typeof end === "object") {
      return { x: start.x + (end.x - start.x) * amount, y: start.y + (end.y - start.y) * amount } as T;
    }
    throw new TypeError("Interpolation endpoints must have the same shape.");
  }

  private distance(start: T, end: T): number {
    if (typeof start === "number" && typeof end === "number") return Math.abs(end - start);
    if (typeof start === "object" && typeof end === "object") return Math.hypot(end.x - start.x, end.y - start.y);
    throw new TypeError("Interpolation endpoints must have the same shape.");
  }
}
