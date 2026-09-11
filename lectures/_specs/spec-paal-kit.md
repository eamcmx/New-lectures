# PAAL kit spec — the CourseForge per-session package (applies to any lecture set)

Modeled on the TSI CourseForge PAAL edition (repo eamcmx/courseforge-dilc). One lecture session produces, in the lecture's folder, alongside its interactive widgets:

| Kit part | File | Notes |
|---|---|---|
| Interactive lecture | `lecture.html` | Full lecture content as a guided long-form page; every widget woven in as a "🔬 LAB" card at the right narrative point; per-section self-check; sticky progress rail |
| Teacher deck | `teacher-deck.html` | Full-viewport keyboard-driven slides; N = presenter notes, F = fullscreen, G = grid, `#n` deep links; live-demo buttons open widgets in new tabs |
| Formative quiz | `quiz.html` | 12 questions, shuffled, instant explanations, animated SVG score dial, 80% gate |
| Worked solutions | `worked-solutions.html` | 5 exam-style exercises, progressive step reveal (move + WHY), gated by the quiz |
| Instructor key | `instructor-key.html` | UNLISTED (no page links to it), code-gated: quiz key + distractor rationales, solutions summary, 90-min runbook, misconceptions, grading/Moodle notes |
| Prompt Studio | `prompt-studio.html` | PAAL signature: prompt recipe builder, expert prompt gallery, weak-vs-strong prompt clinic, verification habit |
| Study Buddy | `study-buddy.html` | In-page Socratic chat on the student's own free Mistral key (browser-only storage; only endpoint api.mistral.ai) |
| Flashcards | `flashcards.html` | Leitner 3-box deck, localStorage persistence |
| Mounting sheet | `MOUNTING.md` | Which file → which Moodle resource; graded-variant instructions |

## Gate contract (per lecture set, prefix = set slug, e.g. `qcla`, `ccsa`)

- Quiz stores best score percent (integer, ONLY ever raised) in localStorage `<prefix>-quiz-best`.
- `worked-solutions.html` is locked until `<prefix>-quiz-best >= 80`; re-checks on the `storage` event and window focus (passing in another tab unlocks live). Muted "instructor?" link → prompt(); the instructor code sets `<prefix>-solutions-override=1`.
- `instructor-key.html`: content hidden behind the same code; success stores `<prefix>-instructor=1`. Honest footnote: this is deterrence, not security (answers are in the page source).
- Prompt Studio → Study Buddy seed: `<prefix>-buddy-seed` (prefilled into the buddy's input, then cleared).
- Study Buddy key: `<prefix>-mistral-key`. Flashcards: `<prefix>-cards-v1`.

Instructor codes used so far: QC linear algebra `TSI-T2`; CCSA T1 `TSI-CCSA`.

## PAAL badge

Under the h1 of kit pages: `<span>` styled font-size .72rem, letter-spacing .08em, uppercase, color var(--purple), 1px purple border, radius 999px, padding 3px 10px — text "PAAL · Progressive AI-Augmented Learning" (widgets) or "PAAL · CourseForge session kit" (kit pages).

## Kit nav order

lecture → teacher-deck → quiz → worked-solutions → prompt-studio → study-buddy → flashcards (wrap). Instructor key is outside the chain.
