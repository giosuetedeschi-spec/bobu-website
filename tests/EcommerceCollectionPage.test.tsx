
import React from 'react';
import { render, screen } from '@testing-library/react';
import CollectionPage from '@/app/ecommerce/collection/page';

describe('EcommerceCollectionPage', () => {
  it('renders concept products without claiming real prices or stock', () => {
    render(<CollectionPage />);
    expect(screen.getByText('Concept collection')).toBeInTheDocument();
    expect(screen.getByText('Bobu Terminal Tee')).toBeInTheDocument();
    expect(screen.getAllByText('Concept only')).toHaveLength(6);
    expect(screen.getAllByText('Not for sale')).toHaveLength(6);
  });

  it('links back to the shop', () => {
    render(<CollectionPage />);
    expect(screen.getByRole('link', { name: 'Back to Shop' })).toHaveAttribute('href', '/ecommerce');
  });
});
