// Optional: configure and extend the JSDOM environment.
// For example, you can extend the expect library with DOM matchers.
require('@testing-library/jest-dom');

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// jsdom has no window.matchMedia. Default to matches:false so the desktop OS
// (not the mobile card) renders in existing tests. Individual tests can override
// window.matchMedia to simulate a phone viewport.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'), // Default path for tests
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  })),
}));

// Mock next/font/google
jest.mock('next/font/google', () => ({
  Inter: () => ({ className: '', variable: '--font-inter' }),
  Outfit: () => ({ className: '', variable: '--font-outfit' }),
}));