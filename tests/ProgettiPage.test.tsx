
import React from 'react';
import { render, screen } from '@testing-library/react';
import ProgettiPage from '@/app/progetti/page';

describe('ProgettiPage', () => {
  it('renders without crashing', () => {
    render(<ProgettiPage />);
  });
});
