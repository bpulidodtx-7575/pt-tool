import { useEffect, useRef } from "react";
import { IcCopy, IcCheck, IcRefresh, IcAlert, IcShield, IcExternal, IcMonitor, IcSun, IcMoon } from "./icons";
import { useCopy, useTheme } from "./hooks";
import { CHOA_PDF } from "./calc";

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

export function LegalDisclaimer({ onDismiss }) {
  const btnRef = useRef(null);
  useEffect(() => {
    btnRef.current?.focus();
  }, []);
  return (
    <div className="disc-overlay" role="dialog" aria-modal="true" aria-labelledby="disc-h" aria-describedby="disc-body">
      <div className="disc-modal">
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
            ref={btnRef}
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
export function NumberInput({ id, label, hint, rangeLabel, swatchVar, value, onChange, nextId }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && nextId) document.getElementById(nextId)?.focus();
  };
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
          aria-label={`${label} in millimeters`}
          aria-describedby={rangeLabel ? `${id}-range` : undefined}
        />
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
      style={{ "--sev-color": sevVar }}
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
