
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Navbar } from '@/components/layout/Navbar';

describe('Navbar', () => {
  it('renders without crashing', () => {
    render(<Navbar />);
  });
});
