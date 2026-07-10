
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PyodideGamePage } from '@/components/games/PyodideGamePage';

describe('PyodideGamePage', () => {
  it('renders the header, description, and Pyodide runner', () => {
    render(
      <PyodideGamePage
        title="Test Game"
        tag="Test Tag"
        scriptPath="/games/test/main.py"
        description="Test description"
      />
    );
    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('Test Tag')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText(/Loading Python environment/i)).toBeInTheDocument();
  });
});
