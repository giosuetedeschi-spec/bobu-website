import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HomePage from '@/app/page';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

describe('HomePage on a phone-sized viewport', () => {
  afterEach(() => {
    window.localStorage.clear();
    // Restore the default (desktop) matchMedia for other suites.
    mockMatchMedia(false);
  });

  it('renders the MobileCard instead of the desktop OS when the query matches', async () => {
    mockMatchMedia(true);
    render(<HomePage />);

    // Card content appears after the post-mount effect switches modes.
    await waitFor(() => expect(screen.getByText('Developer & Creative Coder')).toBeInTheDocument());

    // Desktop-only affordances (draggable game-folder icon, start button) are gone.
    expect(screen.queryByTitle('Board Games')).not.toBeInTheDocument();

    // Quick links out to the real pages are present.
    expect(screen.getByText('Portfolio').closest('a')).toHaveAttribute('href', '/portfolio');
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/giosuetedeschi-spec',
    );
  });

  it('the flip interaction reveals the intro blurb', async () => {
    mockMatchMedia(true);
    render(<HomePage />);
    const flip = await screen.findByRole('button', { name: 'Show intro' });

    fireEvent.click(flip);
    expect(screen.getByRole('button', { name: 'Show profile' })).toBeInTheDocument();
    expect(screen.getByText(/creative technologist from Torino/)).toBeInTheDocument();
  });

  it('stays on the desktop OS when the force-desktop flag is set, even on a small screen', async () => {
    window.localStorage.setItem('bobuos-force-desktop', '1');
    mockMatchMedia(true);
    render(<HomePage />);

    // Desktop icons remain; the card never takes over.
    expect(screen.getByText('Board Games')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText('Developer & Creative Coder')).not.toBeInTheDocument(),
    );
  });
});
