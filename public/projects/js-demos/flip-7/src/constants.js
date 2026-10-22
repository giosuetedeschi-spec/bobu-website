export const WIN_SCORE = 200;
export const FLIP_SEVEN_BONUS = 15;
export const CARDS = {
  NUMBERS: Array.from({ length: 13 }, (_, value) => ({ val: value, count: value || 1 })),
  ACTIONS: [
    { display: "Freeze", action: "FREEZE", count: 3 },
    { display: "Flip Three", action: "FLIP3", count: 3 },
    { display: "Second Chance", action: "SECOND_CHANCE", count: 3 }
  ],
  MODIFIERS: [2, 4, 6, 8, 10].map((value) => ({ value, display: `+${value}` })),
  DOUBLERS: 1
};
