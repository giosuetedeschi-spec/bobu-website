
import React from 'react';
import { render, screen } from '@testing-library/react';
import AbalonePage from '@/app/progetti/abalone/page';

describe('AbalonePage', () => {
  it('renders the game title', () => {
    render(<AbalonePage />);
    expect(screen.getByText('Abalone')).toBeInTheDocument();
  });
});
