import "@testing-library/jest-dom/vitest";
import { afterEach, expect } from "vitest";
import { cleanup } from "@testing-library/react";
import { toHaveNoViolations } from "vitest-axe/matchers";

// Accessibility matcher: expect(await axe(container)).toHaveNoViolations()
// vitest-axe@0.1.0 declares this export as a type in its .d.ts even though it is
// a real runtime value, so the checker cannot see it. Remove once that is fixed.
// @ts-expect-error -- see above
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
