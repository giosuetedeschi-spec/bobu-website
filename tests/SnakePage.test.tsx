
import React from 'react';
import { render, screen } from '@testing-library/react';
import SnakePage from '@/app/progetti/snake/page';

describe('SnakePage', () => {
  it('renders without crashing', () => {
    render(<SnakePage />);
  });
});
