
import React from 'react';
import { render, screen } from '@testing-library/react';
import SnakePage from '@/app/progetti/snake/page';

describe('SnakePage', () => {
  it('renders the game title', () => {
    render(<SnakePage />);
    expect(screen.getByText('Snake')).toBeInTheDocument();
  });
});
