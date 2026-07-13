
import React from 'react';
import { render, screen } from '@testing-library/react';
import CollectionPage from '@/app/ecommerce/collection/page';

describe('EcommerceCollectionPage', () => {
  it('renders the product grid with prices and stock status', () => {
    render(<CollectionPage />);
    expect(screen.getByText('Collection')).toBeInTheDocument();
    expect(screen.getByText('Bobu Terminal Tee')).toBeInTheDocument();
    expect(screen.getByText('€28')).toBeInTheDocument();
    expect(screen.getByText('Sold Out')).toBeInTheDocument();
  });

  it('links back to the shop', () => {
    render(<CollectionPage />);
    expect(screen.getByRole('link', { name: 'Back to Shop' })).toHaveAttribute('href', '/ecommerce');
  });
});
