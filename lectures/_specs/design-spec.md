# Shared design spec — interactive lecture sets (3Blue1Brown style)

Every page is ONE self-contained HTML file. No external resources whatsoever (no CDN, no fonts, no images, no MathJax/KaTeX). All CSS in one <style> block, all JS in one <script> block, vanilla JS + <canvas> 2D. Must work offline from file:// and on GitHub Pages.

## Look & feel (match exactly)

CSS custom properties, define on :root:

```css
:root{
  --bg:#0e1117;          /* page background, near-black navy */
  --panel:#161b26;       /* card/panel background */
  --panel2:#1c2230;      /* slightly lighter panel (controls) */
  --ink:#e6e9f0;         /* main text */
  --muted:#8b94a7;       /* secondary text */
  --grid:#232b3b;        /* canvas grid lines */
  --axis:#4a5568;        /* canvas axes */
  --blue:#58c4dd;        /* 3b1b blue  — primary vector color */
  --yellow:#ffd35a;      /* 3b1b yellow — secondary vector / highlight */
  --red:#fc6255;         /* 3b1b red   — warnings, second operand */
  --green:#83c167;       /* 3b1b green — results, success */
  --purple:#c688eb;      /* extra series */
  --orange:#ff9f4b;      /* extra series */
  --line:#2a3347;        /* borders */
}
```

- body: `background:var(--bg); color:var(--ink); font-family:'Segoe UI',system-ui,-apple-system,sans-serif; line-height:1.55;`
- Math expressions use `font-family:Georgia,'Times New Roman',serif; font-style:italic;` via a class `.math`. Use Unicode for symbols: α β θ λ ⟨ ⟩ | ⟩ √ ² ⊗ †  ℂ ℝ. Kets like |0⟩ |ψ⟩ rendered inline with the .math class.
- Panels: `background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:18px 20px;`
- Max content width 1100px, centered, padding 24px on the sides, generous vertical rhythm.

## Page skeleton (use this structure on every page)

1. `<header>` — small breadcrumb link back to the set's `./index.html` (color var(--muted), hover var(--blue)); then `<h1>` page title; then a one-paragraph subtitle in var(--muted) saying what to do ("Drag the yellow dot…").
2. Main interactive panel: a `<canvas>` (or DOM widget) inside a panel div. Canvas is the star — big (width 100%, height ~460-560px), device-pixel-ratio aware (scale by devicePixelRatio, redraw on resize via ResizeObserver or window resize).
3. Controls row(s) under or beside the canvas: sliders, buttons, preset chips. Style:
   - buttons: `background:var(--panel2); border:1px solid var(--line); color:var(--ink); border-radius:9px; padding:8px 14px; cursor:pointer;` hover: border-color var(--blue). Active/selected state: `border-color:var(--blue); color:var(--blue); background:rgba(88,196,221,.08)`.
   - sliders: accent-color: var(--blue).
   - live readouts of values in .math spans colored to match what they control.
4. A "readout" panel showing the live math/state (the equation with current numbers substituted, colored consistently).
5. 2–4 short "insight" cards at the bottom (`<section class="insights">`, grid of cards): each has a small colored title and 2–3 sentences tying the interaction to the lecture concept. Conversational 3b1b tone ("Notice how…", "This is why…").
6. `<footer>` — muted, small: "Interactive companion to the lecture *<Lecture title>* · <code>". Plus prev/next links to sibling pages in the set's nav order and a middle `All explorations` → ./index.html.

## Canvas drawing conventions (3b1b feel)

- Dark field with a faint square grid (var(--grid), 1px), brighter axes (var(--axis), ~1.5px), small axis tick labels in var(--muted) 11px sans.
- Vectors: arrows with filled triangular heads, 2.5–3px line width, colored per palette. Draggable handles: a filled circle (r≈7) at the tip with a subtle white halo on hover/drag; cursor:grab / grabbing.
- Animations: requestAnimationFrame loop; ease in-out (smoothstep t*t*(3-2t)) for transitions; typical transition 0.8–1.2 s. A Play/Pause ⏸/▶ button where there is a continuous animation.
- Draggability: support mouse AND touch (pointer events). Hit-test radius ≥ 14px.
- Ghost/trail effects: previous positions drawn with globalAlpha 0.15–0.35 where it helps intuition.
- Text on canvas: 13-14px sans for labels; italic serif (Georgia) for math labels.
- Everything must remain legible if the canvas is ~360px wide (mobile).

## Code quality

- No frameworks, no build. One rAF loop per page. Keep state in a single `const state = {...}`.
- Guard divide-by-zero, clamp drags to canvas.
- Page `<title>`: "<Topic> — <Lecture short name>".
