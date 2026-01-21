
import React from 'react';
import { render, screen } from '@testing-library/react';
import CvPage from '@/app/cv/page';

describe('CvPage', () => {
  it('renders without crashing', () => {
    render(<CvPage />);
  });
});
