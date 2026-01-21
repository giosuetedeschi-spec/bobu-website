
import React from 'react';
import { render, screen } from '@testing-library/react';
import BitwisePage from '@/app/progetti/bitwise/page';

describe('BitwisePage', () => {
  it('renders without crashing', () => {
    render(<BitwisePage />);
  });
});
