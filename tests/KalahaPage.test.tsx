
import React from 'react';
import { render, screen } from '@testing-library/react';
import KalahaPage from '@/app/progetti/kalaha/page';

describe('KalahaPage', () => {
  it('renders the playable board and computer opponent status', () => {
    render(<KalahaPage />);
    expect(screen.getByText('Kalaha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Your pit 1, 4 stones' })).toBeInTheDocument();
    expect(screen.getByText(/Choose a pit on your side/)).toBeInTheDocument();
  });
});
