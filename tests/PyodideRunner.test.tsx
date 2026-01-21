
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PyodideRunner } from '@/components/games/PyodideRunner';

describe('PyodideRunner', () => {
  it('renders without crashing', () => {
    render(<PyodideRunner />);
  });
});
