import { useState, useEffect, useRef, useCallback } from "react";

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useCopy() {
  const [copied, setCopied] = useState(false);
  const t = useRef(null);
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
