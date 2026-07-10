
import React from 'react';
import { render, screen } from '@testing-library/react';
import MazeSolverPage from '@/app/progetti/maze-solver/page';

describe('MazeSolverPage', () => {
  it('renders the page title and algorithm list', () => {
    render(<MazeSolverPage />);
    expect(screen.getByText('Maze Solver')).toBeInTheDocument();
    expect(screen.getByText('DFS')).toBeInTheDocument();
  });
});
