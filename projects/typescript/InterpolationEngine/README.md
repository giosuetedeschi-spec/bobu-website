# InterpolationEngine (TypeScript)

A small, dependency-free interpolation helper for smoothly transitioning numeric values and `{ x, y }` points.

## Usage

```ts
import { Interpolated } from "./interpolation";

const position = new Interpolated(0, 0.5, "linear");
position.setValue(100);
console.log(position.value); // current interpolated value
```

Set a transition duration or a speed in units per second:

```ts
position.setDuration(2);
position.setValue(500);
position.setSpeed(100); // duration is based on the distance to the target
```

Supported easing names are `linear`, `easeInOutExponential`, `easeInBack`, `easeOutBack`, and `easeOutElastic`. Values can be numbers or `{ x, y }` points. Read the current value through `getValue()` or `.value`.

The implementation and demos are TypeScript files. It has no runtime dependencies.
