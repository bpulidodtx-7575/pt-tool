import "@testing-library/jest-dom/vitest";
import { afterEach, expect } from "vitest";
import { cleanup } from "@testing-library/react";
import { toHaveNoViolations } from "vitest-axe/matchers";

// Accessibility matcher: expect(await axe(container)).toHaveNoViolations()
expect.extend({ toHaveNoViolations });

// jsdom doesn't implement matchMedia — ResultCard reads it for reduced-motion.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

afterEach(() => cleanup());
