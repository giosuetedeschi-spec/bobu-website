
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PyodideRunner } from '@/components/games/PyodideRunner';

describe('PyodideRunner', () => {
  it('shows a loading state before Pyodide has loaded', () => {
    render(<PyodideRunner scriptPath="/games/kalaha/main.py" />);
    expect(screen.getByText(/Loading Python environment/i)).toBeInTheDocument();
  });
});
