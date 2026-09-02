# Emil Kowalski's design-engineering skills

Vendored from [`emilkowalski/skills`](https://github.com/emilkowalski/skills) — MIT, © Emil Kowalski.
Upstream commit `d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7` (2026-08-21). Background:
[Agents with Taste](https://emilkowal.ski/ui/agents-with-taste) · [animations.dev](https://animations.dev/).

## How this lands in the Plagiocephaly Assessment Tool

- **Zero runtime dependencies beyond React, and it stays that way.** Motion here is CSS transitions
  in `files/styles.css` — no Framer Motion, no spring library. `emil-design-eng`'s CSS-transition
  and `@starting-style` sections are the applicable parts; ignore the library-specific ones.
- **Easing curves are tokens.** They go with the existing oklch CSS variables in `files/styles.css`,
  and the dark set is duplicated for `:root[data-theme="dark"]` and the media query — keep both in
  sync, same as every other token here.
- **The CSP is a hard boundary.** `script-src 'self'`, no CDN, self-hosted fonts. Any skill
  suggestion that loads something external is out.
- **Restraint applies double.** This is a clinical calculator used one-handed at a bedside.
  `find-animation-opportunities` is explicitly a filter as much as a generator — most of this UI
  should not animate, and the measurement flow should never wait on motion.
- **The a11y gates outrank motion.** `a11y.test.jsx` (`vitest-axe`), the Playwright a11y project,
  and the Lighthouse a11y budget (≥0.95) all still have to pass; `prefers-reduced-motion` is
  required, and touch targets stay ≥48px.
- **`animate-expo`, `write-swift` and `ask-sonner` are inert here** — kept so the set stays a
  straight mirror of upstream.

## What was pulled

All 12 skills from [`emilkowalski/skills`](https://github.com/emilkowalski/skills), vendored verbatim
into `.claude/skills/` — no edits, so a re-pull is a straight overwrite.

| Skill | What it does | Auto-invokes |
| --- | --- | --- |
| `emil-design-eng` | The main one: animation decision framework (should it animate → purpose → easing → duration), component-building principles, transform/`clip-path` technique, gesture physics, performance and reduced-motion rules, plus the Sonner "building loved components" principles. | yes |
| `animate` | Construction skill — builds one animation end to end, making the decisions in the order that determines whether it feels right. | yes |
| `animate-expo` | Same bar for React Native / Expo (Reanimated, Gesture Handler, haptics). | yes |
| `review-animations` | Strict review of motion code against the craft bar. Approval is earned, flagging is the default. | no (`/review-animations`) |
| `improve-animations` | Codebase-wide motion audit → prioritized, self-contained plans another agent can execute. | yes |
| `find-animation-opportunities` | Read-only sweep for places that should animate — and, just as important, what to leave alone. | yes |
| `animation-vocabulary` | Reverse-lookup glossary: "the bouncy thing when a popover opens" → *pop in*. | yes |
| `apple-design` | Apple's fluid-interface principles (velocity-aware springs, interruptibility, materials, typography) translated to the web. | yes |
| `pick-ui-library` | Curated, opinionated library picks per task. | no (`/pick-ui-library`) |
| `prototype` | Builds several genuinely different versions of a UI piece behind a live switcher. | no (`/prototype`) |
| `ask-sonner` | Setup, recipes, styling and common fixes for Sonner. | yes |
| `write-swift` | Modern Swift — value types, Swift 6 concurrency, generics, Swift Testing. | yes |

The three marked *no* carry `disable-model-invocation: true` upstream — they only run when you ask
for them by name.

## Design-system patterns these encode

The load-bearing rules, so you can spot when an agent is about to break one:

- **Easing is directional, and `ease-in` is never the answer for UI.** `ease-out` for anything
  entering or exiting, `ease-in-out` for movement on screen, `ease` for hover/color, `linear` only
  for constant motion. `ease-in` delays the first frame — the exact moment the user is watching.
- **Use custom curves, not the CSS built-ins.** `cubic-bezier(0.23, 1, 0.32, 1)` for ease-out,
  `cubic-bezier(0.77, 0, 0.175, 1)` for ease-in-out, `cubic-bezier(0.32, 0.72, 0, 1)` for drawers.
- **Duration by element**: 100–160ms button press, 125–200ms tooltip, 150–250ms dropdown,
  200–500ms modal/drawer — and UI motion stays **under 300ms**.
- **Only animate `transform` and `opacity`.** Anything else risks layout work every frame.
- **Never scale from 0.** Start at ~0.95 with opacity, or the element pops out of nowhere.
- **Popovers are origin-aware** — `transform-origin` follows the trigger. Modals are the exception
  and stay centered.
- **CSS transitions over keyframes** for anything the user can interrupt; springs where velocity and
  interruptibility matter.
- **Asymmetry is deliberate**: slow where the user is deciding, snappy where the system is
  responding.
- **`prefers-reduced-motion` is not optional**, and a hover state must never be the only affordance
  on touch.
- **Restraint beats motion.** `find-animation-opportunities` exists as much to say *don't* as *do*.

## Precedence

These are imported taste, not local law. **This repo's `CLAUDE.md`/`AGENTS.md` wins** on stack,
dependencies, tokens, and file layout. Where a skill suggests reaching for a library or a technique
this repo has already ruled out, the repo rule stands.

## Updating

```bash
git clone --depth 1 https://github.com/emilkowalski/skills.git /tmp/emil-skills
cp -R /tmp/emil-skills/skills/* .claude/skills/
```

Or `npx skills@latest add emilkowalski/skills` if you'd rather use the upstream installer.
