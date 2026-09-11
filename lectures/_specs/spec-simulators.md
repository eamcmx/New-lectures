# Simulator spec — "program the first computers" pages (CCSA)

Full working simulators must let students feel what it was LIKE to program (or operate) each machine, and see the real class of problems it solved. Follow design-spec.md for look & feel.

## Required page structure for every simulator

1. Header + one-paragraph subtitle: what the machine was, in one breath.
2. "THE MACHINE" historical panel (3 short blocks): Year/builder/tech · How it was programmed (the human experience) · What problems it actually solved (historically accurate).
3. THE SIMULATOR (biggest panel): faithful-in-spirit, honestly-simplified working model. Always: a program/instruction area the student EDITS, machine-state displays (registers/memory/tape/drums) that animate during execution, and controls: ▶ Run · ⏸ Pause · Step · Reset · speed slider. Execution must animate state changes — never just teleport numbers.
4. EXAMPLE PROGRAMS: 3+ one-click presets, at least one being the machine's REAL historical problem class, each with a 2-3 sentence "why this mattered" caption. Every preset's output must be verified by hand-trace or script before shipping.
5. "Simplifications" footnote panel: honest bullet list of deviations from the real machine.
6. 3 insight cards connecting to modern architecture concepts.
7. Footer nav.

## Shared UI conventions

- Program editors: monospace; one instruction/card/rule per row; the currently executing row highlighted with a soft blue left border + tint; invalid rows red left border.
- Machine state: registers as bracketed value boxes; values that just changed flash green ~0.5s; memory as a compact grid, accessed cell pulses.
- Errors stop execution with a friendly status message, in period voice where fun ("the machine jams").
- Speed slider ~0.2s–2s per step (default ~0.6s); Step works while paused; Space = step when paused.
- Presets short to write but real to run (5–25 instructions).

## Machines built (lectures/ccsa-intro/)

analytical-engine (card chains, run-up lever branching) · turing-machine (quintuple rule table) · abc (operator procedure, Gaussian elimination on drums) · z3 (real 9-instruction set on punched film, tape-loop iteration) · mark1 (paper-tape lines, receiving-means-adding accumulators, real time-cost model) · eniac (drag-and-plug program cables + data trunks, ring counters, master programmer loop).
