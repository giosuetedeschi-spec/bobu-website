
import React from 'react';
import { render, screen } from '@testing-library/react';
import PongPage from '@/app/progetti/pong/page';

describe('PongPage', () => {
  it('renders the game title', () => {
    render(<PongPage />);
    expect(screen.getByText('Pong')).toBeInTheDocument();
  });
});
