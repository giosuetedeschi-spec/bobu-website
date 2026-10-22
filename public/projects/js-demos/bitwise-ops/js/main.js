export function applyBitwiseOperation(a, b, operation) {
  switch (operation) {
    case "and":
      return a & b;
    case "or":
      return a | b;
    case "xor":
      return a ^ b;
    case "not":
      return ~a & 255;
    case "lshift":
      return b >= 8 ? 0 : a << b & 255;
    case "rshift":
      return b >= 8 ? 0 : a >> b;
  }
  return 0;
}
function byId(id) {
  const element = document.getElementById(id);
  if (!element)
    throw new Error(`Missing Bitwise Visualizer element: #${id}`);
  return element;
}
function one(parent, selector) {
  const element = parent.querySelector(selector);
  if (!element)
    throw new Error(`Missing Bitwise Visualizer element: ${selector}`);
  return element;
}
function toBinary(num, bits = 8) {
  return (num & 255).toString(2).padStart(bits, "0");
}
function readInputNumber(id, max) {
  const input = byId(id);
  const parsed = Number.parseInt(input.value, 10);
  const value = Number.isFinite(parsed) ? Math.min(max, Math.max(0, parsed)) : 0;
  if (input.value !== "" && input.value !== String(value))
    input.value = String(value);
  return value;
}
function bindBinaryInput(inputId, displayId, max) {
  const input = byId(inputId);
  const display = byId(displayId);
  input.addEventListener("input", () => display.textContent = toBinary(readInputNumber(inputId, max)));
}
function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetTab = tab.dataset.tab;
      if (!targetTab)
        return;
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((tc) => tc.classList.remove("active"));
      tab.classList.add("active");
      byId(`${targetTab}-tab`).classList.add("active");
    });
  });
}
function setupInputListeners() {
  bindBinaryInput("input-a", "binary-a", 255);
  bindBinaryInput("input-b", "binary-b", 255);
  bindBinaryInput("arith-a", "arith-binary-a", 127);
  bindBinaryInput("arith-b", "arith-binary-b", 127);
}
function createBitVisualization(label, bits, className = "") {
  const row = document.createElement("div");
  row.className = "bit-row";
  const labelSpan = document.createElement("span");
  labelSpan.className = "bit-label";
  labelSpan.textContent = label;
  row.appendChild(labelSpan);
  const bitsArray = bits.split("");
  bitsArray.forEach((bit, idx) => {
    const bitBox = document.createElement("div");
    bitBox.className = `bit-box ${className}`;
    bitBox.textContent = bit;
    bitBox.dataset.index = String(idx);
    row.appendChild(bitBox);
  });
  return row;
}
async function animateBitwiseOp(a, b, operation) {
  const visualization = byId("visualization");
  visualization.innerHTML = "";
  const aBits = toBinary(a);
  const bBits = toBinary(b);
  visualization.appendChild(createBitVisualization("A:", aBits));
  if (operation !== "not") {
    visualization.appendChild(createBitVisualization("B:", bBits));
  }
  const opRow = document.createElement("div");
  opRow.className = "bit-row";
  opRow.innerHTML = `<span class="operation-symbol">${getOperationSymbol(operation)}</span>`;
  visualization.appendChild(opRow);
  const result = applyBitwiseOperation(a, b, operation);
  const resultBits = toBinary(result);
  const resultRow = createBitVisualization("Result:", resultBits, "result");
  visualization.appendChild(resultRow);
  if (operation !== "lshift" && operation !== "rshift") {
    for (let i = 0;i < 8; i++) {
      animateBitOperation(i);
      await delay(300);
    }
  } else {
    const resultBoxes = resultRow.querySelectorAll(".bit-box");
    resultBoxes.forEach((box, i) => {
      setTimeout(() => {
        box.classList.add("active");
      }, i * 100);
    });
  }
  return result;
}
function getOperationSymbol(op) {
  const symbols = {
    and: "AND (&)",
    or: "OR (|)",
    xor: "XOR (^)",
    not: "NOT (~)",
    lshift: "<<",
    rshift: ">>"
  };
  return symbols[op];
}
function animateBitOperation(bitIndex) {
  const visualization = byId("visualization");
  const rows = visualization.querySelectorAll(".bit-row");
  const boxes = rows[rows.length - 1].querySelectorAll(".bit-box");
  boxes[bitIndex].classList.add("active");
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function displayResult(result) {
  const resultDiv = byId("result");
  resultDiv.classList.remove("hidden");
  one(resultDiv, ".result-binary").textContent = toBinary(result);
  one(resultDiv, ".result-decimal").textContent = `= ${result} (decimal)`;
}
function displayCode(operation, a, b) {
  const codeDisplay = byId("code-display");
  const codeContent = byId("code-content");
  let code = "";
  if (operation === "and")
    code = `const result = ${a} & ${b}; // ${a & b}`;
  else if (operation === "or")
    code = `const result = ${a} | ${b}; // ${a | b}`;
  else if (operation === "xor")
    code = `const result = ${a} ^ ${b}; // ${a ^ b}`;
  else if (operation === "not")
    code = `const result = ~${a} & 0xFF; // ${~a & 255}`;
  else if (operation === "lshift")
    code = `const result = ${b} >= 8 ? 0 : (${a} << ${b}) & 0xFF; // ${b >= 8 ? 0 : a << b & 255}`;
  else if (operation === "rshift")
    code = `const result = ${b} >= 8 ? 0 : ${a} >> ${b}; // ${b >= 8 ? 0 : a >> b}`;
  codeContent.textContent = code;
  codeDisplay.classList.remove("hidden");
}
function setupBitwiseOperations() {
  const opButtons = document.querySelectorAll("#bitwise-tab .op-btn");
  opButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const operation = btn.dataset.op;
      const a = readInputNumber("input-a", 255);
      const b = readInputNumber("input-b", 255);
      const result = await animateBitwiseOp(a, b, operation);
      displayResult(result);
      displayCode(operation, a, b);
    });
  });
}

export class BinaryArithmetic {
  static add(a, b) {
    const steps = [];
    let carry = 0;
    let result = 0;
    for (let i = 0;i < 8; i++) {
      const bitA = a >> i & 1;
      const bitB = b >> i & 1;
      const incomingCarry = carry;
      const sum = bitA + bitB + incomingCarry;
      const resultBit = sum & 1;
      carry = sum >> 1;
      result |= resultBit << i;
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
  static subtract(a, b) {
    const steps = [];
    const complement = (~b & 255) + 1;
    steps.push({
      description: `Subtract using two's complement: ${a} - ${b} = ${a} + (~${b} + 1)`,
      detail: `~${b} = ${~b & 255}, then add 1 → ${complement}`
    });
    const addResult = this.add(a, complement & 255);
    steps.push(...addResult.steps);
    return { result: addResult.result & 255, steps };
  }
  static multiply(a, b) {
    const steps = [];
    let result = 0;
    for (let i = 0;i < 8; i++) {
      if (b >> i & 1) {
        const partial = a << i;
        result += partial;
        steps.push({
          position: i,
          description: `Bit ${i} of B is 1: Add ${a} << ${i} = ${partial & 255}`,
          partialResult: result & 255
        });
      } else {
        steps.push({
          position: i,
          description: `Bit ${i} of B is 0: Skip`,
          partialResult: result & 255
        });
      }
    }
    return { result: result & 255, steps };
  }
  static divide(a, b) {
    if (b === 0) {
      return { result: 0, steps: [{ description: "Error: Division by zero!" }] };
    }
    const steps = [];
    let quotient = 0;
    let remainder = a;
    for (let i = 7;i >= 0; i--) {
      const divisor = b << i;
      if (remainder >= divisor) {
        remainder -= divisor;
        quotient |= 1 << i;
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
let currentSteps = [];
let currentStepIndex = 0;
function displayAlgorithmSteps(steps) {
  const stepsDiv = byId("algorithm-steps");
  const stepsContent = byId("steps-content");
  currentSteps = steps;
  currentStepIndex = 0;
  stepsContent.innerHTML = "";
  steps.forEach((step, idx) => {
    const stepDiv = document.createElement("div");
    stepDiv.className = "step";
    stepDiv.textContent = step.description || JSON.stringify(step);
    stepDiv.dataset.index = String(idx);
    stepsContent.appendChild(stepDiv);
  });
  stepsDiv.classList.remove("hidden");
  updateStepDisplay();
}
function updateStepDisplay() {
  const steps = document.querySelectorAll(".step");
  steps.forEach((step, idx) => {
    step.classList.toggle("active", idx === currentStepIndex);
  });
  byId("step-counter").textContent = `Step ${currentStepIndex + 1} / ${currentSteps.length}`;
  byId("prev-step").disabled = currentStepIndex === 0;
  byId("next-step").disabled = currentStepIndex === currentSteps.length - 1;
}
function setupArithmeticOperations() {
  const opButtons = document.querySelectorAll("#arithmetic-tab .op-btn");
  opButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const operation = btn.dataset.op;
      const a = readInputNumber("arith-a", 127);
      const b = readInputNumber("arith-b", 127);
      const calculators = {
        add: BinaryArithmetic.add,
        sub: BinaryArithmetic.subtract,
        mul: BinaryArithmetic.multiply,
        div: BinaryArithmetic.divide
      };
      const result = calculators[operation](a, b);
      if (operation === "div" && b === 0) {
        displayAlgorithmSteps(result.steps);
        const codeDisplay = byId("arith-code-display");
        const codeContent = byId("arith-code-content");
        const visualization = byId("algorithm-vis");
        codeContent.textContent = "// Division by zero is undefined.";
        codeDisplay.classList.remove("hidden");
        visualization.textContent = "Division by zero is undefined.";
        return;
      }
      displayAlgorithmSteps(result.steps);
      displayArithmeticCode(operation, a, b, result.result);
      visualizeArithmeticOperation(operation, a, b, result);
    });
  });
  byId("prev-step").addEventListener("click", () => {
    if (currentStepIndex > 0) {
      currentStepIndex--;
      updateStepDisplay();
    }
  });
  byId("next-step").addEventListener("click", () => {
    if (currentStepIndex < currentSteps.length - 1) {
      currentStepIndex++;
      updateStepDisplay();
    }
  });
}
function visualizeArithmeticOperation(operation, a, b, result) {
  const visDiv = byId("algorithm-vis");
  visDiv.innerHTML = "";
  visDiv.appendChild(createBitVisualization("A:", toBinary(a)));
  visDiv.appendChild(createBitVisualization("B:", toBinary(b)));
  const opRow = document.createElement("div");
  opRow.className = "bit-row";
  opRow.innerHTML = `<span class="operation-symbol">${operation.toUpperCase()}</span>`;
  visDiv.appendChild(opRow);
  visDiv.appendChild(createBitVisualization("Result:", toBinary(result.result), "result"));
}
function displayArithmeticCode(operation, a, b, result) {
  const codeDisplay = byId("arith-code-display");
  const codeContent = byId("arith-code-content");
  let code = "";
  if (operation === "add") {
    code = `// Binary Addition
let result = 0, carry = 0;
for (let i = 0; i < 8; i++) {
  const bitA = (${a} >> i) & 1;
  const bitB = (${b} >> i) & 1;
  const sum = bitA + bitB + carry;
  result |= ((sum & 1) << i);
  carry = sum >> 1;
}
// Result: ${result}`;
  } else if (operation === "sub") {
    code = `// Binary Subtraction (Two's Complement)
const complement = (~${b} + 1) & 0xFF;
const result = (${a} + complement) & 0xFF;
// Result: ${result}`;
  } else if (operation === "mul") {
    code = `// Binary Multiplication (Shift and Add)
let result = 0;
for (let i = 0; i < 8; i++) {
  if ((${b} >> i) & 1) {
    result += ${a} << i;
  }
}
// Result: ${result & 255}`;
  } else if (operation === "div") {
    code = `// Binary Division (Shift and Subtract)
let quotient = 0, remainder = ${a};
for (let i = 7; i >= 0; i--) {
  if (remainder >= (${b} << i)) {
    remainder -= (${b} << i);
    quotient |= (1 << i);
  }
}
// Quotient: ${result}; remainder: ${a % b}`;
  }
  codeContent.textContent = code;
  codeDisplay.classList.remove("hidden");
}
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    setupTabs();
    setupInputListeners();
    setupBitwiseOperations();
    setupArithmeticOperations();
  });
}
