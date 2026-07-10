
import React from 'react';
import { render, screen } from '@testing-library/react';
import TwinDriftPage from '@/app/progetti/twin-drift/page';

describe('TwinDriftPage', () => {
  it('renders the game title', () => {
    render(<TwinDriftPage />);
    expect(screen.getByText('Twin Drift')).toBeInTheDocument();
  });
});
