
import React from 'react';
import { render, screen } from '@testing-library/react';
import Flip7Page from '@/app/progetti/flip-7/page';

describe('Flip7Page', () => {
  it('renders the game title and rules', () => {
    render(<Flip7Page />);
    expect(screen.getByText('Flip 7')).toBeInTheDocument();
    expect(screen.getByText('How to Play')).toBeInTheDocument();
  });
});
