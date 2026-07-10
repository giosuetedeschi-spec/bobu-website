
import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameIframePage } from '@/components/games/GameIframePage';

describe('GameIframePage', () => {
  it('renders the header and an iframe pointed at src', () => {
    render(<GameIframePage title="Test Game" tag="Test Tag" src="/games/test/index.html" />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('Test Tag')).toBeInTheDocument();
    expect(screen.getByTitle('Game')).toHaveAttribute('src', '/games/test/index.html');
  });
});
