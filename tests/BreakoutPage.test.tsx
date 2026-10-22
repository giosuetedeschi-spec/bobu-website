import React from 'react';
import { render, screen } from '@testing-library/react';
import BreakoutPage from '@/app/progetti/breakout/page';

describe('BreakoutPage', () => {
<<<<<<< HEAD
  it('embeds the game', () => {
    const { container } = render(<BreakoutPage />);
    expect(screen.getByText('Breakout')).toBeInTheDocument();
    const frame = container.querySelector('iframe');
    expect(frame).toBeInTheDocument();
    expect(frame).toHaveAttribute('src', expect.stringContaining('/games/breakout/index.html'));
=======
  it('renders the playable game controls', () => {
    render(<BreakoutPage />);
    expect(screen.getByText('Breakout')).toBeInTheDocument();
    expect(screen.getByLabelText('Breakout game board')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move paddle left' })).toBeInTheDocument();
>>>>>>> 54630ec (fix: complete browser game implementations and ports)
  });
});
