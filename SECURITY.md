# Security

The Plagiocephaly Assessment Tool is a client-side clinical calculator. It has **no backend, no
network requests beyond loading the static app, and no data storage** — every measurement is
session-only and cleared on refresh (see `AGENTS.md`). The main risk this app carries is not data
exposure; it's an incorrect calculation reaching a clinical decision, which is why `calc.js`'s
tests pin the clinical constants against their CHOA source (see `AGENTS.md`'s note on the
"clinical constants ↔ legend provenance" tests).

## Reporting

Open a [private security advisory][advisory] on this repository. Please do not open a public
issue for a vulnerability.

[advisory]: https://github.com/bpulidodtx-7575/pt-tool/security/advisories/new

## What the security model rests on

- **No backend, no PII collected or transmitted.** Measurements never leave the browser tab;
  there is nothing to breach on a server that doesn't exist.
- **CSP and security headers are already set** in `files/netlify.toml` — `script-src 'self'` (no
  inline or CDN scripts), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`. Fonts are self-hosted for the same reason: nothing loads from a
  third-party origin.
- **`npm audit --omit=dev --audit-level=high` is a blocking CI gate** on production dependencies
  (only `react`/`react-dom` ship); the full dev-tooling tree is surfaced non-blockingly for
  triage. Dependabot opens grouped weekly PRs for the routine churn.
- **CodeQL** (`codeql.yml`) runs static analysis on every push, PR, and weekly on schedule.
  `secrets` (gitleaks, full history, weekly + PR + push) catches a credential that was committed
  and later removed from HEAD — the layer CodeQL and `npm audit` don't cover.

## Known accepted risks

None currently tracked. If that changes — a backend, persistence, or third-party integration is
added — this file needs a real threat model to go with it.
