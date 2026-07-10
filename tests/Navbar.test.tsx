
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Navbar } from '@/components/layout/Navbar';

describe('Navbar', () => {
  it('renders the brand and nav links', () => {
    render(<Navbar />);
    expect(screen.getByText('BOBU')).toBeInTheDocument();
    expect(screen.getAllByText('Portfolio').length).toBeGreaterThan(0);
  });
});
