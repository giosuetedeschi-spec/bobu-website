
import React from 'react';
import { render, screen } from '@testing-library/react';
import Layout from '@/app/layout';

describe('Layout', () => {
  it('renders its children', () => {
    render(<Layout><div>children</div></Layout>);
    expect(screen.getByText('children')).toBeInTheDocument();
  });
});
