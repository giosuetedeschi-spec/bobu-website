import { Interpolated, type Point } from "./interpolation";

type Card = { label: string; pos: Interpolated<Point>; flip: Interpolated<number>; rotation: Interpolated<number> };

export function mountDeckDemo(root: HTMLElement): () => void {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  root.replaceChildren(canvas);
  canvas.style.cssText = "display:block;width:100%;height:auto;background:#141419;border-radius:14px";
  const width = 1200, height = 800, cardWidth = 100, cardHeight = 150;
  const deck = { x: 100, y: 150 };
  const characters = [..."THANKSFORWATCHING!"];
  const cards: Card[] = characters.map((label, index) => ({
    label,
    pos: new Interpolated<Point>({ ...deck }, 0.65, "easeOutBack"),
    flip: new Interpolated(-1, 0.45, "easeInOutExponential"),
    rotation: new Interpolated((index % 5 - 2) * 2, 0.65, "easeOutBack"),
  }));
  const targets: Array<{ card: Card; pos: Point; rotation: number }> = [];
  const addWord = (word: string, y: number, arc = false) => {
    const spacing = cardWidth + 10;
    const start = (width - (word.length * cardWidth + (word.length - 1) * 10)) / 2 + cardWidth / 2;
    for (let i = 0; i < word.length; i++) {
      const x = arc ? width / 2 + 400 * Math.cos(((i - (word.length - 1) / 2) * 8 - 90) * Math.PI / 180) : start + i * spacing;
      const pointY = arc ? y + 400 + 400 * Math.sin(((i - (word.length - 1) / 2) * 8 - 90) * Math.PI / 180) : y;
      const card = cards.find((candidate) => candidate.label === word[i] && !targets.some((target) => target.card === candidate));
      if (card) targets.push({ card, pos: { x, y: pointY }, rotation: arc ? (i - (word.length - 1) / 2) * 8 : 0 });
    }
  };
  addWord("THANKS", 150);
  addWord("FOR", 310);
  addWord("WATCHING!", 520, true);
  let startTime = 0;
  let nextDeal = 0;
  let dealt = 0;
  let frame = 0;
  const draw = (time: number) => {
    if (!startTime) startTime = time;
    const elapsed = time - startTime;
    if (elapsed > 1_000 && dealt < targets.length && time >= nextDeal) {
      const target = targets[dealt++];
      target.card.pos.setValue(target.pos);
      target.card.flip.setValue(1);
      target.card.rotation.setValue(target.rotation);
      nextDeal = time + 170;
    }
    context.clearRect(0, 0, width, height);
    context.strokeStyle = "#d4af37";
    context.lineWidth = 2;
    context.strokeRect(deck.x - cardWidth / 2, deck.y - cardHeight / 2, cardWidth, cardHeight);
    context.fillStyle = "#d4af37";
    context.font = "italic 20px Georgia";
    context.textAlign = "center";
    context.fillText("Deck", deck.x, deck.y + cardHeight / 2 + 28);
    for (const card of cards) {
      const pos = card.pos.value;
      const scaleX = Math.max(0.03, Math.abs(card.flip.value));
      context.save();
      context.translate(pos.x, pos.y);
      context.rotate(card.rotation.value * Math.PI / 180);
      context.scale(scaleX, 1);
      context.fillStyle = card.flip.value > 0 ? "#f5f0e6" : "#191414";
      context.strokeStyle = "#d4af37";
      context.lineWidth = 2;
      context.beginPath();
      context.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 8);
      context.fill();
      context.stroke();
      if (scaleX > 0.18 && card.flip.value > 0) {
        context.fillStyle = "#d4af37";
        context.font = "italic bold 42px Georgia";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(card.label, 0, 0);
      }
      context.restore();
    }
    frame = requestAnimationFrame(draw);
  };
  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    const scale = Math.min(1, root.clientWidth / width);
    canvas.width = width * scale * ratio;
    canvas.height = height * scale * ratio;
    canvas.style.aspectRatio = "3 / 2";
    context.setTransform(scale * ratio, 0, 0, scale * ratio, 0, 0);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(root);
  resize();
  frame = requestAnimationFrame(draw);
  return () => { cancelAnimationFrame(frame); observer.disconnect(); root.replaceChildren(); };
}
