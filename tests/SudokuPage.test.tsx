
import React from 'react';
import { render, screen } from '@testing-library/react';
import SudokuPage from '@/app/progetti/sudoku/page';

describe('SudokuPage', () => {
  it('renders an editable puzzle and game actions', () => {
    render(<SudokuPage />);
    expect(screen.getByText('Sudoku')).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'Sudoku puzzle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New puzzle' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Visualizzatore del risolutore' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'Sudoku per il risolutore' })).toBeInTheDocument();
  });
});
