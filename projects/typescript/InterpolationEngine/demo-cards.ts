import { Interpolated, type Point } from "./interpolation";

type Card = { id: number; slot: number; pos: Interpolated<Point>; scale: Interpolated<number>; flip: Interpolated<number> };

export function mountCardDemo(root: HTMLElement): () => void {
  const canvas = document.createElement("canvas");
  const status = document.createElement("p");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  status.textContent = "Drag a card to swap positions. Right-click a card to flip it.";
  root.replaceChildren(status, canvas);
  canvas.style.cssText = "display:block;width:100%;height:auto;touch-action:none;background:#1e1e1e;border-radius:12px";
  const columns = 6, rows = 4, cardWidth = 100, cardHeight = 150, gap = 20;
  const cards: Card[] = [];
  let dragged: Card | null = null;
  let dragOffset: Point = { x: 0, y: 0 };
  let animation = 0;

  const gridPoint = (slot: number): Point => ({
    x: (1024 - (columns * (cardWidth + gap) - gap)) / 2 + slot % columns * (cardWidth + gap) + cardWidth / 2,
    y: (768 - (rows * (cardHeight + gap) - gap)) / 2 + Math.floor(slot / columns) * (cardHeight + gap) + cardHeight / 2,
  });
  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    const scale = Math.min(1, root.clientWidth / 1024);
    canvas.width = 1024 * scale * ratio;
    canvas.height = 768 * scale * ratio;
    canvas.style.aspectRatio = "4 / 3";
    context.setTransform(ratio * scale, 0, 0, ratio * scale, 0, 0);
    draw();
  };
  const drawCard = (card: Card) => {
    const { x, y } = card.pos.value;
    const flip = card.flip.value;
    const width = cardWidth * card.scale.value * Math.max(0.04, Math.abs(flip));
    const height = cardHeight * card.scale.value;
    context.save();
    context.translate(x, y);
    context.fillStyle = flip >= 0 ? "#f0f0f0" : "#c86464";
    context.strokeStyle = "#d4af37";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(-width / 2, -height / 2, width, height, 8);
    context.fill();
    context.stroke();
    if (Math.abs(flip) > 0.2) {
      context.fillStyle = flip >= 0 ? "#805030" : "#fff4df";
      context.font = "bold 32px system-ui";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(flip >= 0 ? String(card.id + 1) : "★", 0, 0);
    }
    context.restore();
  };
  const draw = () => {
    context.clearRect(0, 0, 1024, 768);
    for (const card of cards) drawCard(card);
    if (cards.some((card) => Math.abs(card.pos.value.x - gridPoint(card.slot).x) > 0.5 || Math.abs(card.pos.value.y - gridPoint(card.slot).y) > 0.5 || Math.abs(card.scale.value - (card === dragged ? 1.2 : 1)) > 0.01 || Math.abs(Math.abs(card.flip.value) - 1) > 0.01)) {
      animation = requestAnimationFrame(draw);
    } else animation = 0;
  };
  const pointerPosition = (event: PointerEvent): Point => {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * 1024 / rect.width, y: (event.clientY - rect.top) * 768 / rect.height };
  };
  const hitTest = (point: Point, except?: Card | null) => [...cards].reverse().find((card) => {
    if (card === except) return false;
    const pos = card.pos.value;
    return Math.abs(point.x - pos.x) <= cardWidth / 2 && Math.abs(point.y - pos.y) <= cardHeight / 2;
  });
  const onDown = (event: PointerEvent) => {
    const point = pointerPosition(event);
    const card = hitTest(point);
    if (!card) return;
    canvas.setPointerCapture(event.pointerId);
    if (event.button === 2) { card.flip.setValue(card.flip.value > 0 ? -1 : 1); draw(); return; }
    dragged = card;
    dragOffset = { x: card.pos.value.x - point.x, y: card.pos.value.y - point.y };
    card.scale.setDuration(0.12);
    card.scale.setValue(1.2);
    cards.splice(cards.indexOf(card), 1);
    cards.push(card);
    draw();
  };
  const onMove = (event: PointerEvent) => {
    if (!dragged) return;
    const point = pointerPosition(event);
    dragged.pos.setDuration(0.05);
    dragged.pos.setValue({ x: point.x + dragOffset.x, y: point.y + dragOffset.y });
    draw();
  };
  const onUp = (event: PointerEvent) => {
    if (!dragged) return;
    const droppedOn = hitTest(pointerPosition(event), dragged);
    if (droppedOn && droppedOn !== dragged) [dragged.slot, droppedOn.slot] = [droppedOn.slot, dragged.slot];
    dragged.scale.setDuration(0.2);
    dragged.scale.setValue(1);
    dragged.pos.setDuration(0.4);
    dragged.pos.setValue(gridPoint(dragged.slot));
    if (droppedOn && droppedOn !== dragged) {
      droppedOn.pos.setDuration(0.4);
      droppedOn.pos.setValue(gridPoint(droppedOn.slot));
    }
    dragged = null;
    draw();
  };

  for (let id = 0; id < rows * columns; id++) {
    const position = gridPoint(id);
    cards.push({ id, slot: id, pos: new Interpolated<Point>(position, 0.4, "easeOutBack"), scale: new Interpolated(1, 0.2, "easeOutBack"), flip: new Interpolated(1, 0.3, "easeInOutExponential") });
  }
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  const observer = new ResizeObserver(resize);
  observer.observe(root);
  resize();
  return () => { cancelAnimationFrame(animation); observer.disconnect(); canvas.removeEventListener("pointerdown", onDown); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerup", onUp); root.replaceChildren(); };
}
