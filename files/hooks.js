import { useState, useEffect, useRef, useCallback } from "react";

// ─── Hooks ────────────────────────────────────────────────────────────────────
/**
 * Clipboard write with a 2s "copied" flag.
 * The tuple return type is explicit: without it the array widens to
 * `(boolean | fn)[]` and every `copy(...)` call site fails to typecheck.
 * @returns {[boolean, (text: string) => Promise<void>]}
 */
export function useCopy() {
  const [copied, setCopied] = useState(false);
  /** @type {import("react").MutableRefObject<ReturnType<typeof setTimeout> | undefined>} */
  const t = useRef(undefined);
  const copy = useCallback(async (text) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const el = Object.assign(document.createElement("textarea"), {
          value: text,
          style: "position:fixed;top:-9999px;opacity:0",
        });
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      clearTimeout(t.current);
      t.current = setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Clipboard write failed", e);
    }
  }, []);
  useEffect(() => () => clearTimeout(t.current), []);
  return [copied, copy];
}

export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);
  return scrolled;
}

// Theme preference: "system" (default, follows OS), "light", or "dark".
// Kept in sessionStorage so it survives refresh but clears with the tab —
// consistent with the app's session-only, no-persistence privacy stance.
/** @typedef {"system" | "light" | "dark"} ThemeMode */
/** @type {ThemeMode[]} */
const THEME_MODES = ["system", "light", "dark"];
const THEME_KEY = "pt-theme";
// Match the --bg token for light/dark so mobile browser chrome blends in.
/** @type {Record<"light" | "dark", string>} */
const THEME_COLOR = { light: "#f9fafb", dark: "#0f0f0f" };

/**
 * Session-scoped theme preference.
 * @returns {[ThemeMode, () => void]}
 */
export function useTheme() {
  const [mode, setMode] = useState(
    /** @returns {ThemeMode} */ () => {
      try {
        const saved = sessionStorage.getItem(THEME_KEY);
        // The cast is the narrowing `Array.includes` can't express: `saved` is a
        // ThemeMode exactly when it is a member of THEME_MODES.
        if (saved !== null && THEME_MODES.includes(/** @type {ThemeMode} */ (saved))) {
          return /** @type {ThemeMode} */ (saved);
        }
      } catch (e) {
        void e; // sessionStorage can throw in locked-down contexts — ignore.
      }
      return "system";
    },
  );

  useEffect(() => {
    const root = document.documentElement;
    // System mode leaves the attribute unset so the CSS media query drives it.
    if (mode === "system") delete root.dataset.theme;
    else root.dataset.theme = mode;

    // Resolve the effective theme to set a matching browser-chrome color.
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const effective = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[effective]);

    try {
      sessionStorage.setItem(THEME_KEY, mode);
    } catch (e) {
      void e;
    }
  }, [mode]);

  const cycle = useCallback(() => {
    setMode((m) => THEME_MODES[(THEME_MODES.indexOf(m) + 1) % THEME_MODES.length]);
  }, []);

  return [mode, cycle];
}

// Trap keyboard focus inside a modal container (role="dialog" aria-modal). Tab /
// Shift+Tab wrap within the dialog's focusable elements so focus can't escape to
// the page rendered behind the overlay. On mount, focus moves to `initialFocusRef`
// (or the first focusable); on unmount, focus optionally returns to whatever was
// focused when the dialog opened. The hook must be mounted only while the dialog
// is open (mount == active) so it can't run against a missing container.
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * @param {import("react").RefObject<HTMLElement>} containerRef
 * @param {{ initialFocusRef?: import("react").RefObject<HTMLElement>, restoreFocus?: boolean }} [options]
 */
export function useFocusTrap(containerRef, { initialFocusRef, restoreFocus = true } = {}) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const previouslyFocused = /** @type {HTMLElement | null} */ (document.activeElement);
    const focusables = () => /** @type {HTMLElement[]} */ (Array.from(container.querySelectorAll(FOCUSABLE)));

    (initialFocusRef?.current || focusables()[0] || container).focus();

    const onKeyDown = (e) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      if (restoreFocus && previouslyFocused?.focus) previouslyFocused.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// Is the element a text-entry target where typing letters is meaningful?
// Number inputs are excluded — "c"/"n"/"t" aren't valid there, so global
// letter shortcuts can safely fire even while one is focused.
function isTextEntry(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (el.getAttribute("type") || "text").toLowerCase();
    return !["number", "range", "checkbox", "radio", "button", "submit", "reset"].includes(type);
  }
  return false;
}

// Global bedside shortcuts. `handlers` is read through a ref so the listener
// stays stable across re-renders; only `enabled` re-binds it.
export function useKeyboardShortcuts(handlers, enabled = true) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e) => {
      // Never fight native browser/OS combos (Cmd/Ctrl+C, Ctrl+T, …).
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const h = ref.current;
      if (e.key === "Escape") {
        h.escape?.();
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        h.help?.();
        return;
      }
      // Letter actions: leave real text fields alone.
      if (isTextEntry(document.activeElement)) return;
      const action = { c: h.copy, n: h.clear, t: h.toggleTab }[e.key.toLowerCase()];
      if (action) {
        e.preventDefault();
        action();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
