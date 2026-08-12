import React from 'react';
import { render, screen } from '@testing-library/react';
import MirrorDriftPage from '@/app/progetti/mirror-drift/page';

describe('MirrorDriftPage', () => {
  it('renders the game title', () => {
    render(<MirrorDriftPage />);
    expect(screen.getByText('Mirror Drift')).toBeInTheDocument();
  });
});
