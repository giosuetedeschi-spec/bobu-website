
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/Footer';

describe('Footer', () => {
  it('renders the copyright notice and social links', () => {
    render(<Footer />);
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/giosuetedeschi-spec'
    );
  });
});
