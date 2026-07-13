
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from '@/app/page';

function openTerminal() {
  fireEvent.doubleClick(screen.getByTitle('Terminal'));
  return screen.getByRole('textbox') as HTMLInputElement;
}

function runCommand(input: HTMLInputElement, cmd: string) {
  fireEvent.change(input, { target: { value: cmd } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

describe('HomePage desktop', () => {
  it('renders app icons and game folder icons', () => {
    render(<HomePage />);
    expect(screen.getByText('Terminal')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('CV')).toBeInTheDocument();
    expect(screen.getByText('About Bobu')).toBeInTheDocument();
    expect(screen.getByText('Board Games')).toBeInTheDocument();
  });

  it('opens the About window with profile links', () => {
    render(<HomePage />);
    fireEvent.doubleClick(screen.getByTitle('About Bobu'));
    expect(screen.getByText('Developer & Creative Coder')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toHaveAttribute('href', 'https://github.com/giosuetedeschi-spec');
  });

  it('opens the CV window with resume content', () => {
    render(<HomePage />);
    fireEvent.doubleClick(screen.getByTitle('CV'));
    expect(screen.getByText('Full Stack Engineer & Creative Technologist')).toBeInTheDocument();
  });

  it('opens a game window from the desktop folder drill-down, then can navigate back', () => {
    render(<HomePage />);
    fireEvent.doubleClick(screen.getByTitle('Board Games'));
    expect(screen.getByText('Abalone')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Abalone'));
    expect(screen.getByTitle('Abalone')).toBeInTheDocument(); // game iframe

    fireEvent.click(screen.getByText('← Back'));
    expect(screen.getAllByText('Terminal').length).toBeGreaterThan(1); // root explorer view + desktop icon
  });
});

describe('HomePage window controls', () => {
  it('minimizes and restores a window via the taskbar', () => {
    render(<HomePage />);
    openTerminal();
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Minimize'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    const taskbarEntries = screen.getAllByText('Terminal');
    fireEvent.click(taskbarEntries[taskbarEntries.length - 1]);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('closes a window', () => {
    render(<HomePage />);
    openTerminal();
    fireEvent.click(screen.getByTitle('Close'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('maximizes a window, expanding it to fill the screen', () => {
    render(<HomePage />);
    openTerminal();
    const maximizeBtn = screen.getByTitle('Maximize');
    const windowRoot = maximizeBtn.parentElement!.parentElement!.parentElement as HTMLElement;

    expect(windowRoot.style.left).toBe('80px');
    fireEvent.click(maximizeBtn);
    expect(windowRoot.style.left).toBe('0px');
    expect(windowRoot.style.width).toBe('100%');
  });

  it('reuses an existing game window instead of opening a duplicate', () => {
    render(<HomePage />);
    fireEvent.doubleClick(screen.getByTitle('Board Games'));
    fireEvent.click(screen.getByText('Abalone'));
    expect(screen.getAllByTitle('Abalone').length).toBe(1);

    fireEvent.doubleClick(screen.getByTitle('Board Games'));
    fireEvent.click(screen.getAllByText('Abalone').slice(-1)[0]);
    expect(screen.getAllByTitle('Abalone').length).toBe(1);
  });
});

describe('HomePage start menu', () => {
  it('opens via the Start button and filters games by search', () => {
    render(<HomePage />);
    fireEvent.click(screen.getByText('B'));
    expect(screen.getByPlaceholderText('Search apps...')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search apps...'), { target: { value: 'snake' } });
    expect(screen.getByText('Snake')).toBeInTheDocument();
    expect(screen.queryByText('Azul')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Snake'));
    expect(screen.getByTitle('Snake')).toBeInTheDocument(); // game iframe
    expect(screen.queryByPlaceholderText('Search apps...')).not.toBeInTheDocument(); // menu closed
  });
});

describe('Terminal', () => {
  it('shows help output', () => {
    render(<HomePage />);
    const input = openTerminal();
    runCommand(input, 'help');
    expect(screen.getByText('Available commands:')).toBeInTheDocument();
  });

  it('lists files at root and inside games', () => {
    render(<HomePage />);
    const input = openTerminal();
    runCommand(input, 'ls');
    expect(screen.getByText('games/ documents/ terminal/ about/')).toBeInTheDocument();

    runCommand(input, 'cd games');
    runCommand(input, 'ls');
    expect(screen.getByText(/abalone\//)).toBeInTheDocument();
  });

  it('updates pwd live as cd changes directory (regression: prompt used to be stale)', () => {
    render(<HomePage />);
    const input = openTerminal();
    runCommand(input, 'pwd');
    expect(screen.getByText('/home/bobu')).toBeInTheDocument();

    runCommand(input, 'cd games');
    expect(screen.getByText('bobu@bobuos:/home/bobu/games$', { exact: false })).toBeInTheDocument();

    runCommand(input, 'cd ..');
    runCommand(input, 'pwd');
    expect(screen.getAllByText('/home/bobu').length).toBe(2);
  });

  it('runs whoami, echo and reports unknown commands', () => {
    render(<HomePage />);
    const input = openTerminal();
    runCommand(input, 'whoami');
    expect(screen.getByText('bobu')).toBeInTheDocument();

    runCommand(input, 'echo hello world');
    expect(screen.getByText('hello world')).toBeInTheDocument();

    runCommand(input, 'bogus');
    expect(screen.getByText('bobu-sh: bogus: command not found')).toBeInTheDocument();
  });

  it('lists installed games', () => {
    render(<HomePage />);
    const input = openTerminal();
    runCommand(input, 'games');
    expect(screen.getByText('Installed games:')).toBeInTheDocument();
    expect(screen.getByText(/Abalone \[Board\]/)).toBeInTheDocument();
  });

  it('prints system info via neofetch', () => {
    render(<HomePage />);
    const input = openTerminal();
    runCommand(input, 'neofetch');
    expect(screen.getByText(/Kernel:\s*Next\.js 16/)).toBeInTheDocument();
  });

  it('clears the terminal', () => {
    render(<HomePage />);
    const input = openTerminal();
    runCommand(input, 'whoami');
    expect(screen.getByText('bobu')).toBeInTheDocument();
    runCommand(input, 'clear');
    expect(screen.queryByText('bobu')).not.toBeInTheDocument();
  });

  it('opens an app via the open command', async () => {
    render(<HomePage />);
    const input = openTerminal();
    runCommand(input, 'open abalone');
    await waitFor(() => expect(screen.getByTitle('Abalone')).toBeInTheDocument());
  });

  it('shows usage when open is called without an argument', () => {
    render(<HomePage />);
    const input = openTerminal();
    runCommand(input, 'open');
    expect(screen.getByText('Usage: open <app>')).toBeInTheDocument();
  });

  it('navigates command history with arrow keys', () => {
    render(<HomePage />);
    const input = openTerminal();
    runCommand(input, 'help');
    runCommand(input, 'whoami');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('whoami');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('help');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe('whoami');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe('');
  });

  it('clears via Ctrl+L', () => {
    render(<HomePage />);
    const input = openTerminal();
    runCommand(input, 'whoami');
    fireEvent.keyDown(input, { key: 'l', ctrlKey: true });
    expect(screen.queryByText('bobu')).not.toBeInTheDocument();
  });
});
