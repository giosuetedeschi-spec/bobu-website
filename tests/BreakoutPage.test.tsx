
import React from 'react';
import { render, screen } from '@testing-library/react';
import BreakoutPage from '@/app/progetti/breakout/page';

describe('BreakoutPage', () => {
  it('renders without crashing', () => {
    render(<BreakoutPage />);
  });
});
