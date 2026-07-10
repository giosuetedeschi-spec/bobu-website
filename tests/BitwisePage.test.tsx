
import React from 'react';
import { render, screen } from '@testing-library/react';
import BitwisePage from '@/app/progetti/bitwise/page';

describe('BitwisePage', () => {
  it('renders the game title', () => {
    render(<BitwisePage />);
    expect(screen.getByText('Bitwise Visualizer')).toBeInTheDocument();
  });
});
