export {};

type DevtoolsPage = { type: string; url: string; webSocketDebuggerUrl: string };
type DevtoolsMessage = { id?: number; method?: string; params?: { exceptionDetails?: { exception?: { description?: string } } }; result?: { result?: { value?: string } }; error?: unknown };

const port = Number(Bun.argv[2] ?? 9347);
const baseUrl = Bun.argv[3] ?? "http://localhost:3022/bobu-website";
const pages = await fetch(`http://localhost:${port}/json/list`).then((response) => response.json()) as DevtoolsPage[];
const page = pages.find((candidate) => candidate.type === "page");
if (!page) throw new Error("Chrome DevTools has no open page.");

let id = 0;
let pageLoad: (() => void) | undefined;
const pending = new Map<number, (message: DevtoolsMessage) => void>();
const errors: string[] = [];
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise<void>((resolve, reject) => {
  socket.addEventListener("open", () => resolve(), { once: true });
  socket.addEventListener("error", () => reject(new Error("Chrome DevTools connection failed.")), { once: true });
});
socket.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data)) as DevtoolsMessage;
  if (message.method === "Page.loadEventFired") pageLoad?.();
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params?.exceptionDetails?.exception?.description ?? "Uncaught browser exception");
  if (message.id === undefined) return;
  const resolver = pending.get(message.id);
  if (resolver) { pending.delete(message.id); resolver(message); }
});

function send(method: string, params: object = {}): Promise<DevtoolsMessage> {
  const requestId = ++id;
  return new Promise((resolve) => {
    pending.set(requestId, resolve);
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
}

async function navigate(path: string) {
  const loaded = new Promise<void>((resolve) => { pageLoad = resolve; });
  await send("Page.navigate", { url: `${baseUrl}${path}` });
  await Promise.race([loaded, new Promise((resolve) => setTimeout(resolve, 6000))]);
  pageLoad = undefined;
  await new Promise((resolve) => setTimeout(resolve, 350));
}

async function evaluate(expression: string): Promise<string> {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  const value = response.result?.result?.value;
  if (typeof value !== "string") throw new Error(`Browser evaluation failed: ${JSON.stringify(response.error ?? response.result)}`);
  return value;
}

await send("Page.enable");
await send("Runtime.enable");
const results: Record<string, unknown> = {};
const inFrame = (body: string) => `new Promise((resolve) => {
  const frame = document.querySelector('iframe');
  const doc = frame?.contentDocument;
  if (!doc) { resolve(JSON.stringify({ frameReady: false })); return; }
  ${body}
})`;

await navigate("/progetti/kalaha/");
results.kalaha = JSON.parse(await evaluate(`new Promise((resolve) => {
  const first = document.querySelector('button[aria-label="Your pit 1, 4 stones"]');
  first?.click();
  setTimeout(() => resolve(JSON.stringify({
    firstPitCleared: Boolean(document.querySelector('button[aria-label="Your pit 1, 0 stones"]')),
    nextPitSowed: Boolean(document.querySelector('button[aria-label="Your pit 2, 5 stones"]')),
    aiTurnAnnounced: document.body.innerText.includes("Computer is thinking")
  })), 50);
})`));

await navigate("/progetti/sudoku/");
results.sudoku = JSON.parse(await evaluate(`new Promise((resolve) => {
  const emptyCount = () => [...document.querySelectorAll('input:not([readonly])')].filter((input) => !input.value).length;
  const before = emptyCount();
  document.querySelector('button') && [...document.querySelectorAll('button')].find((button) => button.innerText.includes("Hint"))?.click();
  setTimeout(() => resolve(JSON.stringify({ hintFilledOneCell: emptyCount() === before - 1, remainingEmptyCells: emptyCount() })), 50);
})`));
results.sudokuSolver = JSON.parse(await evaluate(`new Promise((resolve) => {
  const grid = document.querySelector('[aria-label="Sudoku per il risolutore"]');
  const solve = [...document.querySelectorAll('button')].find((button) => button.innerText.trim() === "Risolvi");
  if (!grid || !solve) { resolve(JSON.stringify({ gridReady: Boolean(grid), solveButton: Boolean(solve), solved: false })); return; }
  solve.click();
  const deadline = Date.now() + 20000;
  const poll = () => {
    const status = [...document.querySelectorAll('[role="status"]')].map((element) => element.textContent ?? "").find((text) => text.includes("Schema risolto") || text.includes("non ha trovato")) ?? "";
    if (status || Date.now() >= deadline) {
      const solved = [...grid.querySelectorAll('[role="gridcell"]')].every((cell) => !(cell.getAttribute('aria-label') ?? "").endsWith("vuota"));
      resolve(JSON.stringify({ gridReady: true, solveButton: true, solved: status.includes("Schema risolto") && solved, status }));
    } else setTimeout(poll, 50);
  };
  poll();
})`));

await navigate("/progetti/breakout/");
results.breakout = JSON.parse(await evaluate(`new Promise((resolve) => {
  const canvas = document.querySelector('canvas');
  const context = canvas?.getContext('2d');
  const centerOfPaddle = () => {
    if (!context || !canvas) return -1;
    const row = context.getImageData(0, 424, canvas.width, 1).data;
    const pixels = [];
    for (let x = 0; x < canvas.width; x++) if (row[x * 4] > 200 && row[x * 4 + 1] > 200 && row[x * 4 + 2] > 200) pixels.push(x);
    return pixels.length ? pixels.reduce((sum, x) => sum + x, 0) / pixels.length : -1;
  };
  const before = centerOfPaddle();
  document.querySelector('[aria-label="Move paddle left"]')?.click();
  setTimeout(() => resolve(JSON.stringify({ canvasReady: Boolean(context), paddleMovedLeft: centerOfPaddle() < before - 20 })), 50);
})`));

await navigate("/progetti/twin-drift/");
results.twinDrift = JSON.parse(await evaluate(`new Promise((resolve) => {
  const canvas = document.querySelector('canvas');
  const context = canvas?.getContext('2d');
  const carPosition = () => {
    if (!context || !canvas) return null;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let xTotal = 0, yTotal = 0, count = 0;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      if (pixels[index] === 56 && pixels[index + 1] === 189 && pixels[index + 2] === 248) { xTotal += x; yTotal += y; count++; }
    }
    return count ? [xTotal / count, yTotal / count] : null;
  };
  const button = document.querySelector('button[aria-label="Accelerate"]');
  const before = carPosition();
  button?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 7, pointerType: 'mouse', button: 0 }));
  setTimeout(() => {
    button?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7, pointerType: 'mouse', button: 0 }));
    const after = carPosition();
    resolve(JSON.stringify({ canvasReady: Boolean(context), accelerationControl: Boolean(button), carMoved: Boolean(before && after && Math.abs(after[0] - before[0]) + Math.abs(after[1] - before[1]) > 8) }));
  }, 500);
})`));

await navigate("/progetti/abalone/");
results.abalone = JSON.parse(await evaluate(inFrame(`
  const canvas = doc.querySelector('#game');
  const rect = canvas?.getBoundingClientRect();
  if (canvas && rect) {
    const cellSize = Math.min(canvas.width, canvas.height) / 22;
    const x = rect.left + canvas.width / 2;
    const y = rect.top + canvas.height / 2 - Math.sqrt(3) * 4 * cellSize;
    canvas.dispatchEvent(new doc.defaultView.MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
  }
  setTimeout(() => resolve(JSON.stringify({ frameReady: Boolean(canvas), marbleSelectable: doc.querySelector('#status')?.textContent.includes('Selected 1 marble') })), 50);
`)));

await navigate("/progetti/azul/");
results.azul = JSON.parse(await evaluate(inFrame(`
  doc.querySelector('.factory')?.click();
  setTimeout(() => resolve(JSON.stringify({ factorySelectable: Boolean(doc.querySelector('#color-picker .tile:not(.dis)')) })), 50);
`)));

await navigate("/progetti/bitwise/");
results.bitwise = JSON.parse(await evaluate(inFrame(`
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const number = (id) => doc.querySelector(id);
  const decimalResult = () => doc.querySelector('#result .result-decimal')?.textContent?.trim();
  const readBits = () => [...doc.querySelectorAll('#algorithm-vis .bit-row:last-child .bit-box')].map((box) => box.textContent).join('');
  const run = async () => {
    const leftShiftButton = doc.querySelector('[data-op="lshift"]');
    const rightShiftButton = doc.querySelector('[data-op="rshift"]');
    const controlsReady = Boolean(leftShiftButton && rightShiftButton);
    number('#input-a').value = '12';
    number('#input-b').value = '10';
    leftShiftButton?.click();
    await wait(20);
    const largeLeftShiftReturnsZero = decimalResult() === '= 0 (decimal)';
    number('#input-b').value = '2';
    number('#input-b').dispatchEvent(new doc.defaultView.Event('input', { bubbles: true }));
    rightShiftButton?.click();
    await wait(20);
    const rightShiftUsesByteWidth = decimalResult() === '= 3 (decimal)';
    number('#input-a').value = '999';
    number('#input-a').dispatchEvent(new doc.defaultView.Event('input', { bubbles: true }));
    const byteInputClamped = number('#input-a').value === '255';
    doc.querySelector('.tab[data-tab="arithmetic"]')?.click();
    number('#arith-a').value = '13';
    number('#arith-b').value = '7';
    doc.querySelector('#arithmetic-tab [data-op="add"]')?.click();
    const binaryAdditionCorrect = readBits() === '00010100';
    number('#arith-b').value = '0';
    doc.querySelector('#arithmetic-tab [data-op="div"]')?.click();
    const divisionByZeroExplained = doc.querySelector('#algorithm-vis')?.textContent?.includes('Division by zero is undefined.') ?? false;
    resolve(JSON.stringify({ controlsReady, largeLeftShiftReturnsZero, rightShiftUsesByteWidth, byteInputClamped, binaryAdditionCorrect, divisionByZeroExplained }));
  };
  run();
`)));

await navigate("/progetti/flappy-bird/");
results.flappyBird = JSON.parse(await evaluate(inFrame(`
  const canvas = doc.querySelector('#game');
  const context = canvas?.getContext('2d');
  const birdY = () => {
    if (!context || !canvas) return -1;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let total = 0, count = 0;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      if (pixels[index] === 251 && pixels[index + 1] === 191 && pixels[index + 2] === 36) { total += y; count++; }
    }
    return count ? total / count : -1;
  };
  const before = birdY();
  canvas?.dispatchEvent(new doc.defaultView.PointerEvent('pointerdown', { bubbles: true, pointerId: 9, pointerType: 'mouse' }));
  setTimeout(() => resolve(JSON.stringify({ birdRespondedToTap: birdY() < before - 4 })), 80);
`)));

await navigate("/progetti/flip-7/");
results.flip7 = JSON.parse(await evaluate(inFrame(`
  const button = doc.querySelector('#btn-flip');
  const initialMessage = doc.querySelector('#message-area')?.textContent;
  button?.click();
  setTimeout(() => resolve(JSON.stringify({
    cardFlipped: (doc.querySelectorAll('#card-container .card').length) === 1,
    cardCount: doc.querySelector('#card-container')?.children.length ?? -1,
    controlsReady: (button instanceof doc.defaultView.HTMLButtonElement && !button.disabled) || !doc.querySelector('#btn-reset')?.classList.contains('hidden'),
    initialMessage,
    message: doc.querySelector('#message-area')?.textContent,
    cardContainerFound: Boolean(doc.querySelector('#card-container')),
    gameScriptLoaded: [...doc.scripts].some((script) => script.src.endsWith('/game.js'))
  })), 700);
`)));

await navigate("/progetti/mastermind/");
results.mastermind = JSON.parse(await evaluate(inFrame(`
  doc.querySelector('.peg')?.click();
  doc.querySelector('.swatch')?.click();
  setTimeout(() => resolve(JSON.stringify({ pegColored: Boolean(doc.querySelector('.peg.filled')) })), 50);
`)));

await navigate("/progetti/pong/");
results.pong = JSON.parse(await evaluate(inFrame(`
  const canvas = doc.querySelector('#pong');
  doc.dispatchEvent(new doc.defaultView.KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  setTimeout(() => { doc.dispatchEvent(new doc.defaultView.KeyboardEvent('keyup', { key: 'ArrowUp', bubbles: true })); resolve(JSON.stringify({ canvasReady: Boolean(canvas?.getContext('2d')), keyboardReceived: Boolean(canvas) })); }, 100);
`)));

await navigate("/progetti/snake/");
results.snake = JSON.parse(await evaluate(inFrame(`
  const canvas = doc.querySelector('#game-canvas');
  doc.dispatchEvent(new doc.defaultView.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  setTimeout(() => resolve(JSON.stringify({ canvasReady: Boolean(canvas?.getContext('2d')), keyboardReceived: Boolean(canvas) })), 100);
`)));

await navigate("/progetti/tris/");
results.tris = JSON.parse(await evaluate(inFrame(`
  doc.querySelector('.cell')?.click();
  setTimeout(() => resolve(JSON.stringify({ bothPlayersMoved: (doc.querySelectorAll('.cell.x, .cell.o').length) === 2 })), 350);
`)));

await navigate("/progetti/maze-generator/");
results.mazeGenerator = JSON.parse(await evaluate(inFrame(`
  const speed = doc.querySelector('#speed-range');
  if (speed) speed.value = '50';
  doc.querySelector('#btn-generate')?.click();
  setTimeout(() => resolve(JSON.stringify({ generationStarted: Boolean(doc.querySelector('#btn-generate')?.disabled) })), 80);
`)));

await navigate("/progetti/maze-solver/");
results.mazeSolver = JSON.parse(await evaluate(inFrame(`
  doc.querySelector('#btn-solve')?.click();
  setTimeout(() => resolve(JSON.stringify({ solvingStarted: Boolean(doc.querySelector('#btn-solve')?.disabled) })), 80);
`)));

socket.close();
console.log(JSON.stringify({ results, errors }, null, 2));
if (Object.values(results).some((result) => Object.values(result as Record<string, boolean>).some((passed) => passed === false)) || errors.length) process.exitCode = 1;
