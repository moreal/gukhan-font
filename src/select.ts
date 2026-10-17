import { allowsRyeolSoftening, applyInitialSoundLaw, isRyeolRyul } from './hangul.ts'
import { hangulOnly, isHan } from './text.ts'

/** OpenType's glyph ceiling. The compiler refuses to pass it; the probe glyph takes one id. */
export const GLYPH_LIMIT = 65535
/** Ids left unused so the version probe and a small overrun still fit. */
export const GLYPH_MARGIN = 64

export interface SelectionStats {
  /** Dictionary rows whose Hanja are all in the base font and whose reading has Hangul. */
  eligible: number
  /** Rows skipped because a character is not in the base font. */
  missingGlyph: number
  /** Rows skipped because the reading has no Hangul syllable. */
  emptyReading: number
  /** Words that became ligatures. */
  ligatures: number
  /** Words the fallback misreads that did not fit in the glyph budget. */
  droppedForBudget: number
}

interface Trie {
  next: Map<string, Trie>
  reading?: string
}

function emptyTrie(): Trie {
  return { next: new Map() }
}

function insert(trie: Trie, word: string, reading: string): void {
  let node = trie
  for (const char of word) {
    let child = node.next.get(char)
    if (child === undefined) {
      child = emptyTrie()
      node.next.set(char, child)
    }
    node = child
  }
  node.reading = reading
}

/** Longest dictionary word at `chars[index]`, two Hanja or more. */
function longest(trie: Trie, chars: string[], index: number): { reading: string, length: number } | undefined {
  let node = trie
  let best: { reading: string, length: number } | undefined
  for (let cursor = index; cursor < chars.length; cursor++) {
    const child = node.next.get(chars[cursor]!)
    if (child === undefined)
      break
    node = child
    const length = cursor - index + 1
    if (node.reading !== undefined && length >= 2)
      best = { reading: node.reading, length }
  }
  return best
}

export interface Reader {
  /** Hangul reading of `text`. Non-Han characters are copied through. */
  read(text: string): string
  readonly words: ReadonlyMap<string, string>
  readonly stats: SelectionStats
}

export interface FallbackOptions {
  /** South Korean 두음 법칙. Off, the underlying Unihan syllable is kept (평양 랭면). */
  initialSoundLaw: boolean
}

/**
 * One Hanja's Hangul when no dictionary word claims it.
 * Word-initial syllables take 두음 법칙. 렬/률 later in the run soften to 열/율
 * after a vowel or ㄴ, which is the other half of the same orthography rule.
 */
export function fallbackSyllable(
  cp: number,
  underlying: ReadonlyMap<number, string>,
  options: FallbackOptions & { atStart: boolean, previous: string | undefined },
): string | undefined {
  const syllable = underlying.get(cp)
  if (syllable === undefined)
    return undefined
  if (!options.initialSoundLaw)
    return syllable
  if (options.atStart)
    return applyInitialSoundLaw(syllable)
  if (isRyeolRyul(syllable) && options.previous !== undefined && allowsRyeolSoftening(options.previous))
    return applyInitialSoundLaw(syllable)
  return syllable
}

function readRun(chars: string[], trie: Trie, underlying: ReadonlyMap<number, string>, law: boolean): string {
  let out = ''
  let index = 0
  while (index < chars.length) {
    const match = longest(trie, chars, index)
    if (match) {
      out += match.reading
      index += match.length
      continue
    }
    const cp = chars[index]!.codePointAt(0)!
    const previous = out ? [...out].at(-1) : undefined
    const syllable = fallbackSyllable(cp, underlying, {
      initialSoundLaw: law,
      atStart: index === 0,
      previous: previous && previous.codePointAt(0)! >= 0xAC00 ? previous : undefined,
    })
    out += syllable ?? chars[index]!
    index++
  }
  return out
}

/** Read `text` with an explicit word map. An empty map is the per-character fallback alone. */
export function readWithDictionary(
  text: string,
  words: ReadonlyMap<string, string>,
  underlying: ReadonlyMap<number, string>,
  initialSoundLaw: boolean,
): string {
  const trie = emptyTrie()
  for (const [word, reading] of words)
    insert(trie, word, reading)
  return readText(text, trie, underlying, initialSoundLaw)
}

export function readText(
  text: string,
  trie: Trie,
  underlying: ReadonlyMap<number, string>,
  initialSoundLaw: boolean,
): string {
  let out = ''
  let run: string[] = []
  const flush = (): void => {
    if (run.length) {
      out += readRun(run, trie, underlying, initialSoundLaw)
      run = []
    }
  }
  for (const char of text) {
    if (isHan(char.codePointAt(0)!)) {
      run.push(char)
      continue
    }
    flush()
    out += char
  }
  flush()
  return out
}

export interface WordEntry {
  hanja: string
  reading: string
}

/**
 * Ligatures for dictionary words the per-character fallback would misread.
 * Shorter words are decided first, so a longer word is kept only when those
 * shorter ligatures still do not spell its reading. Longest-match in the font
 * then prefers the longer word, and every kept headword reads as the dictionary says.
 */
export function selectLigatures(
  entries: Iterable<WordEntry>,
  underlying: ReadonlyMap<number, string>,
  coverage: ReadonlySet<number>,
  ligatureBudget: number,
  initialSoundLaw = true,
): Reader {
  const eligible: WordEntry[] = []
  let missingGlyph = 0
  let emptyReading = 0
  for (const entry of entries) {
    const chars = [...entry.hanja]
    if (chars.length < 2)
      continue
    // A non-Han character (ㄷ型鋼) is not a Han run the font can ligate. Counting
    // it as missing would spend nothing, but it must not become a ligature via
    // a Hangul syllable that happens to be in the font.
    if (chars.some(char => !isHan(char.codePointAt(0)!)))
      continue
    if (chars.some(char => !coverage.has(char.codePointAt(0)!))) {
      missingGlyph++
      continue
    }
    const reading = hangulOnly(entry.reading)
    if (!reading) {
      emptyReading++
      continue
    }
    eligible.push({ hanja: entry.hanja, reading })
  }
  eligible.sort((a, b) => {
    const length = [...a.hanja].length - [...b.hanja].length
    if (length !== 0)
      return length
    return a.hanja < b.hanja ? -1 : a.hanja > b.hanja ? 1 : 0
  })

  const words = new Map<string, string>()
  const trie = emptyTrie()
  let droppedForBudget = 0
  for (const entry of eligible) {
    const got = readRun([...entry.hanja], trie, underlying, initialSoundLaw)
    if (got === entry.reading)
      continue
    if (words.size >= ligatureBudget) {
      droppedForBudget++
      continue
    }
    words.set(entry.hanja, entry.reading)
    insert(trie, entry.hanja, entry.reading)
  }

  return {
    words,
    stats: {
      eligible: eligible.length,
      missingGlyph,
      emptyReading,
      ligatures: words.size,
      droppedForBudget,
    },
    read: text => readText(text, trie, underlying, initialSoundLaw),
  }
}
