# ADR 0001 — Repository quality standard, piloted here

- **Status:** Accepted
- **Date:** 2026-09-02
- **Deciders:** @bpulidodtx-7575
- **Supersedes:** —

## Context

Four repositories share an owner and a working style but had diverged in quality
tooling. A separate pass converged their *governance* layer (Dependabot, gitleaks,
least-privilege `permissions`, `SECURITY.md`). The layer below it — what actually
stops bad code from landing — had not converged, and more importantly was not
enforced anywhere:

- **GitHub Free enforces branch protection on public repositories only.** Three of
  the four repos are private, so required status checks are unavailable on them.
  Two pull requests were merged with red CI in a single session; one of them put a
  broken config on `main` and needed a follow-up PR to fix.
- This repository's `typecheck` script was close to decorative:
  `files/jsconfig.json` had `"include": ["calc.js"]`, so it checked **1 of 12**
  source files and passed unconditionally.
- Coverage was gated at a flat 80% against a real 99%, so it could have absorbed a
  19-point regression silently.
- No repository had any local (pre-commit / pre-push) enforcement except
  `cards-in-box-app`.

This repo was chosen as the pilot because it is the only public one — the single
place where real branch protection can be proved rather than assumed — and because
it is the smallest real codebase (8 unit specs, 2 e2e).

## Decision

**Enforcement is local-first.** Husky hooks run the same checks CI runs:
`pre-commit` formats and lints staged files, `commit-msg` enforces Conventional
Commits, and `pre-push` runs typecheck, lint, format, coverage, dead-code and the
AI-slop gate. CI remains the backstop. Because this repository is public, branch
protection is *also* available and should require the aggregate `summary` check.

**New gates are baselined, then ratcheted.** Each threshold sits just under the
measured value so quality can hold or improve but never regress. Thresholds are
raised as findings are fixed; they are never lowered to make a build pass.

| Gate | Before | After |
| --- | --- | --- |
| Typecheck scope | 1 file | 12 files (all source) |
| Coverage floor | 80 / 80 / 80 / 80 | 98 / 92 / 96 / 98 |
| Coverage scope | 5 files | 6 files (adds `PlagiocephalyTool.jsx`) |
| aislop score | (not measured) | 64, gated at `failBelow: 62` |
| Dead code | (not measured) | knip clean |
| Workflow lint | none | actionlint + zizmor |

## Consequences

**What this cost.** Widening the typecheck surfaced 602 errors. 472 of those were
a single config fault — `@types/react` was never installed, so every JSX element
was an error — not 472 problems. With React types loaded the real number was 128,
of which ~80 were "add a JSDoc annotation" rather than defects. `noImplicitAny` is
therefore **off** while the rest of `strict` is on; turning it on is tracked
follow-up work, and `jsconfig.json` says so in a comment.

The 42 substantive findings were fixed, and they were overwhelmingly
*type-precision* gaps rather than bugs — correct code the checker could not prove.
Two were worth having found:

- `pwa-assets.config.js` set `favicon: false`, which is not a key of that preset
  (`favicons` is). It was dead config that read as an intentional setting.
- `main.jsx` passed a possibly-null `getElementById` straight into `createRoot`.

The highest-leverage fixes were three type declarations, not 42 edits: making
`ValidationResult` a discriminated union (so `ok: true` implies a non-null `value`)
and giving `useCopy`/`useTheme` explicit tuple return types cleared 18 errors on
their own.

**What is deliberately still failing.** aislop reports 34 warnings at score 64.
These were triaged, not missed, and are recorded in `.aislop/config.yml`:

- 15 `jsx-a11y/*` — real and worth fixing, but reworking markup risks the 135
  tests and the Lighthouse `accessibility >= 0.95` gate at the same time.
- 9 `ai-slop/narrative-comment` — every one is a `// ─── Section ───` divider,
  which is this repo's deliberate file-structure convention, not a comment
  narrating the code beneath it. The rule stays on as a warning because its other
  half is worth keeping.
- 7 `code-quality/duplicate-block` — real; needs judgement, not a mechanical fix.
- 15 `security/vulnerable-dependency` (dev-only, informational) — needs
  `vite` 5 → 8 and `vitest` 1 → 4 major upgrades.

**What is owed.** Branch protection must be enabled in the UI; it cannot be set
from CI. `noImplicitAny`, the a11y findings, and the dev-dependency majors are
follow-ups. zizmor runs `--offline`, so its network-dependent audits
(`ref-confusion`, `impostor-commit`) are not yet covered.

## Alternatives considered

**GitHub Pro ($4/month)** would unlock branch protection on the three private
repos, which is the single highest-leverage fix available. Rejected for now
because the standing constraint is free and open-source tooling only; local-first
hooks get most of the benefit at zero cost. The trade-off is real and should be
revisited: `git push --no-verify` bypasses every hook here, so this is a fast
feedback loop and a good-faith gate, **not** a security boundary.

**Making the private repos public** would also unlock enforcement, plus CodeQL and
secret scanning. Rejected because two of them contain client-confidential material.

**Setting gates at an aspirational bar** (e.g. aislop ≥ 80) rather than at the
measured baseline. Rejected because a gate the repository cannot currently pass
gets disabled or bypassed, which is strictly worse than a gate set where the code
actually is and moved upward deliberately.
