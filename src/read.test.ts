import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { buildPlan } from './emit.ts'
import { applyInitialSoundLaw, revertInitialSoundLaw } from './hangul.ts'
import { loadUnderlying, underlyingSyllable } from './readings.ts'
import { SAMPLES } from './samples.ts'
import { readWithDictionary, selectLigatures, type WordEntry } from './select.ts'
import { hangulOnly } from './text.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('initial sound law rewrites only the syllables in the orthography table', () => {
  assert.equal(applyInitialSoundLaw('녀'), '여')
  assert.equal(applyInitialSoundLaw('랭'), '냉')
  assert.equal(applyInitialSoundLaw('래'), '내')
  assert.equal(applyInitialSoundLaw('륙'), '육')
  assert.equal(applyInitialSoundLaw('률'), '율')
  assert.equal(applyInitialSoundLaw('렬'), '열')
  assert.equal(applyInitialSoundLaw('라'), '나')
  assert.equal(applyInitialSoundLaw('가'), '가')
  assert.equal(applyInitialSoundLaw('한'), '한')
  assert.deepEqual(revertInitialSoundLaw('여').sort(), ['녀', '려'])
  assert.deepEqual(revertInitialSoundLaw('냉'), ['랭'])
  assert.deepEqual(revertInitialSoundLaw('가'), [])
})

test('underlying readings undo the law when both forms are listed', () => {
  assert.equal(underlyingSyllable({ 녀: '0E', 여: '0' }), '녀')
  assert.equal(underlyingSyllable({ 냉: '0', 랭: '0E' }), '랭')
  assert.equal(underlyingSyllable({ 륙: '0E', 육: '0' }), '륙')
  assert.equal(underlyingSyllable({ 락: '0E', 낙: '0', 악: '0N', 요: '0N' }), '락')
  assert.equal(underlyingSyllable({ 률: '0E', 솔: '0N', 율: '0' }), '률')
  assert.equal(underlyingSyllable({ 래: '0E', 내: '0' }), '래')
  assert.equal(underlyingSyllable({ 저: 'X' }), '저')
})

test('dictionary readings, 두음 법칙, and ligatures', () => {
  const table = JSON.parse(readFileSync(join(root, 'data', 'khangul.json'), 'utf8')) as Record<string, Record<string, string>>
  const underlying = loadUnderlying(table)
  const entries: WordEntry[] = []
  const coverage = new Set<number>(underlying.keys())
  for (const line of readFileSync(join(root, 'data', 'ko-kr-stdict.tsv'), 'utf8').split('\n')) {
    const row = line.endsWith('\r') ? line.slice(0, -1) : line
    if (!row)
      continue
    const tab = row.indexOf('\t')
    const hanja = row.slice(0, tab)
    const reading = row.slice(tab + 1)
    entries.push({ hanja, reading })
    for (const char of hanja)
      coverage.add(char.codePointAt(0)!)
  }

  assert.equal(underlying.get('女'.codePointAt(0)!), '녀')
  assert.equal(underlying.get('樂'.codePointAt(0)!), '락')
  assert.equal(underlying.get('六'.codePointAt(0)!), '륙')
  assert.equal(readWithDictionary('平壤 冷麵', new Map(), underlying, false), '평양 랭면')
  assert.equal(readWithDictionary('平壤 冷麵', new Map(), underlying, true), '평양 냉면')
  assert.equal(readWithDictionary('女子', new Map(), underlying, true), '여자')
  assert.equal(readWithDictionary('男女', new Map(), underlying, true), '남녀')
  assert.equal(readWithDictionary('六月', new Map(), underlying, true), '육월')

  const { reader, shape, report } = buildPlan({ underlying, entries, coverage, baseGlyphCount: 0 })
  assert.equal(report.droppedForBudget, 0)
  assert.ok(report.wordLigatures > 5000)
  assert.ok(reader.words.has('音樂'))
  assert.ok(reader.words.has('困難'))
  assert.ok(reader.words.has('六月'))
  assert.ok(reader.words.has('十月'))
  assert.equal(reader.words.has('女子'), false)
  assert.equal(reader.words.has('男女'), false)
  assert.equal(reader.words.has('五六'), false)
  assert.equal(reader.words.has('快樂'), false)

  for (const sample of SAMPLES)
    assert.equal(reader.read(sample.text), sample.reading, sample.text)

  assert.equal(shape('女子')[0], 'gki5973')
  assert.equal(shape('男女')[1], 'gkc5973')
  assert.equal(shape('音樂').length, 1)
  assert.equal(shape('快樂').length, 2)
  assert.equal(shape('冷')[0], 'gki51B7')
  assert.equal(shape('法律')[1], 'gkc5F8B')
  assert.equal(shape('比率')[1], 'gki7387')
  assert.deepEqual(shape('利率'), ['gki5229', 'gki7387'])
  assert.equal(shape('規律')[1], 'gki5F8B')
  assert.equal(shape('分裂')[1], 'gki88C2')
  assert.equal(shape('六')[0], 'gki516D')
  assert.equal(shape('五六')[1], 'gkc516D')
  assert.equal(shape('六月').length, 1)

  let mismatches = 0
  for (const entry of entries) {
    if ([...entry.hanja].some(char => !coverage.has(char.codePointAt(0)!)))
      continue
    const target = hangulOnly(entry.reading)
    if (!target)
      continue
    if (reader.read(entry.hanja) !== target)
      mismatches++
  }
  assert.equal(mismatches, 0)
})
