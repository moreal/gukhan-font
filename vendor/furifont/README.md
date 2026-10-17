# Vendored Furifont compiler

OpenType drawing and GSUB compilation from [furifont](https://github.com/antfu/furifont) `@furifont/compiler` **0.5.1**, commit `bd10386c5165a254370227c8cff418778867da78` (2026-10-16).

License: MIT. See [LICENSE.md](LICENSE.md). Copyright (c) 2025-PRESENT Anthony Fu.

Gukhan-font reuses this pipeline so Hangul-over-Hanja glyphs are drawn into a CFF base font the same way furigana is drawn into Source Han Sans JP. The planner that decides Korean readings is original code under `src/`; this directory does not choose readings.

Changes from upstream:

- `plan.ts` is the small slice of `@furifont/core`'s `PlanSchema` the compiler imports (`GLYPH_LIMIT`, `VERSION_PROBE`, the plan contract).
- `build.ts` and `outline.ts` import that local module instead of `@furifont/core`.
- `index.ts` is a trimmed entry (no browser build, no base-font catalog, no ruby simulator).
- `node.ts` is unchanged and supplies Brotli plus the hb-subset loader.
- `plan.ts`, `outline.ts`, and `build.ts` accept `placement: 'replace'`. That mode draws the reading on the baseline at each Hangul syllable's own advance and does not raise the ascender. `ruby` is unchanged.

Do not edit the drawing code to change which word gets which reading. That belongs in `src/`.
