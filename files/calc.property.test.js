// Property-based tests (fast-check). These complement the example-based cases in
// calc.test.js by asserting *invariants* of the clinical math across hundreds of
// randomized inputs. Generators are constrained to clinically plausible caliper
// values (mm) so we exercise the real domain rather than sub-0.1mm rounding noise;
// degenerate inputs (0, negative, non-finite, "") are checked as explicit cases.
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  validateMeasurement,
  toTenths,
  processCvai,
  processCr,
  buildCvaiNote,
  buildCrNote,
  SEVERITY,
  RANGES,
} from "./calc";

// Plausible mm measurement: 1–400 mm, finite, never NaN.
const mm = () => fc.double({ min: 1, max: 400, noNaN: true });

describe("processCvai — properties", () => {
  it("returns a valid severity index and a CVAI in [0, 100) for any positive diagonals", () => {
    fc.assert(
      fc.property(mm(), mm(), (a, b) => {
        const r = processCvai(a, b);
        expect(r).not.toBeNull();
        expect(Number.isInteger(r.sevIdx)).toBe(true);
        expect(r.sevIdx).toBeGreaterThanOrEqual(0);
        expect(r.sevIdx).toBeLessThanOrEqual(4);
        expect(r.displayCvai).toBeGreaterThanOrEqual(0);
        expect(r.displayCvai).toBeLessThan(100);
      }),
    );
  });

  it("is symmetric in its two diagonals (A,B) === (B,A)", () => {
    fc.assert(
      fc.property(mm(), mm(), (a, b) => {
        const r1 = processCvai(a, b);
        const r2 = processCvai(b, a);
        expect(r2.sevIdx).toBe(r1.sevIdx);
        expect(r2.displayCvai).toBe(r1.displayCvai);
      }),
    );
  });

  it("scores equal diagonals as perfectly symmetric (sevIdx 0)", () => {
    fc.assert(
      fc.property(mm(), (a) => {
        const r = processCvai(a, a);
        expect(r.sevIdx).toBe(0);
        expect(r.displayCvai).toBe(0);
      }),
    );
  });

  it("never lowers severity as asymmetry grows (monotonic in |A−B|)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 50, max: 200, noNaN: true }),
        fc.double({ min: 0, max: 180, noNaN: true }),
        fc.double({ min: 0, max: 180, noNaN: true }),
        (b, x, y) => {
          const d1 = Math.min(x, y);
          const d2 = Math.max(x, y);
          const r1 = processCvai(b + d1, b);
          const r2 = processCvai(b + d2, b);
          expect(r1.sevIdx).toBeLessThanOrEqual(r2.sevIdx);
        },
      ),
    );
  });

  it("returns null for non-positive or non-finite diagonals", () => {
    expect(processCvai(0, 90)).toBeNull();
    expect(processCvai(90, 0)).toBeNull();
    expect(processCvai(-5, 90)).toBeNull();
    expect(processCvai(NaN, 90)).toBeNull();
    expect(processCvai(Infinity, 90)).toBeNull();
  });
});

describe("processCr — properties", () => {
  const order = { ok: 0, watch: 1, ortho: 2 };
  const EPS = 1e-9;

  it("always produces a known bucket and a positive ratio", () => {
    fc.assert(
      fc.property(mm(), mm(), (ml, ap) => {
        const r = processCr(ml, ap);
        expect(r).not.toBeNull();
        expect(Object.keys(order)).toContain(r.key);
        expect(r.displayCr).toBeGreaterThan(0);
      }),
    );
  });

  it("keeps the bucket consistent with the displayed ratio (CHOA thresholds 85/90)", () => {
    fc.assert(
      fc.property(mm(), mm(), (ml, ap) => {
        const { key, displayCr } = processCr(ml, ap);
        if (key === "ortho") expect(displayCr).toBeGreaterThanOrEqual(90 - EPS);
        else if (key === "ok") expect(displayCr).toBeLessThanOrEqual(85 + EPS);
        else {
          expect(displayCr).toBeGreaterThanOrEqual(85 - EPS);
          expect(displayCr).toBeLessThanOrEqual(90 + EPS);
        }
      }),
    );
  });

  it("never lowers the bucket as width grows (monotonic in M/L)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 80, max: 200, noNaN: true }),
        fc.double({ min: 1, max: 200, noNaN: true }),
        fc.double({ min: 1, max: 200, noNaN: true }),
        (ap, m1, m2) => {
          const lo = Math.min(m1, m2);
          const hi = Math.max(m1, m2);
          expect(order[processCr(lo, ap).key]).toBeLessThanOrEqual(order[processCr(hi, ap).key]);
        },
      ),
    );
  });

  it("returns null for non-positive or non-finite inputs", () => {
    expect(processCr(0, 90)).toBeNull();
    expect(processCr(90, 0)).toBeNull();
    expect(processCr(-1, 90)).toBeNull();
    expect(processCr(NaN, 90)).toBeNull();
  });
});

describe("validateMeasurement — properties", () => {
  it("accepts any finite positive value and round-trips it", () => {
    fc.assert(
      fc.property(fc.double({ min: 0.1, max: 1000, noNaN: true }), (n) => {
        const r = validateMeasurement(String(n), "X");
        expect(r.ok).toBe(true);
        expect(r.error).toBeNull();
        expect(r.value).toBe(parseFloat(String(n)));
      }),
    );
  });

  it("rejects non-positive values", () => {
    fc.assert(
      fc.property(fc.double({ min: -1000, max: 0, noNaN: true }), (n) => {
        expect(validateMeasurement(String(n), "X").ok).toBe(false);
      }),
    );
  });

  it("warns exactly when the value falls outside the supplied range", () => {
    const range = RANGES.diagA;
    fc.assert(
      fc.property(fc.double({ min: 0.1, max: 400, noNaN: true }), (n) => {
        const r = validateMeasurement(String(n), "X", range);
        const outside = n < range.min || n > range.max;
        expect(Boolean(r.warning)).toBe(outside);
      }),
    );
  });

  it("flags non-finite text as an error and blank as empty", () => {
    expect(validateMeasurement("abc", "X").ok).toBe(false);
    expect(validateMeasurement("abc", "X").error).toBeTruthy();
    expect(validateMeasurement("", "X").empty).toBe(true);
  });
});

describe("toTenths — properties", () => {
  it("returns an integer within 0.05 mm of the input", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), (v) => {
        const t = toTenths(v);
        expect(Number.isInteger(t)).toBe(true);
        expect(Math.abs(t / 10 - v)).toBeLessThanOrEqual(0.05 + 1e-9);
      }),
    );
  });
});

describe("note builders — properties", () => {
  const fmtMm = (raw) => (Math.round(parseFloat(raw) * 10) / 10).toFixed(1);

  it("buildCvaiNote never throws and always embeds the header, CVAI and measurements", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 30, noNaN: true }),
        fc.constantFrom(...SEVERITY),
        mm(),
        mm(),
        (cvai, sev, a, b) => {
          const note = buildCvaiNote(cvai, sev, String(a), String(b));
          expect(note).toContain("PLAGIOCEPHALY ASSESSMENT");
          expect(note).toContain(`${cvai.toFixed(2)}%`);
          expect(note).toContain(`${fmtMm(String(a))} mm`);
          expect(note).toContain(`${fmtMm(String(b))} mm`);
        },
      ),
    );
  });

  it("buildCrNote never throws and always embeds the header and ratio", () => {
    const inputs = [
      { key: "ortho", label: "Orthotic evaluation recommended", rangeFull: "CR > 90", detail: "d" },
      { key: "watch", label: "Borderline", rangeFull: "CR 85 – 90", detail: "d" },
      { key: "ok", label: "Within normal range", rangeFull: "CR < 85", detail: "d" },
    ];
    fc.assert(
      fc.property(
        fc.double({ min: 50, max: 120, noNaN: true }),
        fc.constantFrom(...inputs),
        mm(),
        mm(),
        (cr, res, ml, ap) => {
          const note = buildCrNote(cr, res, String(ml), String(ap));
          expect(note).toContain("BRACHYCEPHALY ASSESSMENT");
          expect(note).toContain(`${cr.toFixed(1)}%`);
          expect(note).toContain(`${fmtMm(String(ml))} mm`);
        },
      ),
    );
  });
});
