
import React from 'react';
import { render, screen } from '@testing-library/react';
import CvPage from '@/app/cv/page';

describe('CvPage', () => {
  it('renders the resume heading', () => {
    render(<CvPage />);
    expect(screen.getByText('Developer & Creative Technologist')).toBeInTheDocument();
  });
});
