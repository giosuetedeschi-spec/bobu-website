/**
 * Bitwise Operations Interactive - Main Logic
 * Educational tool for learning bitwise and binary arithmetic operations
 */

type BitwiseOperation = "and" | "or" | "xor" | "not" | "lshift" | "rshift";
type ArithmeticOperation = "add" | "sub" | "mul" | "div";
type ArithmeticStep = { position?: number; bitA?: number; bitB?: number; carry?: number; resultBit?: number; description: string; detail?: string; partialResult?: number; quotient?: number; remainder?: number };
type ArithmeticResult = { result: number; steps: ArithmeticStep[]; remainder?: number };
export function applyBitwiseOperation(a: number, b: number, operation: BitwiseOperation): number {
    switch (operation) {
        case "and": return a & b;
        case "or": return a | b;
        case "xor": return a ^ b;
        case "not": return ~a & 0xFF;
        case "lshift": return b >= 8 ? 0 : (a << b) & 0xFF;
        case "rshift": return b >= 8 ? 0 : a >> b;
    }
    return 0;
}

function byId<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing Bitwise Visualizer element: #${id}`);
    return element as T;
}

function one<T extends Element>(parent: ParentNode, selector: string): T {
    const element = parent.querySelector<T>(selector);
    if (!element) throw new Error(`Missing Bitwise Visualizer element: ${selector}`);
    return element;
}

// Render an unsigned byte without leaking extra bits into the visualization.
function toBinary(num: number, bits = 8): string {
    return (num & 0xFF).toString(2).padStart(bits, '0');
}

function readInputNumber(id: string, max: number): number {
    const input = byId<HTMLInputElement>(id);
    const parsed = Number.parseInt(input.value, 10);
    const value = Number.isFinite(parsed) ? Math.min(max, Math.max(0, parsed)) : 0;
    if (input.value !== "" && input.value !== String(value)) input.value = String(value);
    return value;
}

function bindBinaryInput(inputId: string, displayId: string, max: number): void {
    const input = byId<HTMLInputElement>(inputId);
    const display = byId<HTMLElement>(displayId);
    input.addEventListener('input', () => display.textContent = toBinary(readInputNumber(inputId, max)));
}

// Tab switching
function setupTabs() {
    const tabs = document.querySelectorAll<HTMLButtonElement>('.tab');
    const tabContents = document.querySelectorAll<HTMLElement>('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            if (!targetTab) return;

            // Update active states
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            tab.classList.add('active');
            byId<HTMLElement>(`${targetTab}-tab`).classList.add('active');
        });
    });
}

// Update binary displays when inputs change
function setupInputListeners() {
    bindBinaryInput('input-a', 'binary-a', 255);
    bindBinaryInput('input-b', 'binary-b', 255);
    bindBinaryInput('arith-a', 'arith-binary-a', 127);
    bindBinaryInput('arith-b', 'arith-binary-b', 127);
}

// Create bit visualization
function createBitVisualization(label: string, bits: string, className = ''): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'bit-row';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'bit-label';
    labelSpan.textContent = label;
    row.appendChild(labelSpan);

    const bitsArray = bits.split('');
    bitsArray.forEach((bit, idx) => {
        const bitBox = document.createElement('div');
        bitBox.className = `bit-box ${className}`;
        bitBox.textContent = bit;
        bitBox.dataset.index = String(idx);
        row.appendChild(bitBox);
    });

    return row;
}

// Animate bitwise operation
async function animateBitwiseOp(a: number, b: number, operation: BitwiseOperation): Promise<number> {
    const visualization = byId<HTMLElement>('visualization');
    visualization.innerHTML = '';

    const aBits = toBinary(a);
    const bBits = toBinary(b);

    // Create input rows
    visualization.appendChild(createBitVisualization('A:', aBits));

    if (operation !== 'not') {
        visualization.appendChild(createBitVisualization('B:', bBits));
    }

    // Operation symbol
    const opRow = document.createElement('div');
    opRow.className = 'bit-row';
    opRow.innerHTML = `<span class="operation-symbol">${getOperationSymbol(operation)}</span>`;
    visualization.appendChild(opRow);

    // Result row
    const result = applyBitwiseOperation(a, b, operation);

    const resultBits = toBinary(result);
    const resultRow = createBitVisualization('Result:', resultBits, 'result');
    visualization.appendChild(resultRow);

    // Animate bit by bit
    if (operation !== 'lshift' && operation !== 'rshift') {
        for (let i = 0; i < 8; i++) {
            animateBitOperation(i);
            await delay(300);
        }
    } else {
        // For shifts, just show the result
        const resultBoxes = resultRow.querySelectorAll<HTMLElement>('.bit-box');
        resultBoxes.forEach((box, i) => {
            setTimeout(() => {
                box.classList.add('active');
            }, i * 100);
        });
    }

    return result;
}

function getOperationSymbol(op: BitwiseOperation): string {
    const symbols: Record<BitwiseOperation, string> = {
        'and': 'AND (&)',
        'or': 'OR (|)',
        'xor': 'XOR (^)',
        'not': 'NOT (~)',
        'lshift': '<<',
        'rshift': '>>'
    };
    return symbols[op];
}

function animateBitOperation(bitIndex: number): void {
    const visualization = byId<HTMLElement>('visualization');
    const rows = visualization.querySelectorAll<HTMLElement>('.bit-row');
    const boxes = rows[rows.length - 1].querySelectorAll<HTMLElement>('.bit-box');

    boxes[bitIndex].classList.add('active');
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Display result
function displayResult(result: number): void {
    const resultDiv = byId<HTMLElement>('result');
    resultDiv.classList.remove('hidden');

    one<HTMLElement>(resultDiv, '.result-binary').textContent = toBinary(result);
    one<HTMLElement>(resultDiv, '.result-decimal').textContent = `= ${result} (decimal)`;
}

// Display code
function displayCode(operation: BitwiseOperation, a: number, b: number) {
    const codeDisplay = byId<HTMLElement>('code-display');
    const codeContent = byId<HTMLElement>('code-content');

    let code = '';
    if (operation === 'and') code = `const result = ${a} & ${b}; // ${a & b}`;
    else if (operation === 'or') code = `const result = ${a} | ${b}; // ${a | b}`;
    else if (operation === 'xor') code = `const result = ${a} ^ ${b}; // ${a ^ b}`;
    else if (operation === 'not') code = `const result = ~${a} & 0xFF; // ${(~a & 0xFF)}`;
    else if (operation === 'lshift') code = `const result = ${b} >= 8 ? 0 : (${a} << ${b}) & 0xFF; // ${b >= 8 ? 0 : (a << b) & 0xFF}`;
    else if (operation === 'rshift') code = `const result = ${b} >= 8 ? 0 : ${a} >> ${b}; // ${b >= 8 ? 0 : a >> b}`;

    codeContent.textContent = code;
    codeDisplay.classList.remove('hidden');

}

// Handle bitwise operation buttons
function setupBitwiseOperations() {
    const opButtons = document.querySelectorAll<HTMLButtonElement>('#bitwise-tab .op-btn');

    opButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const operation = btn.dataset.op as BitwiseOperation;
            const a = readInputNumber('input-a', 255);
            const b = readInputNumber('input-b', 255);

            const result = await animateBitwiseOp(a, b, operation);
            displayResult(result);
            displayCode(operation, a, b);
        });
    });
}

// Binary Arithmetic Operations
export class BinaryArithmetic {
    static add(a: number, b: number): ArithmeticResult {
        const steps: ArithmeticStep[] = [];
        let carry = 0;
        let result = 0;

        for (let i = 0; i < 8; i++) {
            const bitA = (a >> i) & 1;
            const bitB = (b >> i) & 1;
            const incomingCarry = carry;
            const sum = bitA + bitB + incomingCarry;

            const resultBit = sum & 1;
            carry = sum >> 1;

            result |= (resultBit << i);

            steps.push({
                position: i,
                bitA,
                bitB,
                carry,
                resultBit,
                description: `Bit ${i}: ${bitA} + ${bitB} + carry(${incomingCarry}) = ${sum} → result=${resultBit}, carry=${carry}`
            });
        }

        return { result, steps };
    }

    static subtract(a: number, b: number): ArithmeticResult {
        // Using two's complement: a - b = a + (~b + 1)
        const steps: ArithmeticStep[] = [];
        const complement = (~b & 0xFF) + 1;

        steps.push({
            description: `Subtract using two's complement: ${a} - ${b} = ${a} + (~${b} + 1)`,
            detail: `~${b} = ${~b & 0xFF}, then add 1 → ${complement}`
        });

        const addResult = this.add(a, complement & 0xFF);
        steps.push(...addResult.steps);

        return { result: addResult.result & 0xFF, steps };
    }

    static multiply(a: number, b: number): ArithmeticResult {
        const steps: ArithmeticStep[] = [];
        let result = 0;

        for (let i = 0; i < 8; i++) {
            if ((b >> i) & 1) {
                const partial = a << i;
                result += partial;
                steps.push({
                    position: i,
                    description: `Bit ${i} of B is 1: Add ${a} << ${i} = ${partial & 0xFF}`,
                    partialResult: result & 0xFF
                });
            } else {
                steps.push({
                    position: i,
                    description: `Bit ${i} of B is 0: Skip`,
                    partialResult: result & 0xFF
                });
            }
        }

        return { result: result & 0xFF, steps };
    }

    static divide(a: number, b: number): ArithmeticResult {
        if (b === 0) {
            return { result: 0, steps: [{ description: 'Error: Division by zero!' }] };
        }

        const steps: ArithmeticStep[] = [];
        let quotient = 0;
        let remainder = a;

        for (let i = 7; i >= 0; i--) {
            const divisor = b << i;
            if (remainder >= divisor) {
                remainder -= divisor;
                quotient |= (1 << i);
                steps.push({
                    position: i,
                    description: `${remainder + divisor} >= ${b} << ${i} (${divisor}): quotient bit ${i} = 1, remainder = ${remainder}`,
                    quotient,
                    remainder
                });
            } else {
                steps.push({
                    position: i,
                    description: `${remainder} < ${b} << ${i} (${divisor}): quotient bit ${i} = 0`,
                    quotient,
                    remainder
                });
            }
        }

        return { result: quotient, remainder, steps };
    }
}

// Current step tracking for arithmetic
let currentSteps: ArithmeticStep[] = [];
let currentStepIndex = 0;

// Display algorithm steps
function displayAlgorithmSteps(steps: ArithmeticStep[]) {
    const stepsDiv = byId<HTMLElement>('algorithm-steps');
    const stepsContent = byId<HTMLElement>('steps-content');

    currentSteps = steps;
    currentStepIndex = 0;

    stepsContent.innerHTML = '';
    steps.forEach((step, idx) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';
        stepDiv.textContent = step.description || JSON.stringify(step);
        stepDiv.dataset.index = String(idx);
        stepsContent.appendChild(stepDiv);
    });

    stepsDiv.classList.remove('hidden');
    updateStepDisplay();
}

function updateStepDisplay() {
    const steps = document.querySelectorAll<HTMLElement>('.step');
    steps.forEach((step, idx) => {
        step.classList.toggle('active', idx === currentStepIndex);
    });

    byId<HTMLElement>('step-counter').textContent = `Step ${currentStepIndex + 1} / ${currentSteps.length}`;
    byId<HTMLButtonElement>('prev-step').disabled = currentStepIndex === 0;
    byId<HTMLButtonElement>('next-step').disabled = currentStepIndex === currentSteps.length - 1;
}

// Setup arithmetic operations
function setupArithmeticOperations() {
    const opButtons = document.querySelectorAll<HTMLButtonElement>('#arithmetic-tab .op-btn');

    opButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const operation = btn.dataset.op as ArithmeticOperation;
            const a = readInputNumber('arith-a', 127);
            const b = readInputNumber('arith-b', 127);

            const calculators: Record<ArithmeticOperation, (left: number, right: number) => ArithmeticResult> = {
                add: BinaryArithmetic.add,
                sub: BinaryArithmetic.subtract,
                mul: BinaryArithmetic.multiply,
                div: BinaryArithmetic.divide,
            };
            const result = calculators[operation](a, b);

            if (operation === 'div' && b === 0) {
                displayAlgorithmSteps(result.steps);
                const codeDisplay = byId<HTMLElement>('arith-code-display');
                const codeContent = byId<HTMLElement>('arith-code-content');
                const visualization = byId<HTMLElement>('algorithm-vis');
                codeContent.textContent = '// Division by zero is undefined.';
                codeDisplay.classList.remove('hidden');
                visualization.textContent = 'Division by zero is undefined.';
                return;
            }

            displayAlgorithmSteps(result.steps);
            displayArithmeticCode(operation, a, b, result.result);
            visualizeArithmeticOperation(operation, a, b, result);
        });
    });

    // Step navigation
    byId<HTMLButtonElement>('prev-step').addEventListener('click', () => {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            updateStepDisplay();
        }
    });

    byId<HTMLButtonElement>('next-step').addEventListener('click', () => {
        if (currentStepIndex < currentSteps.length - 1) {
            currentStepIndex++;
            updateStepDisplay();
        }
    });
}

function visualizeArithmeticOperation(operation: ArithmeticOperation, a: number, b: number, result: ArithmeticResult) {
    const visDiv = byId<HTMLElement>('algorithm-vis');
    visDiv.innerHTML = '';

    visDiv.appendChild(createBitVisualization('A:', toBinary(a)));
    visDiv.appendChild(createBitVisualization('B:', toBinary(b)));

    const opRow = document.createElement('div');
    opRow.className = 'bit-row';
    opRow.innerHTML = `<span class="operation-symbol">${operation.toUpperCase()}</span>`;
    visDiv.appendChild(opRow);

    visDiv.appendChild(createBitVisualization('Result:', toBinary(result.result), 'result'));
}

function displayArithmeticCode(operation: ArithmeticOperation, a: number, b: number, result: number) {
    const codeDisplay = byId<HTMLElement>('arith-code-display');
    const codeContent = byId<HTMLElement>('arith-code-content');

    let code = '';
    if (operation === 'add') {
        code = `// Binary Addition\nlet result = 0, carry = 0;\nfor (let i = 0; i < 8; i++) {\n  const bitA = (${a} >> i) & 1;\n  const bitB = (${b} >> i) & 1;\n  const sum = bitA + bitB + carry;\n  result |= ((sum & 1) << i);\n  carry = sum >> 1;\n}\n// Result: ${result}`;
    } else if (operation === 'sub') {
        code = `// Binary Subtraction (Two's Complement)\nconst complement = (~${b} + 1) & 0xFF;\nconst result = (${a} + complement) & 0xFF;\n// Result: ${result}`;
    } else if (operation === 'mul') {
        code = `// Binary Multiplication (Shift and Add)\nlet result = 0;\nfor (let i = 0; i < 8; i++) {\n  if ((${b} >> i) & 1) {\n    result += ${a} << i;\n  }\n}\n// Result: ${result & 0xFF}`;
    } else if (operation === 'div') {
        code = `// Binary Division (Shift and Subtract)\nlet quotient = 0, remainder = ${a};\nfor (let i = 7; i >= 0; i--) {\n  if (remainder >= (${b} << i)) {\n    remainder -= (${b} << i);\n    quotient |= (1 << i);\n  }\n}\n// Quotient: ${result}; remainder: ${a % b}`;
    }

    codeContent.textContent = code;
    codeDisplay.classList.remove('hidden');
}

// Initialize
if (typeof document !== "undefined") {
    document.addEventListener('DOMContentLoaded', () => {
        setupTabs();
        setupInputListeners();
        setupBitwiseOperations();
        setupArithmeticOperations();
    });
}
