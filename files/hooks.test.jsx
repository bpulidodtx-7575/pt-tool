import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCopy, useScrolled, useTheme, useKeyboardShortcuts } from "./hooks";

describe("useCopy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("writes text via the clipboard API and toggles `copied` for 2s", async () => {
    const writeText = vi.fn(async () => {});
    Object.assign(navigator, { clipboard: { writeText } });

    const { result } = renderHook(() => useCopy());
    expect(result.current[0]).toBe(false);

    await act(async () => {
      await result.current[1]("hello");
    });
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(result.current[0]).toBe(true);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current[0]).toBe(false);
  });

  it("falls back to execCommand when the clipboard API is unavailable", async () => {
    // Remove the async clipboard API so the textarea fallback path runs.
    Object.assign(navigator, { clipboard: undefined });
    const exec = vi.fn();
    document.execCommand = exec;

    const { result } = renderHook(() => useCopy());
    await act(async () => {
      await result.current[1]("fallback");
    });
    expect(exec).toHaveBeenCalledWith("copy");
    expect(result.current[0]).toBe(true);
  });

  it("does not throw and stays un-copied when the write rejects", async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(async () => {
          throw new Error("denied");
        }),
      },
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = renderHook(() => useCopy());
    await act(async () => {
      await result.current[1]("nope");
    });
    expect(result.current[0]).toBe(false);
    expect(console.warn).toHaveBeenCalled();
  });
});

describe("useScrolled", () => {
  afterEach(() => {
    window.scrollY = 0;
  });

  it("is false at the top and true once scrolled past the threshold", async () => {
    window.scrollY = 0;
    const { result } = renderHook(() => useScrolled(8));
    expect(result.current).toBe(false);

    act(() => {
      window.scrollY = 50;
      window.dispatchEvent(new Event("scroll"));
    });
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("respects a custom threshold", async () => {
    window.scrollY = 30;
    const { result } = renderHook(() => useScrolled(100));
    expect(result.current).toBe(false);

    act(() => {
      window.scrollY = 150;
      window.dispatchEvent(new Event("scroll"));
    });
    await waitFor(() => expect(result.current).toBe(true));
  });
});

describe("useTheme", () => {
  beforeEach(() => {
    sessionStorage.clear();
    delete document.documentElement.dataset.theme;
    // index.html isn't loaded in jsdom — provide the meta the hook updates.
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "");
  });

  const themeColor = () => document.querySelector('meta[name="theme-color"]').getAttribute("content");

  it("defaults to system and leaves the data-theme attribute unset", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("system");
    expect(document.documentElement.dataset.theme).toBeUndefined();
    // matchMedia is polyfilled to light, so system resolves to the light chrome.
    expect(themeColor()).toBe("#f9fafb");
  });

  it("cycles system -> light -> dark -> system and sets data-theme", () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current[1]());
    expect(result.current[0]).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(themeColor()).toBe("#f9fafb");

    act(() => result.current[1]());
    expect(result.current[0]).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(themeColor()).toBe("#0f0f0f");

    act(() => result.current[1]());
    expect(result.current[0]).toBe("system");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("persists the choice to sessionStorage", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current[1]()); // light
    expect(sessionStorage.getItem("pt-theme")).toBe("light");
  });

  it("restores a saved choice on init", () => {
    sessionStorage.setItem("pt-theme", "dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("ignores an invalid saved value and falls back to system", () => {
    sessionStorage.setItem("pt-theme", "neon");
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("system");
  });
});

describe("useKeyboardShortcuts", () => {
  const press = (key, opts = {}) =>
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...opts }));
    });

  function setup(enabled = true) {
    const handlers = { help: vi.fn(), escape: vi.fn(), copy: vi.fn(), clear: vi.fn(), toggleTab: vi.fn() };
    renderHook(() => useKeyboardShortcuts(handlers, enabled));
    return handlers;
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("fires the mapped handler for each key", () => {
    const h = setup();
    press("t");
    press("c");
    press("n");
    press("?");
    press("Escape");
    expect(h.toggleTab).toHaveBeenCalledOnce();
    expect(h.copy).toHaveBeenCalledOnce();
    expect(h.clear).toHaveBeenCalledOnce();
    expect(h.help).toHaveBeenCalledOnce();
    expect(h.escape).toHaveBeenCalledOnce();
  });

  it("does nothing when disabled", () => {
    const h = setup(false);
    press("t");
    press("?");
    press("Escape");
    expect(h.toggleTab).not.toHaveBeenCalled();
    expect(h.help).not.toHaveBeenCalled();
    expect(h.escape).not.toHaveBeenCalled();
  });

  it("does not fight native combos when a modifier is held", () => {
    const h = setup();
    press("c", { metaKey: true });
    press("t", { ctrlKey: true });
    press("n", { altKey: true });
    expect(h.copy).not.toHaveBeenCalled();
    expect(h.toggleTab).not.toHaveBeenCalled();
    expect(h.clear).not.toHaveBeenCalled();
  });

  it("skips letter actions while a real text input is focused", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
    input.focus();
    const h = setup();
    press("c");
    expect(h.copy).not.toHaveBeenCalled();
  });

  it("still fires letter actions while a number input is focused", () => {
    const input = document.createElement("input");
    input.type = "number";
    document.body.appendChild(input);
    input.focus();
    const h = setup();
    press("c");
    expect(h.copy).toHaveBeenCalledOnce();
  });
});
