import { describe, it, expect } from "vitest";
import {
  validateMeasurement,
  toTenths,
  processCvai,
  processCr,
  buildCvaiNote,
  buildCrNote,
  fmtTimestamp,
  SEVERITY,
  CR_LEVELS,
  RANGES,
} from "./calc";

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

  it("handles edge at exactly 85 → 'watch' (matches the 'CR < 85' normal legend)", () => {
    // 85 x 100 mm → CR = 85% — the ok band is CR < 85, so 85 is 'watch'
    const r = processCr(85, 100);
    expect(r.key).toBe("watch");
  });
});

describe("CR_LEVELS legend matches processCr behavior", () => {
  it("labels the normal band as CR < 85 (not ≤ 85)", () => {
    // Regression guard: the legend must agree with processCr, which routes 85 → watch.
    expect(CR_LEVELS.ok.rangeFull).toBe("CR < 85");
    expect(processCr(84.9, 100).key).toBe("ok");
    expect(processCr(85, 100).key).toBe("watch");
  });
});

// Provenance guard: the numeric band edges shown to clinicians (SEVERITY[].range,
// CR_LEVELS[].rangeFull) must stay in lockstep with the thresholds the algorithm
// actually uses. Unlike the hand-picked boundary cases above, these tests *derive*
// the edges from the reference data, so editing a displayed band without updating
// the arithmetic (the PR #14 class of bug, for CVAI too) fails CI.
describe("clinical constants ↔ legend provenance", () => {
  const nums = (s) => (s.match(/\d+(?:\.\d+)?/g) || []).map(Number);

  describe("CVAI severity bands", () => {
    const bands = SEVERITY.map((s) => nums(s.range));

    it("forms a contiguous partition at the canonical CHOA edges", () => {
      const edges = bands.slice(0, -1).map((b, i) => {
        const upper = b[b.length - 1]; // upper bound of band i
        const lower = bands[i + 1][0]; // lower bound of band i+1
        expect(upper).toBe(lower); // no gap / mismatched overlap between bands
        return upper;
      });
      expect(edges).toEqual([3.5, 6.25, 8.75, 11.0]);
    });

    it("transitions exactly at each displayed edge", () => {
      // a = 20000 mm → max = 200000 tenths, so 1 tenth of `diff` ≈ 0.0005% CVAI —
      // fine resolution for probing ±1 tenth around an edge.
      const idxForDiff = (diff) => processCvai(20000, (200000 - diff) / 10).sevIdx;
      const edgeDiff = (pct) => Math.round((pct / 100) * 200000);
      const edges = bands.slice(0, -1).map((b) => b[b.length - 1]);
      edges.forEach((pct, e) => {
        expect(idxForDiff(edgeDiff(pct) - 1)).toBe(e); // just below → lower level
        expect(idxForDiff(edgeDiff(pct) + 1)).toBe(e + 1); // just above → higher level
      });
    });
  });

  describe("Cephalic Ratio thresholds", () => {
    it("derives the 85 / 90 edges from the displayed bands", () => {
      expect(nums(CR_LEVELS.ok.rangeFull)).toEqual([85]); // "CR < 85"
      expect(nums(CR_LEVELS.watch.rangeFull)).toEqual([85, 90]); // "CR 85 – 90"
      expect(nums(CR_LEVELS.ortho.rangeFull)).toEqual([90]); // "CR > 90"
    });

    it("routes the displayed edges per legend (ap = 100 mm → CR == ml)", () => {
      const [lo, hi] = nums(CR_LEVELS.watch.rangeFull); // [85, 90]
      const crKey = (cr) => processCr(cr, 100).key;
      expect(crKey(lo - 0.1)).toBe("ok"); // < 85 → normal
      expect(crKey(lo)).toBe("watch"); // exactly 85 → monitor
      expect(crKey(hi)).toBe("watch"); // exactly 90 → monitor
      expect(crKey(hi + 0.1)).toBe("ortho"); // > 90 → orthotic eval
    });
  });
});

describe("fmtTimestamp", () => {
  it("returns a non-empty date + time string", () => {
    const ts = fmtTimestamp();
    expect(typeof ts).toBe("string");
    expect(ts.length).toBeGreaterThan(0);
    // Locale-agnostic: should contain digits for the date and the time.
    expect(ts).toMatch(/\d/);
  });
});

describe("buildCvaiNote", () => {
  const sev = SEVERITY[3]; // Level 4 — severe
  const note = buildCvaiNote(10.0, sev, "100", "90");

  it("includes the header, value, and severity line", () => {
    expect(note).toContain("PLAGIOCEPHALY ASSESSMENT");
    expect(note).toContain("CVAI: 10.00%");
    expect(note).toContain(`Severity: Level ${sev.level}`);
    expect(note).toContain(sev.label);
    expect(note).toContain(sev.rangeFull);
  });

  it("includes both measurements, recommendation, referral, and source", () => {
    expect(note).toContain("Diagonal A (longer):  100.0 mm");
    expect(note).toContain("Diagonal B (shorter): 90.0 mm");
    expect(note).toContain(`Recommendation: ${sev.recommendation}`);
    expect(note).toContain(`Referral: ${sev.referral}`);
    expect(note).toContain("not a diagnostic device");
    sev.presentation.forEach((p) => expect(note).toContain(p));
  });

  it("rounds measurements with the same tenths rounding as the calculation", () => {
    // 100.16 → toTenths 1002 → 100.2 mm (not parseFloat-only drift)
    const n = buildCvaiNote(10.0, sev, "100.16", "90.04");
    expect(n).toContain("100.2 mm");
    expect(n).toContain("90.0 mm");
  });
});

describe("buildCrNote", () => {
  it("covers all three referral branches", () => {
    const ortho = buildCrNote(95, { ...CR_LEVELS.ortho, key: "ortho" }, "95", "100");
    expect(ortho).toContain("BRACHYCEPHALY ASSESSMENT");
    expect(ortho).toContain("Cephalic Ratio: 95.0%");
    expect(ortho).toContain("Referral: Yes");

    const watch = buildCrNote(87, { ...CR_LEVELS.watch, key: "watch" }, "87", "100");
    expect(watch).toContain("Referral: Monitor");

    const ok = buildCrNote(80, { ...CR_LEVELS.ok, key: "ok" }, "80", "100");
    expect(ok).toContain("Referral: No");
    expect(ok).toContain("range: CR < 85");
  });
});
