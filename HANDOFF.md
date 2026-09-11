# HANDOFF — state of the interactive lecture sets (read this first in any new session)

Repo: eamcmx/New-lectures · Published: https://eamcmx.github.io/New-lectures/ · README indexes every page.
Work so far was done in the Claude Code cloud session "Interactive lecture animations"
(https://claude.ai/code/session_01WXKDDznJrokPhYQ6Jd1XnD). Everything is merged to `main`.

## What exists (36 published pages)

### lectures/qc-linear-algebra/ — "Linear Algebra for Quantum Computing" (T2) — 15 pages
Part I widgets (7): complex-numbers, euler, span-basis, transformations, eigen, inner-product, qubit.
Part II (8): tensor-product, operator-zoo, spectral + PAAL layer: quiz, worked-solutions, prompt-studio, study-buddy, flashcards.
Gate prefix `qcla`, instructor/override code `TSI-T2`. Missing vs full kit: lecture.html, teacher-deck.html, instructor-key.html, MOUNTING.md.

### lectures/ccsa-intro/ — "Introduction to Computers & Computer Systems Architecture" (CCSA T1) — 21 pages
Part A context widgets (4): timeline, abacus, slide-rule, punch-card.
Part B working simulators (6): analytical-engine, turing-machine, abc, z3, mark1, eniac.
Part C architecture era (3): stored-program, moore, cisc-risc.
Part D CourseForge PAAL kit (7 + sheet): lecture, teacher-deck, quiz, worked-solutions, instructor-key (unlisted), prompt-studio, flashcards, MOUNTING.md.
The study-buddy page was replaced by **TSI Buddy** embedded in lecture + prompt-studio (tsi-buddy skill asset inlined, ministral-8b-2512, temperature 0.4, Stage 1 · Consultant prompt grounded in the lecture notes); Prompt Studio hands its prompt to the on-page buddy.
Mounted on e.tsi.lv course 3981, Topic 0 (section id 52442), as URL resources — see MOUNTING.md.
Gate prefix `ccsa`, instructor/override code `TSI-CCSA`.
Cross-links the older course CPU simulators in /sim/ (vnmsim.html, harvard.html, compare.html).

## Conventions (specs in lectures/_specs/)

- design-spec.md — the shared 3Blue1Brown-style visual system (palette, skeleton, canvas rules). Every page follows it.
- spec-paal-kit.md — the CourseForge PAAL per-session kit: file list, gate contract, badge, nav.
- spec-simulators.md — requirements for "program the first computers" simulator pages.
- Every page: ONE self-contained HTML, vanilla JS + canvas, no external resources (exceptions: study-buddy / TSI Buddy call api.mistral.ai with the student's own key; TSI Buddy also lazy-loads marked + KaTeX from jsDelivr to format replies and falls back to plain text without them).
- Each set folder has an index.html landing page with section cards; sibling pages have prev/next footer nav + "All explorations" link.

## Workflow that worked

1. Extract the lecture PDF text (pypdf) → summarize content pillars.
2. Write a per-lecture spec (content summary, nav order, gate prefix) next to the shared specs.
3. Build pages in parallel (one builder per page, each given design-spec + the lecture spec + a detailed page brief with presets whose answers are stated so the builder can verify them).
4. Verify in headless Chromium: zero console errors + screenshots + functional gate tests (set localStorage `<prefix>-quiz-best=92`, reload solutions page → all exercises visible).
5. Sweep internal nav links (`grep -o 'href="\./[a-z0-9-]*\.html"'`), strip stray bytes, update the set's index.html + README table, commit, PR to main, merge, curl every URL for 200.

## Natural next steps

- Complete the QC linear algebra kit (lecture.html, teacher-deck.html, instructor-key.html, MOUNTING.md) to match CCSA.
- Next lecture in the CSA course: same recipe — widgets + simulators where the topic allows + PAAL kit.
- Optional: an IMS Common Cartridge (.imscc) per set so Moodle imports the whole topic in one Restore.
