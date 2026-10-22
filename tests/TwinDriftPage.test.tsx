
import React from 'react';
import { render, screen } from '@testing-library/react';
import TwinDriftPage from '@/app/progetti/twin-drift/page';

describe('TwinDriftPage', () => {
  it('renders the game title', () => {
    render(<TwinDriftPage />);
    expect(screen.getByText('Twin Drift')).toBeInTheDocument();
    expect(screen.getByLabelText('Twin Drift race track')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accelerate' })).toBeInTheDocument();
  });
});
