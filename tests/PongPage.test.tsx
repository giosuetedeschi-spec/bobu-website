
import React from 'react';
import { render, screen } from '@testing-library/react';
import PongPage from '@/app/progetti/pong/page';

describe('PongPage', () => {
  it('renders without crashing', () => {
    render(<PongPage />);
  });
});
