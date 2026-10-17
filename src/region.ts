import { allowsRyeolSoftening, applyInitialSoundLaw, isRyeolRyul } from './hangul.ts'
import { hangulOnly, isHan } from './text.ts'
import type { WordEntry } from './select.ts'

export type Region = 'ko-KR' | 'ko-KP'

/**
 * South Korean headwords. The file has no header. A repeated headword keeps
 * the first row; the published table has none.
 */
export function loadSouthKorean(tsv: string): WordEntry[] {
  return loadRows(tsv, false)
}

/**
 * 우리말샘 북한어 rows: `hanja`, `hangul`, `require_hanja`, `require_hangul`.
 * The header is skipped. The first row wins. `require_*` is not a reading rule:
 * a headword is always eligible, and the font does not refuse to substitute.
 */
export function loadNorthKorean(tsv: string): WordEntry[] {
  return loadRows(tsv, true)
}

function loadRows(tsv: string, header: boolean): WordEntry[] {
  const entries: WordEntry[] = []
  const seen = new Set<string>()
  let index = 0
  for (const line of tsv.split('\n')) {
    const row = line.endsWith('\r') ? line.slice(0, -1) : line
    index++
    if (!row)
      continue
    if (header && index === 1 && row.startsWith('hanja\t'))
      continue
    const tab = row.indexOf('\t')
    if (tab < 0)
      continue
    const hanja = row.slice(0, tab)
    const hangul = row.slice(tab + 1).split('\t')[0] ?? ''
    if (seen.has(hanja))
      continue
    seen.add(hanja)
    entries.push({ hanja, reading: hangul })
  }
  return entries
}

/**
 * Undo South Korean 두음 법칙 where the dictionary syllable is exactly the
 * underlying syllable or the law applied to it. A real alternate (音樂의 악,
 * 六月의 유, 十月의 시) stays. The syllable before 렬/률 is the South Korean
 * one, so 分裂 (분, which ends in ㄴ) undoes 열 back to 렬, and 法律 (법) does not.
 * A reading whose Hangul count differs from the Hanja count (上海 상하이) is
 * kept whole.
 */
export function undoDueum(hanja: string, reading: string, underlying: ReadonlyMap<number, string>): string {
  const hangul = hangulOnly(reading)
  const chars = [...hanja]
  const syllables = [...hangul]
  if (syllables.length !== chars.length)
    return hangul
  let out = ''
  let previous: string | undefined
  for (let i = 0; i < chars.length; i++) {
    const syllable = syllables[i]!
    const source = underlying.get(chars[i]!.codePointAt(0)!)
    if (source === undefined) {
      out += syllable
      previous = syllable
      continue
    }
    const atStart = i === 0
    const soften = isRyeolRyul(source) && previous !== undefined && allowsRyeolSoftening(previous)
    const lawForm = atStart || soften ? applyInitialSoundLaw(source) : source
    out += syllable === source || syllable === lawForm ? source : syllable
    previous = syllable
  }
  return out
}

/**
 * A one-character 우리말샘 reading replaces the Unihan syllable for ko-KP.
 * The font has one glyph per character, and eleven of those readings differ
 * (娘 랑, 綠 녹, …). Word entries are still undone against Unihan, so a
 * multi-character headword keeps its own reading and becomes a ligature when
 * this override would misread it.
 */
export function applyCharacterOverrides(underlying: ReadonlyMap<number, string>, north: readonly WordEntry[]): Map<number, string> {
  const out = new Map(underlying)
  for (const entry of north) {
    const chars = [...entry.hanja]
    if (chars.length !== 1)
      continue
    const code = chars[0]!.codePointAt(0)!
    if (!isHan(code))
      continue
    const reading = hangulOnly(entry.reading)
    if ([...reading].length !== 1)
      continue
    out.set(code, reading)
  }
  return out
}

/**
 * ko-KR is the standard-dictionary table. ko-KP prefers a 우리말샘 북한어
 * headword and otherwise undoes 두음 법칙 on the South Korean reading.
 */
export function entriesForRegion(
  south: readonly WordEntry[],
  north: readonly WordEntry[],
  underlying: ReadonlyMap<number, string>,
  region: Region,
): WordEntry[] {
  if (region === 'ko-KR')
    return south.map(entry => ({ hanja: entry.hanja, reading: entry.reading }))
  const out: WordEntry[] = []
  const seen = new Set<string>()
  for (const entry of north) {
    if (seen.has(entry.hanja))
      continue
    const reading = hangulOnly(entry.reading)
    if (!reading)
      continue
    seen.add(entry.hanja)
    out.push({ hanja: entry.hanja, reading })
  }
  for (const entry of south) {
    if (seen.has(entry.hanja))
      continue
    const reading = undoDueum(entry.hanja, entry.reading, underlying)
    if (!reading)
      continue
    seen.add(entry.hanja)
    out.push({ hanja: entry.hanja, reading })
  }
  return out
}
