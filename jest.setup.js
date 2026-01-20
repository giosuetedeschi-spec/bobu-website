// Optional: configure and extend the JSDOM environment.
// For example, you can extend the expect library with DOM matchers.
require('@testing-library/jest-dom');

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

// Explicitly mock globals.css
jest.mock('@/app/globals.css', () => ({}));