# New-lectures — project notes for Claude Code

Interactive, single-page HTML lectures published with GitHub Pages at https://eamcmx.github.io/New-lectures/.

**Start by reading `HANDOFF.md`** — it describes every lecture set built so far, the conventions, and the workflow. The visual system and kit rules live in `lectures/_specs/`:

- `lectures/_specs/design-spec.md` — the shared 3Blue1Brown-style look & feel every page follows
- `lectures/_specs/spec-paal-kit.md` — the CourseForge PAAL per-session kit (lecture, teacher deck, gated quiz, worked solutions, instructor key, prompt studio, study buddy, flashcards, MOUNTING.md) and its localStorage gate contract
- `lectures/_specs/spec-simulators.md` — requirements for "program the first computers" simulator pages

## Rules

- Every page is ONE self-contained HTML file (inline CSS + vanilla JS + canvas). No CDNs, no fonts, no images, no build step. Must work from `file://` and on GitHub Pages.
- Each lecture set lives in `lectures/<set>/` with an `index.html` landing page; sibling pages carry prev/next footer nav and an "All explorations" link.
- Keep instructor keys unlisted (no links from any page); note the instructor code in the set's `MOUNTING.md`.
- After building or changing pages: verify in headless Chromium (zero console errors), sweep internal links, update the set's `index.html` and the README table, then commit and open a PR to `main`.
- Pages are served from `main` via GitHub Pages; nothing is live until merged.
