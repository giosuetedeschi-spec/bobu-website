import "@testing-library/jest-dom";

Element.prototype.scrollIntoView = jest.fn();

if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
  useServerInsertedHTML: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  })),
}));

jest.mock("next/font/google", () => ({
  Inter: () => ({ className: "", variable: "--font-inter" }),
  Outfit: () => ({ className: "", variable: "--font-outfit" }),
}));
