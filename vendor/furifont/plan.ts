import * as v from 'valibot'

/**
 * Glyph-id ceiling of an OpenType font. Copied from @furifont/core so the
 * vendored compiler can keep its budget check.
 */
export const GLYPH_LIMIT = 65535

/** Ideographic full stop plus VS1, mapped to a wide empty glyph so a page can read the font revision. */
export const VERSION_PROBE = { base: 0x3002, selector: 0xFE00 } as const

const Codepoint = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(0x10FFFF))

/**
 * The planner/compiler contract from Furifont (MIT). The compiler draws
 * `glyphs` and compiles `fea`; it does not choose readings.
 * In `fea`, base characters are named `uniXXXX` / `uXXXXX` after their codepoint.
 */
export const PlanSchema = v.object({
  version: v.literal(1),
  names: v.object({ family: v.string(), description: v.string() }),
  metrics: v.object({
    rubyScale: v.number(),
    rubyGap: v.number(),
    compressionFloor: v.number(),
    maxRubyWidth: v.number(),
  }),
  /**
   * `ruby` draws the reading above the Hanja. `replace` draws only the Hangul,
   * each syllable at its own advance, and leaves the Hanja out.
   */
  placement: v.optional(v.picklist(['ruby', 'replace']), 'ruby'),
  codepoints: v.array(Codepoint),
  variants: v.array(v.object({
    name: v.pipe(v.string(), v.regex(/^[A-Z_][\w.]{0,62}$/i)),
    base: Codepoint,
    selector: Codepoint,
  })),
  glyphs: v.array(v.object({
    name: v.pipe(v.string(), v.regex(/^[A-Z_][\w.]{0,62}$/i)),
    bases: v.pipe(v.array(Codepoint), v.minLength(1)),
    ruby: v.array(v.object({
      start: v.number(),
      end: v.number(),
      text: v.pipe(v.string(), v.nonEmpty()),
    })),
  })),
  fea: v.string(),
  subset: v.optional(v.array(Codepoint)),
  smoke: v.array(v.object({
    text: v.string(),
    glyphs: v.array(v.string()),
  })),
})

export type Plan = v.InferOutput<typeof PlanSchema>
export type PlanGlyph = Plan['glyphs'][number]
