
import React from 'react';
import { render, screen } from '@testing-library/react';
import AzulPage from '@/app/progetti/azul/page';

describe('AzulPage', () => {
  it('renders the game title', () => {
    render(<AzulPage />);
    expect(screen.getByText('Azul')).toBeInTheDocument();
  });
});
