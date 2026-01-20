
import React from 'react';
import { render, screen } from '@testing-library/react';
import Layout from '@/app/layout';

describe('Layout', () => {
  it('renders without crashing', () => {
    render(<Layout><div>children</div></Layout>);
  });
});
