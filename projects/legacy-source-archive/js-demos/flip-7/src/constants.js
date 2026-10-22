// --- Game Constants ---
export const WIN_SCORE = 200;

export const CARDS = {
    NUMBERS: [
        { val: 12, count: 1 }, { val: 11, count: 2 }, { val: 10, count: 3 },
        { val: 9, count: 4 }, { val: 8, count: 5 }, { val: 7, count: 6 },
        { val: 6, count: 7 }, { val: 5, count: 8 }, { val: 4, count: 9 },
        { val: 3, count: 10 }, { val: 2, count: 11 }, { val: 1, count: 12 }
    ],
    SPECIALS: [
        { type: '0', count: 4, val: 0 },
        { type: 'Freeze', count: 3, action: 'FREEZE' },
        { type: 'Double', count: 2, action: 'DOUBLE' },
        { type: 'Plus3', count: 4, action: 'PLUS3' },
        { type: 'Flip3', count: 3, action: 'FLIP3' }
    ]
};
