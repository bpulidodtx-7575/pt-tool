import { describe, it, expect } from "vitest";
import { validateMeasurement, toTenths, processCvai, processCr, RANGES } from "./calc";

describe("validateMeasurement", () => {
  it("returns empty for blank input", () => {
    expect(validateMeasurement("", "Test", RANGES.diagA)).toEqual({
      ok: false,
      value: null,
      error: null,
      empty: true,
    });
  });

  it("validates a good number", () => {
    const r = validateMeasurement("100", "Diag A", RANGES.diagA);
    expect(r.ok).toBe(true);
    expect(r.value).toBe(100);
    expect(r.warning).toBeNull();
  });

  it("rejects non-numeric input", () => {
    const r = validateMeasurement("abc", "Diag A", RANGES.diagA);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("must be a valid number");
  });

  it("rejects zero/negative", () => {
    expect(validateMeasurement("0", "X", RANGES.diagA).error).toContain("greater than zero");
    expect(validateMeasurement("-5", "X", RANGES.diagA).error).toContain("greater than zero");
  });

  it("warns outside typical range", () => {
    const r = validateMeasurement("300", "Diag A", RANGES.diagA);
    expect(r.ok).toBe(true);
    expect(r.warning).toContain("Outside typical range");
  });
});

describe("toTenths", () => {
  it("rounds to nearest 0.1 mm", () => {
    expect(toTenths(95.34)).toBe(953);
    expect(toTenths(95.35)).toBe(954);
    expect(toTenths(100)).toBe(1000);
  });
});

describe("processCvai", () => {
  it("returns null for invalid input", () => {
    expect(processCvai(0, 100)).toBeNull();
    expect(processCvai(-1, 100)).toBeNull();
    expect(processCvai(NaN, 100)).toBeNull();
  });

  it("returns level 0 (normal) for near-identical diagonals", () => {
    // 100 vs 100 → diff=0 → CVAI 0% → sevIdx 0
    const r = processCvai(100, 100);
    expect(r.sevIdx).toBe(0);
    expect(r.displayCvai).toBe(0);
  });

  it("returns level 0 for CVAI < 3.5", () => {
    // 100 vs 97 → diff=30, max=1000 → CVAI = 30/1000*100 = 3.0%
    const r = processCvai(100, 97);
    expect(r.sevIdx).toBe(0);
    expect(r.displayCvai).toBeCloseTo(3.0, 1);
  });

  it("returns level 1 (mild) for CVAI 3.5-6.25", () => {
    // 100 vs 94 → diff=60, max=1000 → CVAI = 60/1000*100 = 6.0%
    const r = processCvai(100, 94);
    expect(r.sevIdx).toBe(1);
    expect(r.displayCvai).toBeCloseTo(6.0, 1);
  });

  it("returns level 2 (moderate) for CVAI 6.25-8.75", () => {
    // 100 vs 92 → diff=80, max=1000 → CVAI = 80/1000*100 = 8.0%
    const r = processCvai(100, 92);
    expect(r.sevIdx).toBe(2);
    expect(r.displayCvai).toBeCloseTo(8.0, 1);
  });

  it("returns level 3 (severe) for CVAI 8.75-11.0", () => {
    // 100 vs 90 → diff=100, max=1000 → CVAI = 10.0%
    const r = processCvai(100, 90);
    expect(r.sevIdx).toBe(3);
    expect(r.displayCvai).toBeCloseTo(10.0, 1);
  });

  it("returns level 4 (very severe) for CVAI > 11.0", () => {
    // 100 vs 85 → diff=150, max=1000 → CVAI = 15.0%
    const r = processCvai(100, 85);
    expect(r.sevIdx).toBe(4);
    expect(r.displayCvai).toBeCloseTo(15.0, 1);
  });

  it("always uses the longer diagonal as A", () => {
    // processCvai is symmetric — swapping inputs should give same result
    const r1 = processCvai(120, 100);
    const r2 = processCvai(100, 120);
    expect(r1.displayCvai).toBeCloseTo(r2.displayCvai, 5);
    expect(r1.sevIdx).toBe(r2.sevIdx);
  });

  // The severity buckets are computed with obscure integer-tenths comparisons
  // (calc.js). These lock down the exact transition points at 3.5 / 6.25 /
  // 8.75 / 11.0% so a future edit to that arithmetic can't silently shift a
  // patient into the wrong CHOA level. A is fixed at 100 mm (1000 tenths).
  describe("severity boundaries (A = 100 mm)", () => {
    const cases = [
      [96.6, 3.4, 0], // just below 3.5 → Level 1
      [96.5, 3.5, 1], // at 3.5 → Level 2
      [93.8, 6.2, 1], // just below 6.25 → Level 2
      [93.7, 6.3, 2], // at/above 6.25 → Level 3
      [91.3, 8.7, 2], // just below 8.75 → Level 3
      [91.2, 8.8, 3], // at/above 8.75 → Level 4
      [89.0, 11.0, 3], // at 11.0 → Level 4
      [88.9, 11.1, 4], // above 11.0 → Level 5
    ];
    it.each(cases)("B=%f mm → CVAI %f%% → sevIdx %i", (b, expectedCvai, expectedIdx) => {
      const r = processCvai(100, b);
      expect(r.displayCvai).toBeCloseTo(expectedCvai, 1);
      expect(r.sevIdx).toBe(expectedIdx);
    });
  });
});

describe("processCr", () => {
  it("returns null for invalid input", () => {
    expect(processCr(0, 100)).toBeNull();
    expect(processCr(-1, 100)).toBeNull();
  });

  it("returns 'ok' for CR < 85", () => {
    // 84.9 x 100 mm → CR = 84.9% → ok
    const r = processCr(84.9, 100);
    expect(r.key).toBe("ok");
    expect(r.displayCr).toBeCloseTo(84.9, 1);
  });

  it("returns 'watch' for CR 85-90", () => {
    // 87 x 100 mm → CR = 87%
    const r = processCr(87, 100);
    expect(r.key).toBe("watch");
  });

  it("returns 'ortho' for CR > 90", () => {
    // 95 x 100 mm → CR = 95%
    const r = processCr(95, 100);
    expect(r.key).toBe("ortho");
  });

  it("handles edge at exactly 90", () => {
    // 90 x 100 mm → CR = 90% — should be 'watch' (>90 is ortho)
    const r = processCr(90, 100);
    expect(r.key).toBe("watch");
  });
});
