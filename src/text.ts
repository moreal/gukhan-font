/** Hangul syllables only, in order. Spaces and punctuation in a dictionary reading are dropped. */
export function hangulOnly(text: string): string {
  let out = ''
  for (const char of text) {
    const cp = char.codePointAt(0)!
    if (cp >= 0xAC00 && cp <= 0xD7A3)
      out += char
  }
  return out
}

export function codePoints(text: string): number[] {
  return [...text].map(char => char.codePointAt(0)!)
}

/**
 * Unicode Han script, the runs a browser hands a font. Hangul is a different
 * script, so a rule never sees the syllable after a Hanja character.
 */
export function isHan(cp: number): boolean {
  return cp === 0x3007
    || (cp >= 0x3400 && cp <= 0x4DBF)
    || (cp >= 0x4E00 && cp <= 0x9FFF)
    || (cp >= 0xF900 && cp <= 0xFAFF)
    || (cp >= 0x20000 && cp <= 0x2A6DF)
    || (cp >= 0x2A700 && cp <= 0x2B73F)
    || (cp >= 0x2B740 && cp <= 0x2B81F)
    || (cp >= 0x2B820 && cp <= 0x2CEAF)
    || (cp >= 0x2CEB0 && cp <= 0x2EBEF)
    || (cp >= 0x2F800 && cp <= 0x2FA1F)
    || (cp >= 0x30000 && cp <= 0x323AF)
}

/** OpenType glyph name the furifont compiler uses for a base character. */
export function uniName(cp: number): string {
  const hex = cp.toString(16).toUpperCase()
  return cp > 0xFFFF ? `u${hex}` : `uni${hex.padStart(4, '0')}`
}

export interface HanRun {
  start: number
  chars: string[]
}

/** Split `text` into Han runs and the other characters, in order. */
export function segment(text: string): Array<{ han: false, text: string } | { han: true, chars: string[] }> {
  const chars = [...text]
  const parts: Array<{ han: false, text: string } | { han: true, chars: string[] }> = []
  let index = 0
  while (index < chars.length) {
    const cp = chars[index]!.codePointAt(0)!
    if (!isHan(cp)) {
      let end = index + 1
      while (end < chars.length && !isHan(chars[end]!.codePointAt(0)!))
        end++
      parts.push({ han: false, text: chars.slice(index, end).join('') })
      index = end
      continue
    }
    let end = index + 1
    while (end < chars.length && isHan(chars[end]!.codePointAt(0)!))
      end++
    parts.push({ han: true, chars: chars.slice(index, end) })
    index = end
  }
  return parts
}
