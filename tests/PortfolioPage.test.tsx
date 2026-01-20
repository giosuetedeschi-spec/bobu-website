
import React from 'react';
import { render, screen } from '@testing-library/react';
import PortfolioPage from '@/app/portfolio/page';

describe('PortfolioPage', () => {
  it('renders without crashing', () => {
    render(<PortfolioPage />);
  });
});
