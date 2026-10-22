
import React from 'react';
import { render, screen } from '@testing-library/react';
import EcommercePage from '@/app/ecommerce/page';

describe('EcommercePage', () => {
  it('explains the shop is a non-purchasable concept preview', () => {
    render(<EcommercePage />);
    expect(screen.getByText('Shop concept')).toBeInTheDocument();
    expect(screen.getByText(/No items are currently for sale/)).toBeInTheDocument();
  });
});
