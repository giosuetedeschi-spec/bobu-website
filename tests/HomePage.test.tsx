
import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

describe('HomePage', () => {
  it('renders the BobuOS desktop with app icons', () => {
    render(<HomePage />);
    expect(screen.getByText('Terminal')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
  });
});
