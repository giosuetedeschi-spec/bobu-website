
import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameIframe } from '@/components/games/GameIframe';

describe('GameIframe', () => {
  it('renders without crashing', () => {
    render(<GameIframe src="test" />);
  });
});
