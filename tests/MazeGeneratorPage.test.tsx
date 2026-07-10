
import React from 'react';
import { render, screen } from '@testing-library/react';
import MazeGeneratorPage from '@/app/progetti/maze-generator/page';

describe('MazeGeneratorPage', () => {
  it('renders the page title and algorithm list', () => {
    render(<MazeGeneratorPage />);
    expect(screen.getByText('Maze Generator')).toBeInTheDocument();
    expect(screen.getByText('Recursive Backtracker')).toBeInTheDocument();
  });
});
