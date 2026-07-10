
import React from 'react';
import { render, screen } from '@testing-library/react';
import MastermindPage from '@/app/progetti/mastermind/page';

describe('MastermindPage', () => {
  it('renders the game title', () => {
    render(<MastermindPage />);
    expect(screen.getByText('Mastermind')).toBeInTheDocument();
  });
});
