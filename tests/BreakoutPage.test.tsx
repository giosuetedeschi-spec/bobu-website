import React from 'react';
import { render, screen } from '@testing-library/react';
import BreakoutPage from '@/app/progetti/breakout/page';

describe('BreakoutPage', () => {
  it('embeds the game', () => {
    const { container } = render(<BreakoutPage />);
    expect(screen.getByText('Breakout')).toBeInTheDocument();
    const frame = container.querySelector('iframe');
    expect(frame).toBeInTheDocument();
    expect(frame).toHaveAttribute('src', expect.stringContaining('/games/breakout/index.html'));
  });
});
