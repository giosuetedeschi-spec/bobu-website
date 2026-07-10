
import React from 'react';
import { render, screen } from '@testing-library/react';
import CollectionPage from '@/app/ecommerce/collection/page';

describe('EcommerceCollectionPage', () => {
  it('renders the coming-soon heading and a link home', () => {
    render(<CollectionPage />);
    expect(screen.getByText('Collection')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back Home' })).toHaveAttribute('href', '/');
  });
});
