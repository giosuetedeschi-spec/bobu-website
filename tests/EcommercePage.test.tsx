
import React from 'react';
import { render, screen } from '@testing-library/react';
import EcommercePage from '@/app/ecommerce/page';

describe('EcommercePage', () => {
  it('renders without crashing', () => {
    render(<EcommercePage />);
  });
});
