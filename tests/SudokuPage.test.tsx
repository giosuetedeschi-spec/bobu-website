
import React from 'react';
import { render, screen } from '@testing-library/react';
import SudokuPage from '@/app/progetti/sudoku/page';

describe('SudokuPage', () => {
  it('renders the game title and description', () => {
    render(<SudokuPage />);
    expect(screen.getByText('Sudoku Solver')).toBeInTheDocument();
    expect(screen.getByText(/Python Sudoku solver/i)).toBeInTheDocument();
  });
});
