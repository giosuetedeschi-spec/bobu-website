import React from 'react';
import { render, screen } from '@testing-library/react';
import TwinsPage from '@/app/progetti/twins/page';

describe('TwinsPage', () => {
  it('renders the game title', () => {
    render(<TwinsPage />);
    expect(screen.getByText('Twins')).toBeInTheDocument();
  });
});
