import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// React Testing Library does not auto-clean when Vitest globals are disabled.
afterEach(() => {
  cleanup();
});

// jsdom ships neither ResizeObserver nor matchMedia. Radix primitives (Slider,
// Progress, Select, …) and the theme provider read both during layout effects,
// and without them the component tree throws and the router's error boundary
// renders an empty document — which surfaces as "unable to find" queries rather
// than as the real error. Provide inert stand-ins so the components mount.
if (!("ResizeObserver" in globalThis)) {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  Object.defineProperty(globalThis, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: ResizeObserverStub,
  });
}

if (!("matchMedia" in globalThis)) {
  Object.defineProperty(globalThis, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
