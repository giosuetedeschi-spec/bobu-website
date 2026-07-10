
import React from 'react';
import { render, screen } from '@testing-library/react';
import BreakoutPage from '@/app/progetti/breakout/page';

describe('BreakoutPage', () => {
  it('renders the game title and placeholder state', () => {
    render(<BreakoutPage />);
    expect(screen.getByText('Breakout')).toBeInTheDocument();
    expect(screen.getByText('WASM Module Not Found')).toBeInTheDocument();
  });
});
