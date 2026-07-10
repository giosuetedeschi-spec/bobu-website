
import React from 'react';
import { render, screen } from '@testing-library/react';
import KalahaPage from '@/app/progetti/kalaha/page';

describe('KalahaPage', () => {
  it('renders the game title and description', () => {
    render(<KalahaPage />);
    expect(screen.getByText('Kalaha')).toBeInTheDocument();
    expect(screen.getByText(/Python implementation of Kalaha/i)).toBeInTheDocument();
  });
});
