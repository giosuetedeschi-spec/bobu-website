
import React from 'react';
import { render, screen } from '@testing-library/react';
import { GamePageHeader } from '@/components/games/GamePageHeader';

describe('GamePageHeader', () => {
  it('renders the given title and tag', () => {
    render(<GamePageHeader title="Test Game" tag="Test Tag" />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('Test Tag')).toBeInTheDocument();
  });
});
