import { isHangulSyllable, revertInitialSoundLaw } from './hangul.ts'

/**
 * Unihan kHangul citation, as packed by the seonbi data file.
 * A leading 0 is KS X 1001, 1 is KS X 1002, and anything else is outside those sets.
 * E is 교육용 한자, N is 인명용. A smaller citation wins: standard sets before
 * others, and a reading with fewer purpose marks before a more specialised one.
 */
function citationKey(code: string): [number, number[]] {
  let index = 0
  let charset = 2
  if (code.startsWith('0') || code.startsWith('1')) {
    charset = Number(code[0])
    index = 1
  }
  const purposes: number[] = []
  for (; index < code.length; index++) {
    const mark = code[index]
    purposes.push(mark === 'E' ? 0 : mark === 'N' ? 1 : 2)
  }
  purposes.sort((a, b) => a - b)
  return [charset, purposes]
}

function compareCitation(a: [number, number[]], b: [number, number[]]): number {
  if (a[0] !== b[0])
    return a[0] - b[0]
  const left = a[1]
  const right = b[1]
  const count = Math.min(left.length, right.length)
  for (let i = 0; i < count; i++) {
    if (left[i] !== right[i])
      return left[i]! - right[i]!
  }
  return left.length - right.length
}

/**
 * The syllable to use before 두음 법칙: the most standard reading in the map,
 * rolled back to its pre-law form when that form is also listed.
 * 女 {여: "0", 녀: "0E"} → 녀. 樂 {낙: "0", 락: "0E", ...} → 락. 冷 {냉: "0", 랭: "0E"} → 랭.
 */
export function underlyingSyllable(readings: Record<string, string>): string | undefined {
  let best: string | undefined
  let bestKey: [number, number[]] | undefined
  for (const [syllable, code] of Object.entries(readings)) {
    if (!isHangulSyllable(syllable))
      continue
    const key = citationKey(code)
    const better = bestKey === undefined
      || compareCitation(key, bestKey) < 0
      || (compareCitation(key, bestKey) === 0 && syllable < best!)
    if (better) {
      best = syllable
      bestKey = key
    }
  }
  if (best === undefined)
    return undefined
  const reverted = revertInitialSoundLaw(best).filter(syllable => syllable in readings).sort()
  return reverted[0] ?? best
}

/** Codepoints with a KS X 1001 citation (`0`…), the web subset's Hanja. */
export function ksx1001Codepoints(table: Record<string, Record<string, string>>): number[] {
  const out: number[] = []
  for (const [char, readings] of Object.entries(table)) {
    if (Object.values(readings).some(code => code.startsWith('0')))
      out.push(char.codePointAt(0)!)
  }
  return out
}

/** Codepoint to its underlying (pre-두음) Hangul syllable. */
export function loadUnderlying(table: Record<string, Record<string, string>>): Map<number, string> {
  const out = new Map<number, string>()
  for (const [char, readings] of Object.entries(table)) {
    const syllable = underlyingSyllable(readings)
    if (syllable === undefined)
      continue
    out.set(char.codePointAt(0)!, syllable)
  }
  return out
}
