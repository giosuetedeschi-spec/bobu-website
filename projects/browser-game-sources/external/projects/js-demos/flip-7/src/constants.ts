export const WIN_SCORE = 200;
export const FLIP_SEVEN_BONUS = 15;

export type NumberCard = { type: "number"; value: number; display: string };
export type ActionName = "FREEZE" | "FLIP3" | "SECOND_CHANCE";
export type ActionCard = {
  type: "action";
  value: 0;
  display: "Freeze" | "Flip Three" | "Second Chance";
  action: ActionName;
};
export type ModifierCard = {
  type: "modifier";
  value: number;
  display: string;
  modifier: "POINTS" | "DOUBLE";
};
export type Card = NumberCard | ActionCard | ModifierCard;

export const CARDS = {
  NUMBERS: Array.from({ length: 13 }, (_, value) => ({ val: value, count: value || 1 })),
  ACTIONS: [
    { display: "Freeze" as const, action: "FREEZE" as const, count: 3 },
    { display: "Flip Three" as const, action: "FLIP3" as const, count: 3 },
    { display: "Second Chance" as const, action: "SECOND_CHANCE" as const, count: 3 },
  ],
  MODIFIERS: [2, 4, 6, 8, 10].map((value) => ({ value, display: `+${value}` })),
  DOUBLERS: 1,
};
