import { isHan } from './text.ts'

/** Codepoints for the web subset: non-Hanja from the base, KS X 1001, and extra sample Hanja. */
export function webCodepoints(fontCodepoints: Iterable<number>, ksx1001: Iterable<number>, extra: Iterable<number>): number[] {
  const out = new Set<number>()
  for (const cp of fontCodepoints) {
    if (!isHan(cp))
      out.add(cp)
  }
  for (const cp of ksx1001)
    out.add(cp)
  for (const cp of extra) {
    if (isHan(cp))
      out.add(cp)
  }
  return [...out].sort((a, b) => a - b)
}

/**
 * Every codepoint that uses a glyph one of `codepoints` already uses.
 * Compatibility ideographs and radicals often share a Hanja outline; dropping
 * the alias drops the reading for that character too, because the substitution
 * is attached to the glyph.
 */
export function codepointsSharingGlyph(glyphOf: ReadonlyMap<number, number>, codepoints: Iterable<number>): number[] {
  const wanted = new Set<number>()
  for (const cp of codepoints) {
    const id = glyphOf.get(cp)
    if (id !== undefined)
      wanted.add(id)
  }
  const out = new Set<number>(codepoints)
  for (const [cp, id] of glyphOf) {
    if (wanted.has(id))
      out.add(cp)
  }
  return [...out].sort((a, b) => a - b)
}

/** Hangul syllables a plan draws. The base font must contain each of them. */
export function hangulSyllables(glyphs: readonly { ruby: readonly { text: string }[] }[]): number[] {
  const out = new Set<number>()
  for (const glyph of glyphs) {
    for (const part of glyph.ruby) {
      for (const char of part.text) {
        const cp = char.codePointAt(0)!
        if (cp >= 0xAC00 && cp <= 0xD7A3)
          out.add(cp)
      }
    }
  }
  return [...out].sort((a, b) => a - b)
}

/** CSS `unicode-range` for exactly these codepoints, as inclusive ranges. */
export function formatUnicodeRange(codepoints: Iterable<number>): string {
  const sorted = [...new Set(codepoints)].sort((a, b) => a - b)
  if (!sorted.length)
    return ''
  const parts: string[] = []
  let start = sorted[0]!
  let prev = start
  const hex = (cp: number): string => cp.toString(16).toUpperCase()
  const flush = (): void => {
    parts.push(start === prev ? `U+${hex(start)}` : `U+${hex(start)}-${hex(prev)}`)
  }
  for (const cp of sorted.slice(1)) {
    if (cp === prev + 1) {
      prev = cp
      continue
    }
    flush()
    start = prev = cp
  }
  flush()
  return parts.join(', ')
}
