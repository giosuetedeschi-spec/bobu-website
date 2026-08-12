import React from 'react';
import { render, screen } from '@testing-library/react';
import { PyodideRunner } from '@/components/games/PyodideRunner';

describe('PyodideRunner', () => {
  it('shows a loading state before Pyodide has loaded', () => {
    const { container } = render(<PyodideRunner scriptPath="/games/kalaha/main.py" />);
    expect(screen.getByText(/loading pyodide runtime/i)).toBeInTheDocument();
    expect(container.querySelector('[data-status="loading"]')).toBeInTheDocument();
  });

  it('labels the console with the game title', () => {
    render(<PyodideRunner scriptPath="/games/kalaha/main.py" title="Kalaha" />);
    expect(screen.getByText(/kalaha — python 3.11 \(pyodide\)/i)).toBeInTheDocument();
  });
});
