import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCopy, useScrolled } from "./hooks";

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
