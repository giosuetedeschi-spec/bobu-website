
import React from 'react';
import { render, screen } from '@testing-library/react';
import EcommercePage from '@/app/ecommerce/page';

describe('EcommercePage', () => {
  it('renders the work-in-progress heading', () => {
    render(<EcommercePage />);
    expect(screen.getByText('Work in Progress')).toBeInTheDocument();
  });
});
