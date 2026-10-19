import type { Plan } from '../vendor/furifont/plan.ts'
import { allowsRyeolSoftening, applyInitialSoundLaw, isRyeolRyul } from './hangul.ts'
import { GLYPH_LIMIT, GLYPH_MARGIN, selectLigatures, type Reader, type WordEntry } from './select.ts'
import { codePoints, isHan, segment, uniName } from './text.ts'

const RUBY_METRICS = {
  rubyScale: 0.68,
  rubyGap: 0.02,
  compressionFloor: 0.6,
  maxRubyWidth: 1.6,
} as const

/** `ruby` draws the reading above the Hanja. `replace` sets the reading in its place. */
export type FamilyStyle = 'ruby' | 'replace'

const FAMILIES: Record<FamilyStyle, { family: string, description: string, placement: FamilyStyle, metrics: Plan['metrics'] }> = {
  ruby: {
    family: 'Gukhanmun Sans',
    description: 'Hangul readings above Hanja. Outlines from Adobe Source Han Sans KR; the reserved name Source is not a name of this font. Word readings: 표준국어대사전 (Standard Korean Language Dictionary), 국립국어원, CC BY-SA 2.0 KR, via 선비 (seonbi). ko-KP word readings are 우리말샘, 국립국어원, CC BY-SA 2.0 KR. Character readings: Unicode Unihan kHangul.',
    placement: 'ruby',
    metrics: RUBY_METRICS,
  },
  replace: {
    family: 'Gukhanmun Hangul',
    description: 'Hanja replaced by Hangul readings, each syllable at its own advance. Outlines from Adobe Source Han Sans KR; the reserved name Source is not a name of this font. Word readings: 표준국어대사전 (Standard Korean Language Dictionary), 국립국어원, CC BY-SA 2.0 KR, via 선비 (seonbi). ko-KP word readings are 우리말샘, 국립국어원, CC BY-SA 2.0 KR. Character readings: Unicode Unihan kHangul.',
    placement: 'replace',
    metrics: { rubyScale: 1, rubyGap: 0, compressionFloor: 1, maxRubyWidth: 1 },
  },
}

export interface BuildInput {
  underlying: Map<number, string>
  entries: WordEntry[]
  /** Codepoints the base font can draw. */
  coverage: Set<number>
  baseGlyphCount: number
  /**
   * Base-font glyph id of a codepoint. Compatibility ideographs and radicals
   * often share an outline with a unified Hanja; one outline can take one
   * substitution. Omitted in tests, where every codepoint is its own glyph.
   */
  glyphOf?: ReadonlyMap<number, number>
  /**
   * South Korean 두음 법칙. Default on. ko-KP passes false: no word-initial
   * alternate and no 렬/률 softening, so those glyphs are not built.
   */
  initialSoundLaw?: boolean
}

export interface BuildReport {
  baseGlyphs: number
  characterGlyphs: number
  initialGlyphs: number
  wordLigatures: number
  probeGlyph: number
  totalGlyphs: number
  glyphLimit: number
  glyphMargin: number
  ligatureBudget: number
  eligibleWords: number
  missingGlyph: number
  emptyReading: number
  droppedForBudget: number
  hanjaWithReading: number
  /** Dictionary ligatures that share an outline with one already emitted. */
  collapsedLigatures: number
  initialSoundLaw: boolean
}

interface CharGlyph {
  cp: number
  medial: string
  initial: string
  medialName: string
  initialName: string
  dual: boolean
  ryeol: boolean
  open: boolean
}

interface WordGlyph {
  hanja: string
  reading: string
  name: string
  open: boolean
}

function hex(cp: number): string {
  return cp.toString(16).toUpperCase()
}

function rubyOf(reading: string, bases: number): { start: number, end: number, text: string }[] {
  const syllables = [...reading]
  if (syllables.length === bases)
    return syllables.map((text, index) => ({ start: index, end: index + 1, text }))
  return [{ start: 0, end: bases, text: reading }]
}

function lookup(name: string, lines: string[]): string {
  if (!lines.length)
    return ''
  return `lookup ${name} useExtension {\n${lines.map(line => `  ${line}`).join('\n')}\n} ${name};\n`
}

function feature(tag: string, names: string[]): string {
  if (!names.length)
    return ''
  return `feature ${tag} {\n${names.map(name => `  lookup ${name};`).join('\n')}\n} ${tag};\n`
}

function glyphClass(name: string, glyphs: Iterable<string>): string {
  const list = [...new Set(glyphs)].sort()
  if (!list.length)
    return ''
  return `@${name} = [${list.join(' ')}];\n`
}

interface Piece {
  name: string
  upgrade?: string
  ryeol: boolean
  open: boolean
  han: boolean
}

/**
 * Glyph names HarfBuzz should produce. Mirrors the feature file: longest word,
 * then each remaining Hanja's medial reading, then 두음 법칙 where the run asks for it.
 */
export function shapeGlyphs(
  text: string,
  chars: Map<number, CharGlyph>,
  words: Map<string, WordGlyph>,
  baseOf: (cp: number) => number = cp => cp,
): string[] {
  const pieces: Piece[] = []
  for (const part of segment(text)) {
    if (!part.han) {
      for (const char of part.text)
        pieces.push({ name: uniName(char.codePointAt(0)!), ryeol: false, open: false, han: false })
      continue
    }
    const run = part.chars
    let cursor = 0
    while (cursor < run.length) {
      let matched: WordGlyph | undefined
      let matchedLength = 0
      for (let length = run.length - cursor; length >= 2; length--) {
        const slice = run.slice(cursor, cursor + length)
        const key = slice.map(char => baseOf(char.codePointAt(0)!)).join(',')
        const word = words.get(key)
        if (word) {
          matched = word
          matchedLength = length
          break
        }
      }
      if (matched) {
        pieces.push({ name: matched.name, ryeol: false, open: matched.open, han: true })
        cursor += matchedLength
        continue
      }
      const char = chars.get(run[cursor]!.codePointAt(0)!)
      if (!char) {
        pieces.push({ name: uniName(run[cursor]!.codePointAt(0)!), ryeol: false, open: false, han: true })
      }
      else {
        pieces.push({
          name: char.medialName,
          upgrade: char.dual ? char.initialName : undefined,
          ryeol: char.ryeol,
          open: char.open,
          han: true,
        })
      }
      cursor++
    }
  }

  let previous: Piece | undefined
  for (const piece of pieces) {
    if (piece.upgrade && (piece.ryeol && previous?.open || !previous?.han))
      piece.name = piece.upgrade
    previous = piece
  }
  return pieces.map(piece => piece.name)
}

/** Prefer a unified ideograph over a radical or a compatibility ideograph that draws the same outline. */
function outlineRank(cp: number): [number, number, number] {
  const radical = (cp >= 0x2E80 && cp <= 0x2FDF) ? 1 : 0
  const compat = (cp >= 0xF900 && cp <= 0xFAFF) || (cp >= 0x2F800 && cp <= 0x2FA1F) ? 1 : 0
  return [radical, compat, cp]
}

function rankBefore(a: [number, number, number], b: [number, number, number]): boolean {
  return a[0] !== b[0] ? a[0] < b[0] : a[1] !== b[1] ? a[1] < b[1] : a[2] < b[2]
}

export interface ReadingPlan {
  reader: Reader
  report: BuildReport
  shape: (text: string) => string[]
  glyphs: Plan['glyphs']
  codepoints: number[]
  fea: string
  smoke: Plan['smoke']
}

/**
 * One reading plan for every family. Ligatures, fallback glyphs, and the
 * OpenType rules do not depend on whether the reading is drawn above or instead.
 */
export function planReadings(input: BuildInput): ReadingPlan {
  const law = input.initialSoundLaw !== false
  const baseOf = (cp: number): number => input.glyphOf?.get(cp) ?? cp
  const groups = new Map<number, number[]>()
  for (const cp of input.underlying.keys()) {
    if (!input.coverage.has(cp))
      continue
    const id = baseOf(cp)
    const list = groups.get(id)
    if (list)
      list.push(cp)
    else
      groups.set(id, [cp])
  }

  const charList: CharGlyph[] = []
  const chars = new Map<number, CharGlyph>()
  const readingBases = new Set<number>()
  for (const [id, cps] of groups) {
    let cp = cps[0]!
    for (const other of cps) {
      if (rankBefore(outlineRank(other), outlineRank(cp)))
        cp = other
    }
    const medial = input.underlying.get(cp) ?? input.underlying.get(cps.find(item => input.underlying.has(item))!)!
    const initial = law ? applyInitialSoundLaw(medial) : medial
    const dual = initial !== medial
    const glyph: CharGlyph = {
      cp,
      medial,
      initial,
      medialName: `gkc${hex(cp)}`,
      initialName: dual ? `gki${hex(cp)}` : `gkc${hex(cp)}`,
      dual,
      ryeol: law && isRyeolRyul(medial),
      open: allowsRyeolSoftening(medial),
    }
    charList.push(glyph)
    readingBases.add(id)
    for (const alias of cps)
      chars.set(alias, glyph)
  }
  charList.sort((a, b) => a.cp - b.cp)

  const probe = 1
  const reserved = input.baseGlyphCount + charList.length + charList.filter(char => char.dual).length + probe
  if (reserved > GLYPH_LIMIT)
    throw new Error(`character readings alone need ${reserved} glyphs, past ${GLYPH_LIMIT}`)
  const ligatureBudget = Math.max(0, GLYPH_LIMIT - GLYPH_MARGIN - reserved)
  const reader = selectLigatures(input.entries, input.underlying, input.coverage, ligatureBudget, law)

  const representative = new Map<number, number>()
  for (const glyph of charList)
    representative.set(baseOf(glyph.cp), glyph.cp)
  const spellingScore = (hanja: string): number => {
    let score = 0
    for (const char of hanja) {
      const cp = char.codePointAt(0)!
      if (representative.get(baseOf(cp)) === cp)
        score++
    }
    return score
  }

  const bySequence = new Map<string, WordGlyph & { score: number }>()
  let collapsedLigatures = 0
  for (const [hanja, reading] of reader.words) {
    const key = [...hanja].map(char => baseOf(char.codePointAt(0)!)).join(',')
    const score = spellingScore(hanja)
    const existing = bySequence.get(key)
    if (existing) {
      collapsedLigatures++
      if (score <= existing.score)
        continue
    }
    const last = [...reading].at(-1)!
    bySequence.set(key, { hanja, reading, name: '', open: allowsRyeolSoftening(last), score })
  }
  const wordList: WordGlyph[] = [...bySequence.values()]
    .sort((a, b) => a.hanja < b.hanja ? -1 : a.hanja > b.hanja ? 1 : 0)
    .map((word, index) => ({ ...word, name: `gkw${String(index).padStart(5, '0')}` }))
  const words = new Map<string, WordGlyph>()
  for (const word of wordList)
    words.set([...word.hanja].map(char => baseOf(char.codePointAt(0)!)).join(','), word)
  const shape = (text: string): string[] => shapeGlyphs(text, chars, words, baseOf)

  const glyphs: Plan['glyphs'] = []
  for (const char of charList) {
    glyphs.push({
      name: char.medialName,
      bases: [char.cp],
      ruby: [{ start: 0, end: 1, text: char.medial }],
    })
    if (char.dual) {
      glyphs.push({
        name: char.initialName,
        bases: [char.cp],
        ruby: [{ start: 0, end: 1, text: char.initial }],
      })
    }
  }
  for (const word of wordList) {
    const bases = codePoints(word.hanja)
    glyphs.push({ name: word.name, bases, ruby: rubyOf(word.reading, bases.length) })
  }

  const codepoints = [...new Set(glyphs.flatMap(glyph => glyph.bases))].sort((a, b) => a - b)
  const open = [
    ...charList.filter(char => char.open).flatMap(char => char.dual ? [char.medialName, char.initialName] : [char.medialName]),
    ...wordList.filter(word => word.open).map(word => word.name),
  ]
  const ryeol = charList.filter(char => char.ryeol).map(char => char.medialName)
  const dueum = charList.filter(char => char.dual).map(char => char.medialName)
  const hanctx = [
    ...charList.flatMap(char => char.dual ? [char.medialName, char.initialName] : [char.medialName]),
    ...wordList.map(word => word.name),
  ]
  const bareSeen = new Set<number>()
  for (const cp of input.coverage) {
    if (!isHan(cp))
      continue
    const id = baseOf(cp)
    if (readingBases.has(id) || bareSeen.has(id))
      continue
    bareSeen.add(id)
    hanctx.push(uniName(cp))
  }

  const liga = wordList.map(word => `sub ${codePoints(word.hanja).map(uniName).join(' ')} by ${word.name};`)
  const medial = charList.map(char => `sub ${uniName(char.cp)} by ${char.medialName};`)
  const surface = charList.filter(char => char.dual).map(char => `sub ${char.medialName} by ${char.initialName};`)
  const adjust = [
    ryeol.length && open.length ? `sub @open @ryeol' lookup surface;` : '',
    dueum.length ? `ignore sub @hanctx @dueum';` : '',
    dueum.length ? `sub @dueum' lookup surface;` : '',
  ].filter(line => line.length > 0)
  const rubyOff = [
    ...charList.map(char => `sub ${char.medialName} by ${uniName(char.cp)};`),
    ...charList.filter(char => char.dual).map(char => `sub ${char.initialName} by ${uniName(char.cp)};`),
  ]
  const rubyOffLiga = wordList.map(word => `sub ${word.name} by ${codePoints(word.hanja).map(uniName).join(' ')};`)

  const featureLookups = [
    liga.length ? 'words' : '',
    medial.length ? 'medial' : '',
    adjust.length ? 'adjust' : '',
  ].filter(name => name.length > 0)
  const offLookups = [
    rubyOff.length ? 'ruby_off' : '',
    rubyOffLiga.length ? 'ruby_off_liga' : '',
  ].filter(name => name.length > 0)

  const fea = [
    'languagesystem DFLT dflt;\n',
    glyphClass('open', open),
    glyphClass('ryeol', ryeol),
    glyphClass('dueum', dueum),
    glyphClass('hanctx', hanctx),
    lookup('words', liga),
    lookup('medial', medial),
    lookup('surface', surface),
    lookup('adjust', adjust),
    lookup('ruby_off', rubyOff),
    lookup('ruby_off_liga', rubyOffLiga),
    feature('rclt', featureLookups),
    feature('ss01', offLookups),
  ].filter(Boolean).join('\n')

  // Smoke strings are Han runs only. The base font's own lookups substitute
  // Hangul, spaces and punctuation, so a mixed string does not come back as
  // the nominal cmap glyphs. The Hanja portion is what this font adds.
  const smokeTexts = [
    '國漢文混用', '大韓民國', '女子', '男女', '音樂', '快樂', '平壤', '冷麵',
    '困難', '六月', '十月', '五六', '法律', '比率', '規律', '利率', '分裂',
    '來日', '未來', '漢字', '憲法', '問題',
  ]
  const smoke = smokeTexts.map(text => ({ text, glyphs: shape(text) }))
  const initialGlyphs = charList.filter(char => char.dual).length
  const report: BuildReport = {
    baseGlyphs: input.baseGlyphCount,
    characterGlyphs: charList.length,
    initialGlyphs,
    wordLigatures: wordList.length,
    probeGlyph: probe,
    totalGlyphs: reserved + wordList.length,
    glyphLimit: GLYPH_LIMIT,
    glyphMargin: GLYPH_MARGIN,
    ligatureBudget,
    eligibleWords: reader.stats.eligible,
    missingGlyph: reader.stats.missingGlyph,
    emptyReading: reader.stats.emptyReading,
    droppedForBudget: reader.stats.droppedForBudget,
    hanjaWithReading: charList.length,
    collapsedLigatures,
    initialSoundLaw: law,
  }

  return { reader, report, shape, glyphs, codepoints, fea, smoke }
}

/** The same readings, drawn either as ruby or as a Hangul replacement. */
export function emitFamily(
  planned: ReadingPlan,
  style: FamilyStyle = 'ruby',
  names?: { family: string, description: string },
): { plan: Plan, reader: Reader, report: BuildReport, shape: (text: string) => string[] } {
  const family = FAMILIES[style]
  const plan: Plan = {
    version: 1,
    names: names ?? { family: family.family, description: family.description },
    placement: family.placement,
    metrics: { ...family.metrics },
    codepoints: planned.codepoints,
    variants: [],
    glyphs: planned.glyphs,
    fea: planned.fea,
    smoke: planned.smoke,
  }
  return { plan, reader: planned.reader, report: planned.report, shape: planned.shape }
}

export function buildPlan(input: BuildInput, style: FamilyStyle = 'ruby'): { plan: Plan, reader: Reader, report: BuildReport, shape: (text: string) => string[] } {
  return emitFamily(planReadings(input), style)
}
