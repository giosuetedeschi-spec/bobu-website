import React from 'react';
import { render, screen } from '@testing-library/react';
import BreakoutPage from '@/app/progetti/breakout/page';

describe('BreakoutPage', () => {
  it('renders the playable game controls', () => {
    render(<BreakoutPage />);
    expect(screen.getByText('Breakout')).toBeInTheDocument();
    expect(screen.getByLabelText('Breakout game board')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move paddle left' })).toBeInTheDocument();
  });
});
