
import React from 'react';
import { render, screen } from '@testing-library/react';
import KalahaPage from '@/app/progetti/kalaha/page';

describe('KalahaPage', () => {
  it('renders without crashing', () => {
    render(<KalahaPage />);
  });
});
