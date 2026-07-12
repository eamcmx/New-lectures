# MOUNTING.md — CCSA T1: Introduction to Computers & Computer Systems Architecture

CourseForge PAAL session kit. How to mount the files of this folder on Moodle.
Everything is a self-contained HTML file — host on GitHub Pages (already live) and mount by
URL, or upload the files to Moodle as File resources. Base URL:

    https://eamcmx.github.io/New-lectures/lectures/ccsa-intro/

## The five parts (+ PAAL layer) and how to mount them

| # | Kit part | File | Moodle resource | Settings |
|---|----------|------|-----------------|----------|
| 1 | Interactive lecture | `lecture.html` | URL resource "📖 Lecture (interactive)" | Open in new window. Make it the first item of the topic. |
| 2 | Teacher deck | `teacher-deck.html` | URL resource, **hidden from students** (or keep off Moodle) | Teacher presents from it; press `N` for speaker notes, `F` for fullscreen, `G` for grid. |
| 3 | Formative quiz (80% gate) | `quiz.html` | URL resource "✅ Formative quiz — pass 80% to unlock solutions" | The gate is built in (client-side, best score kept in the student's browser). See note below for a *graded* variant. |
| 4 | Worked solutions (gated) | `worked-solutions.html` | URL resource "🔓 Worked solutions (unlocks at 80%)" | Page unlocks itself when the quiz gate is passed in the same browser. Instructor override code: `TSI-CCSA`. |
| 5 | Instructor key (hidden) | `instructor-key.html` | **Do not add to Moodle.** Share the URL + code `TSI-CCSA` with teaching staff only. | Contains quiz key, solution answers, 90-min runbook, misconceptions list. |

### PAAL layer (Progressive AI-Augmented Learning)

| Kit part | File | Moodle resource |
|----------|------|-----------------|
| Prompt Studio | `prompt-studio.html` | URL resource "🤖 Prompt Studio — practice with an AI, properly" |
| Study Buddy | `study-buddy.html` | URL resource "💬 Study Buddy (bring your own free Mistral key)" |
| Flashcards | `flashcards.html` | URL resource "🃏 Flashcards — spaced repetition" |

### The 13 interactive labs (linked from inside the lecture — optional to list separately)

`timeline.html`, `abacus.html`, `slide-rule.html`, `punch-card.html`,
`analytical-engine.html`, `turing-machine.html`, `abc.html`, `z3.html`, `mark1.html`,
`eniac.html`, `stored-program.html`, `moore.html`, `cisc-risc.html` — plus the course CPU
simulators at `../../sim/`. The lecture page links each one at the right point ("🔬 LAB"
cards), so mounting `lecture.html` alone is enough; add `index.html` ("🗂 All explorations")
as a second URL resource if you want the full menu visible.

## About the quiz gate (important)

The 80% gate and reveal-on-pass are implemented **client-side** (localStorage in the
student's browser): perfect for *formative* self-study, not for grading — scores are not
reported to Moodle and clearing the browser resets them. If you need a **graded** quiz:
re-author the 12 questions (see `instructor-key.html`) as a Moodle Quiz, set *Grade to
pass: 80%*, then add `worked-solutions.html` as a URL resource with
*Restrict access → Grade → the quiz ≥ 80%*, and give students the override code path only
via the instructor. This mirrors the standard CourseForge quiz-gate + reveal-on-pass
mounting.

## Suggested topic layout (top to bottom)

1. 📖 Lecture (interactive) — `lecture.html`
2. 🗂 All explorations — `index.html`
3. ✅ Formative quiz — `quiz.html`
4. 🔓 Worked solutions — `worked-solutions.html`
5. 🤖 Prompt Studio — `prompt-studio.html`
6. 💬 Study Buddy — `study-buddy.html`
7. 🃏 Flashcards — `flashcards.html`

Teacher-only (not on Moodle): `teacher-deck.html`, `instructor-key.html` (+ code `TSI-CCSA`).

## Session plan

A ready 90-minute runbook (hook → devices → six-simulator group activity → modern era →
quiz) is inside `instructor-key.html`.
