
import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameIframe } from '@/components/games/GameIframe';

describe('GameIframe', () => {
  it('renders an iframe pointed at the given src', () => {
    render(<GameIframe src="/games/snake/index.html" />);
    expect(screen.getByTitle('Game')).toHaveAttribute('src', '/games/snake/index.html');
  });
});
