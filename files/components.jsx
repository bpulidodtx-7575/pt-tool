import { useEffect, useRef } from "react";
import { IcCopy, IcCheck, IcRefresh, IcAlert, IcShield, IcExternal, IcMonitor, IcSun, IcMoon, IcX } from "./icons";
import { useCopy, useTheme, useFocusTrap } from "./hooks";
import { CHOA_PDF } from "./calc";

// ─── Keyboard shortcuts help ──────────────────────────────────────────────────
const SHORTCUTS = [
  { keys: ["?"], label: "Show / hide this help" },
  { keys: ["t"], label: "Switch calculator (Plagiocephaly ⇄ Brachycephaly)" },
  { keys: ["c"], label: "Copy result note for EMR" },
  { keys: ["n"], label: "New patient (clear measurements)" },
  { keys: ["Esc"], label: "Close this dialog" },
];

export function ShortcutsHelp({ open, onClose }) {
  return open ? <ShortcutsDialog onClose={onClose} /> : null;
}

// Mounted only while open, so useFocusTrap activates on mount and restores focus
// to the trigger on unmount — covering both the Close button and the Escape path.
function ShortcutsDialog({ onClose }) {
  const modalRef = useRef(null);
  useFocusTrap(modalRef);
  return (
    <div
      className="disc-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kbd-h"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="disc-modal" ref={modalRef}>
        <div className="shortcuts-head">
          <h2 id="kbd-h">Keyboard shortcuts</h2>
        </div>
        <div className="disc-body">
          <dl className="shortcut-list">
            {SHORTCUTS.map((s) => (
              <div className="shortcut-row" key={s.label}>
                <dt>
                  {s.keys.map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                </dt>
                <dd>{s.label}</dd>
              </div>
            ))}
          </dl>
          <p className="shortcut-note">
            Action keys (<kbd>c</kbd> <kbd>n</kbd> <kbd>t</kbd>) work while a measurement field is focused. Within the
            calculator tabs, <kbd>←</kbd>/<kbd>→</kbd> also switch, and <kbd>Enter</kbd> advances to the next field.
          </p>
        </div>
        <div className="disc-foot">
          <button className="disc-cta" onClick={onClose} aria-label="Close keyboard shortcuts dialog">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI components ─────────────────────────────────────────────────────
const THEME_UI = {
  system: { Icon: IcMonitor, label: "System (following device)", next: "light" },
  light: { Icon: IcSun, label: "Light", next: "dark" },
  dark: { Icon: IcMoon, label: "Dark", next: "system" },
};

// Single header button that cycles System → Light → Dark. System stays the
// default so the OS preference is honored until a clinician overrides it.
export function ThemeToggle() {
  const [mode, cycle] = useTheme();
  const { Icon, label, next } = THEME_UI[mode];
  const desc = `Theme: ${label}. Activate to switch to ${THEME_UI[next].label.toLowerCase().replace(" (following device)", "")}.`;
  return (
    <button type="button" className="theme-toggle" onClick={cycle} aria-label={desc} title={desc}>
      <Icon size={16} />
    </button>
  );
}

export function Toast({ visible }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className={`toast${visible ? "" : " hidden"}`}>
      <IcCheck size={14} />
      <span>Copied to clipboard</span>
    </div>
  );
}

// Pure presentational PWA prompt. State is driven by useRegisterSW in the
// PwaReloadPrompt wrapper (which owns the build-only virtual module), keeping
// this fully unit-testable. needRefresh (an available update) takes priority
// over the one-time offline-ready confirmation.
export function ReloadPromptView({ offlineReady, needRefresh, onReload, onClose }) {
  if (!offlineReady && !needRefresh) return null;
  return (
    <div
      className="pwa-prompt"
      role={needRefresh ? "alert" : "status"}
      aria-live={needRefresh ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <span className="pwa-prompt-msg">{needRefresh ? "A new version is available." : "Ready to work offline."}</span>
      <div className="pwa-prompt-actions">
        {needRefresh && (
          <button type="button" className="pwa-prompt-reload" onClick={onReload}>
            <IcRefresh size={14} />
            Reload
          </button>
        )}
        <button type="button" className="pwa-prompt-close" onClick={onClose} aria-label="Dismiss">
          <IcX size={16} />
        </button>
      </div>
    </div>
  );
}

export function LegalDisclaimer({ onDismiss }) {
  /** @type {import("react").RefObject<HTMLDivElement>} */
  const modalRef = useRef(null);
  /** @type {import("react").RefObject<HTMLButtonElement>} */
  const ctaRef = useRef(null);
  // Trap focus within the mandatory gate; the CTA is the initial target. Don't
  // restore focus on unmount — the app moves focus to the first field on dismiss.
  useFocusTrap(modalRef, { initialFocusRef: ctaRef, restoreFocus: false });
  return (
    <div className="disc-overlay" role="dialog" aria-modal="true" aria-labelledby="disc-h" aria-describedby="disc-body">
      <div className="disc-modal" ref={modalRef}>
        <div className="disc-head">
          <span className="disc-head-icon" aria-hidden="true">
            <IcShield size={24} />
          </span>
          <div>
            <h1 id="disc-h">Reference Tool — Not a Diagnostic Device</h1>
            <div className="sub">Read before continuing</div>
          </div>
        </div>
        <div className="disc-body" id="disc-body">
          <p>
            This tool is based on the official <strong>CHOA Plagiocephaly Severity Scale</strong>. It is{" "}
            <strong style={{ color: "var(--sev-4)" }}>NOT a diagnostic device</strong> and must not replace clinical
            judgment.
          </p>
          <ul className="disc-list" role="list">
            <li>Use as a reference only — not for diagnosis or treatment decisions</li>
            <li>Consult the official CHOA scale and a licensed clinician for all clinical decisions</li>
            <li>No patient data is stored, transmitted, or retained — measurements are session-only</li>
            <li>Results are examples only, not a substitute for qualified clinical assessment</li>
          </ul>
        </div>
        <div className="disc-foot">
          <a
            href={CHOA_PDF}
            target="_blank"
            rel="noopener noreferrer"
            className="disc-pdf"
            aria-label="Official CHOA Plagiocephaly Severity Scale PDF (opens in new tab)"
          >
            <IcExternal size={13} />
            Official CHOA Plagiocephaly Severity Scale PDF
          </a>
          <button
            ref={ctaRef}
            className="disc-cta"
            onClick={onDismiss}
            aria-label="Acknowledge disclaimer and continue to the reference tool"
          >
            I understand — Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// Touch-friendly input: 52px min-height, 16px font-size, visible label
/**
 * @param {{ id: string, label: string, hint: string, rangeLabel: string, swatchVar: string,
 *   value: string, onChange: (v: string) => void, nextId?: string, status?: string | null }} props
 */
export function NumberInput({ id, label, hint, rangeLabel, swatchVar, value, onChange, nextId, status }) {
  /** @type {import("react").RefObject<HTMLInputElement>} */
  const inputRef = useRef(null);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && nextId) document.getElementById(nextId)?.focus();
  };
  const hasValue = value !== "" && value != null;
  const cls = ["", status && `is-${status}`, hasValue && "clearable"].filter(Boolean).join(" ");
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        <span>
          {swatchVar && <span className="swatch" style={{ background: swatchVar }} aria-hidden="true" />}
          {label}
        </span>
        {hint && <span className="hint">{hint}</span>}
      </label>
      <div className="input-wrap">
        <input
          ref={inputRef}
          id={id}
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="—"
          autoComplete="off"
          className={cls}
          aria-label={`${label} in millimeters`}
          aria-invalid={status === "error" ? "true" : undefined}
          aria-describedby={rangeLabel ? `${id}-range` : undefined}
        />
        {hasValue && (
          <button
            type="button"
            className="input-clear"
            aria-label={`Clear ${label}`}
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
          >
            <IcX size={14} />
          </button>
        )}
        <span className="unit" aria-hidden="true">
          mm
        </span>
      </div>
      {rangeLabel && (
        <span id={`${id}-range`} className="field-range">
          {rangeLabel}
        </span>
      )}
    </div>
  );
}

export function AlertBox({ children }) {
  return (
    <div className="alert" role="alert">
      <IcAlert size={16} />
      <span>{children}</span>
    </div>
  );
}

export function ResultCard({
  eyebrow,
  value,
  unit,
  rangeMain,
  rangeSub,
  sevLabel,
  sevVar,
  recommendation,
  presentation,
  copyText,
  onCopy,
  onClear,
}) {
  const [copied, copy] = useCopy();
  /** @type {import("react").RefObject<HTMLDivElement>} */
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      ref.current.style.opacity = "1";
      return;
    }
    ref.current.style.opacity = "0";
    requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.style.transition = "opacity 0.2s ease";
      ref.current.style.opacity = "1";
    });
  }, [value]);

  return (
    <div
      className="result"
      style={/** @type {import("react").CSSProperties} */ ({ "--sev-color": sevVar })}
      ref={ref}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="result-head">
        <div className="result-eyebrow-row">
          <span className="sev-dot" aria-hidden="true" />
          <span>{eyebrow}</span>
          <span style={{ color: "var(--border)" }} aria-hidden="true">
            ·
          </span>
          <span className="sev-label">{sevLabel}</span>
        </div>
        <div className="result-number">
          <span className="value">{value}</span>
          {unit && <span className="pct">{unit}</span>}
          <span className="range">
            <strong>{rangeMain}</strong>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{rangeSub}</span>
          </span>
        </div>
      </div>
      <div className="result-body">
        <div className="result-section">
          <h2>Recommendation</h2>
          <p>{recommendation}</p>
        </div>
        {presentation?.length > 0 && (
          <div className="result-section">
            <h2>Clinical presentation</h2>
            <ul>
              {presentation.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="result-actions">
        {/* Mobile: full-width stacked, tablet+: row */}
        <button className="btn btn-ghost" onClick={onClear} aria-label="Clear all measurements and start a new patient">
          <IcRefresh size={15} />
          New patient
        </button>
        <button
          className={`btn btn-primary${copied ? " copied" : ""}`}
          onClick={() => {
            copy(copyText);
            onCopy();
          }}
          aria-label={copied ? "Copied to clipboard" : "Copy structured note for EMR"}
        >
          {copied ? <IcCheck size={15} /> : <IcCopy size={15} />}
          {copied ? "Copied" : "Copy for EMR"}
        </button>
      </div>
    </div>
  );
}

/**
 * @param {{ visible: boolean, value: string, label: string, sevVar: string,
 *   copyText: string, onCopy: () => void }} props
 */
export function StickyResult({ visible, value, label, sevVar, copyText, onCopy }) {
  const [copied, copy] = useCopy();
  if (!visible) return null;
  return (
    // The numeric result is already announced by ResultCard's aria-live region,
    // so the duplicated label text is marked aria-hidden — but the container is
    // NOT hidden, keeping the Copy button reachable/announced for AT users.
    <div className={`sticky-result${visible ? " visible" : ""}`}>
      <div className="sticky-label" aria-hidden="true">
        <span className="dot" style={{ background: sevVar }} />
        <span>
          {value} · {label}
        </span>
      </div>
      <button
        className={`btn btn-primary${copied ? " copied" : ""}`}
        style={{ minHeight: 40, padding: "0 16px", borderRadius: "var(--r-pill)", fontSize: 13 }}
        onClick={() => {
          copy(copyText);
          onCopy();
        }}
        aria-label={copied ? "Copied to clipboard" : `Copy note for ${value} ${label} to clipboard`}
      >
        {copied ? <IcCheck size={13} /> : <IcCopy size={13} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
