export type SortStep = { values: number[]; highlights: number[] };
export type SortGenerator = (values: number[]) => Generator<SortStep>;

function* step(values: number[], highlights: number[] = []): Generator<SortStep> {
  yield { values: [...values], highlights };
}

export function* bubbleSort(values: number[]): Generator<SortStep> {
  for (let end = values.length - 1; end > 0; end--) for (let i = 0; i < end; i++) {
    if (values[i] > values[i + 1]) [values[i], values[i + 1]] = [values[i + 1], values[i]];
    yield* step(values, [i, i + 1]);
  }
}

export function* insertionSort(values: number[]): Generator<SortStep> {
  for (let i = 1; i < values.length; i++) {
    const value = values[i];
    let j = i - 1;
    while (j >= 0 && values[j] > value) {
      values[j + 1] = values[j--];
      yield* step(values, [j + 1, i]);
    }
    values[j + 1] = value;
    yield* step(values, [j + 1]);
  }
  yield* step(values);
}

export function* quickSort(values: number[]): Generator<SortStep> {
  function* sort(low: number, high: number): Generator<SortStep> {
    if (low >= high) return;
    const pivot = values[high];
    let boundary = low;
    for (let i = low; i < high; i++) {
      if (values[i] <= pivot) {
        [values[boundary], values[i]] = [values[i], values[boundary]];
        yield* step(values, [boundary++, i, high]);
      }
    }
    [values[boundary], values[high]] = [values[high], values[boundary]];
    yield* step(values, [boundary, high]);
    yield* sort(low, boundary - 1);
    yield* sort(boundary + 1, high);
  }
  yield* sort(0, values.length - 1);
}

export function* mergeSort(values: number[]): Generator<SortStep> {
  function* sort(left: number, right: number): Generator<SortStep> {
    if (left >= right) return;
    const middle = Math.floor((left + right) / 2);
    yield* sort(left, middle);
    yield* sort(middle + 1, right);
    const merged: number[] = [];
    let a = left, b = middle + 1;
    while (a <= middle || b <= right) {
      if (b > right || (a <= middle && values[a] <= values[b])) merged.push(values[a++]);
      else merged.push(values[b++]);
    }
    merged.forEach((value, index) => { values[left + index] = value; });
    for (let index = left; index <= right; index++) yield* step(values, [index]);
  }
  yield* sort(0, values.length - 1);
}

export function* heapSort(values: number[]): Generator<SortStep> {
  const heapify = (end: number, root: number): number => {
    let largest = root;
    const left = 2 * root + 1, right = left + 1;
    if (left < end && values[left] > values[largest]) largest = left;
    if (right < end && values[right] > values[largest]) largest = right;
    if (largest !== root) [values[root], values[largest]] = [values[largest], values[root]];
    return largest;
  };
  for (let root = Math.floor(values.length / 2) - 1; root >= 0; root--) {
    let current = root;
    while (true) {
      const next = heapify(values.length, current);
      yield* step(values, [current, next]);
      if (next === current) break;
      current = next;
    }
  }
  for (let end = values.length - 1; end > 0; end--) {
    [values[0], values[end]] = [values[end], values[0]];
    yield* step(values, [0, end]);
    let current = 0;
    while (true) {
      const next = heapify(end, current);
      yield* step(values, [current, next]);
      if (next === current) break;
      current = next;
    }
  }
}

export function* countingSort(values: number[]): Generator<SortStep> {
  if (!values.length) return;
  const minimum = Math.min(...values), maximum = Math.max(...values);
  if (values.some((value) => !Number.isInteger(value)) || maximum - minimum > 100_000) {
    throw new Error("Counting sort needs integers in a bounded range.");
  }
  const counts = Array(maximum - minimum + 1).fill(0) as number[];
  for (const value of values) counts[value - minimum]++;
  let position = 0;
  for (let offset = 0; offset < counts.length; offset++) for (let count = counts[offset]; count > 0; count--) {
    values[position] = offset + minimum;
    yield* step(values, [position++]);
  }
}

export function* timSort(values: number[], runSize = 32): Generator<SortStep> {
  for (let start = 0; start < values.length; start += runSize) {
    const end = Math.min(start + runSize, values.length);
    for (let i = start + 1; i < end; i++) {
      const value = values[i];
      let j = i - 1;
      while (j >= start && values[j] > value) { values[j + 1] = values[j--]; yield* step(values, [j + 1, i]); }
      values[j + 1] = value;
    }
  }
  yield* step(values);
  for (let width = runSize; width < values.length; width *= 2) for (let left = 0; left < values.length; left += width * 2) {
    const middle = Math.min(left + width, values.length);
    const right = Math.min(left + width * 2, values.length);
    const merged = values.slice(left, middle).concat(values.slice(middle, right));
    let a = 0, b = middle - left, out = left;
    while (out < right) {
      values[out] = b >= merged.length || (a < middle - left && merged[a] <= merged[b]) ? merged[a++] : merged[b++];
      yield* step(values, [out++]);
    }
  }
}

export function* cachedBogoSort(values: number[], random = Math.random): Generator<SortStep> {
  if (values.length > 6) throw new Error("Cached bogo is limited to six values.");
  const subsetSize = values.length;
  const subset = values.slice(0, subsetSize);
  const key = () => subset.join(",");
  const visited = new Set([key()]);
  const limit = [1, 1, 2, 6, 24, 120, 720][subsetSize];
  const sorted = () => subset.every((value, i) => i === 0 || subset[i - 1] <= value);
  let attempts = 0;
  while (!sorted() && visited.size < limit && attempts++ < limit * 3) {
    for (let i = subset.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [subset[i], subset[j]] = [subset[j], subset[i]];
    }
    if (visited.has(key())) continue;
    visited.add(key());
    subset.forEach((value, index) => { values[index] = value; });
    yield* step(values, Array.from({ length: subsetSize }, (_, index) => index));
  }
  if (!sorted()) subset.sort((a, b) => a - b).forEach((value, index) => { values[index] = value; });
  yield* step(values);
}

export const sortingAlgorithms: Record<string, SortGenerator> = {
  "Bubble sort": bubbleSort,
  "Insertion sort": insertionSort,
  "Quick sort": quickSort,
  "Merge sort": mergeSort,
  "Heap sort": heapSort,
  "Counting sort": countingSort,
  "Tim sort": timSort,
  "Cached bogo (max 6 values)": cachedBogoSort,
};

export function mountSortingVisualizer(root: HTMLElement): () => void {
  const canvas = document.createElement("canvas");
  const controls = document.createElement("div");
  const status = document.createElement("p");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  canvas.style.cssText = "display:block;width:100%;height:auto;background:#1e1e1e;border-radius:12px";
  controls.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin:12px 0";
  root.replaceChildren(controls, status, canvas);
  let values = Array.from({ length: 100 }, () => Math.floor(Math.random() * 491) + 10);
  let frames: Generator<SortStep> | undefined;
  let animation = 0;
  let highlights: number[] = [];
  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(320, Math.floor(root.clientWidth * ratio));
    canvas.height = Math.floor(Math.min(600, canvas.width * 0.6));
    canvas.style.aspectRatio = "5 / 3";
    draw();
  };
  const draw = () => {
    if (!context) return;
    context.fillStyle = "#1e1e1e";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const maximum = Math.max(...values, 1);
    const width = canvas.width / values.length;
    values.forEach((value, index) => {
      context.fillStyle = highlights.includes(index) ? "#ff3c3c" : "#3ca0ff";
      const height = value / maximum * (canvas.height - 12);
      context.fillRect(index * width, canvas.height - height, Math.max(1, width - 1), height);
    });
  };
  const stop = () => { cancelAnimationFrame(animation); frames = undefined; };
  const tick = () => {
    const result = frames?.next();
    if (!result || result.done) { frames = undefined; highlights = []; status.textContent = "Sorted"; draw(); return; }
    values = result.value.values;
    highlights = result.value.highlights;
    draw();
    animation = requestAnimationFrame(tick);
  };
  for (const [name, sort] of Object.entries(sortingAlgorithms)) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    button.addEventListener("click", () => {
      stop();
      if (name.startsWith("Cached bogo")) values = values.slice(0, 6);
      frames = sort([...values]);
      status.textContent = name;
      tick();
    });
    controls.append(button);
  }
  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "Reset";
  reset.addEventListener("click", () => { stop(); values = Array.from({ length: 100 }, () => Math.floor(Math.random() * 491) + 10); status.textContent = "Choose an algorithm"; highlights = []; draw(); });
  controls.append(reset);
  const observer = new ResizeObserver(resize);
  observer.observe(root);
  resize();
  return () => { stop(); observer.disconnect(); root.replaceChildren(); };
}
