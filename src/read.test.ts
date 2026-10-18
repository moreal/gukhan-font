import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { displayCodepoints, pagesDistFonts, renderDemo } from './demo.ts'
import { renderLanding } from './landing.ts'
import { renderPlayground } from './playground.ts'
import { githubOrigin, pagesBase, pagesOrigin } from './site.ts'
import { emitFamily, planReadings } from './emit.ts'
import { productName } from './families.ts'
import { applyInitialSoundLaw, revertInitialSoundLaw } from './hangul.ts'
import { ksx1001Codepoints, loadUnderlying, underlyingSyllable } from './readings.ts'
import { applyCharacterOverrides, entriesForRegion, loadNorthKorean, loadSouthKorean, undoDueum } from './region.ts'
import { SAMPLES } from './samples.ts'
import { readWithDictionary, selectLigatures, type WordEntry } from './select.ts'
import { NORTH_KOREAN_SHA256 } from './sources.ts'
import { hangulOnly, isHan } from './text.ts'
import { codepointsSharingGlyph, formatUnicodeRange, webCodepoints } from './web.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('initial sound law rewrites only the syllables in the orthography table', () => {
  assert.equal(applyInitialSoundLaw('녀'), '여')
  assert.equal(applyInitialSoundLaw('랭'), '냉')
  assert.equal(applyInitialSoundLaw('래'), '내')
  assert.equal(applyInitialSoundLaw('륙'), '육')
  assert.equal(applyInitialSoundLaw('률'), '율')
  assert.equal(applyInitialSoundLaw('렬'), '열')
  assert.equal(applyInitialSoundLaw('라'), '나')
  assert.equal(applyInitialSoundLaw('뉴'), '유')
  assert.equal(applyInitialSoundLaw('례'), '예')
  assert.equal(applyInitialSoundLaw('뢰'), '뇌')
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

  const planned = planReadings({ underlying, entries, coverage, baseGlyphCount: 24973 })
  const { reader, shape, report, plan } = emitFamily(planned, 'ruby')
  const hangul = emitFamily(planned, 'replace')
  assert.equal(plan.names.family, 'Gukhanmun Sans')
  assert.equal(plan.placement, 'ruby')
  assert.equal(hangul.plan.names.family, 'Gukhanmun Hangul')
  assert.equal(hangul.plan.placement, 'replace')
  assert.deepEqual(hangul.shape('音樂'), shape('音樂'))
  assert.deepEqual(hangul.shape('女子'), shape('女子'))
  const music = hangul.plan.glyphs.find(glyph => glyph.name === shape('音樂')[0])
  assert.equal(music?.ruby.map(part => part.text).join(''), '음악')
  const byName = new Map(hangul.plan.glyphs.map(glyph => [glyph.name, glyph]))
  assert.equal(byName.get('gkc5973')?.ruby[0]?.text, '녀')
  assert.equal(byName.get('gki5973')?.ruby[0]?.text, '여')
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
  assert.equal(shape('困難').length, 1)

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

  const fea = plan.fea
  const wordsAt = fea.indexOf('lookup words')
  const medialAt = fea.indexOf('lookup medial')
  const adjustAt = fea.indexOf('lookup adjust')
  const rcltAt = fea.indexOf('feature rclt')
  assert.ok(wordsAt !== -1 && wordsAt < medialAt && medialAt < adjustAt && adjustAt < rcltAt)
  const ryeolAt = fea.indexOf("sub @open @ryeol' lookup surface;")
  const ignoreAt = fea.indexOf("ignore sub @hanctx @dueum';")
  const initialAt = fea.indexOf("sub @dueum' lookup surface;")
  assert.ok(ryeolAt !== -1 && ryeolAt < ignoreAt && ignoreAt < initialAt)
  assert.ok(fea.indexOf('lookup ruby_off') < fea.indexOf('feature ss01'))
})

function cp(text: string): number {
  return text.codePointAt(0)!
}

test('undoDueum restores only a syllable that is the underlying reading or its law form', () => {
  const underlying = new Map<number, string>([
    ['音', '음'], ['樂', '락'], ['分', '분'], ['裂', '렬'],
    ['十', '십'], ['月', '월'], ['上', '상'], ['海', '해'],
    ['女', '녀'], ['子', '자'], ['六', '륙'], ['法', '법'], ['律', '률'],
  ].map(([hanja, syllable]) => [cp(hanja), syllable]))
  assert.equal(undoDueum('音樂', '음악', underlying), '음악')
  assert.equal(undoDueum('分裂', '분열', underlying), '분렬')
  assert.equal(undoDueum('十月', '시월', underlying), '시월')
  assert.equal(undoDueum('上海', '상하이', underlying), '상하이')
  assert.equal(undoDueum('女子', '여자', underlying), '녀자')
  assert.equal(undoDueum('六月', '유월', underlying), '유월')
  assert.equal(undoDueum('法律', '법률', underlying), '법률')
})

test('ligature budget drops a word the fallback misreads', () => {
  const underlying = new Map([[cp('音'), '음'], [cp('樂'), '락']])
  const coverage = new Set(underlying.keys())
  const reader = selectLigatures([{ hanja: '音樂', reading: '음악' }], underlying, coverage, 0, true)
  assert.equal(reader.words.size, 0)
  assert.equal(reader.stats.droppedForBudget, 1)
  assert.equal(reader.read('音樂'), '음락')
  assert.equal(reader.stats.eligible, 1)
})

test('a headword with a non-Han character is not a ligature', () => {
  const underlying = new Map([[cp('型'), '형'], [cp('鋼'), '강']])
  const coverage = new Set([cp('ㄷ'), cp('型'), cp('鋼')])
  const reader = selectLigatures([{ hanja: 'ㄷ型鋼', reading: 'ㄷ형강' }], underlying, coverage, 10, true)
  assert.equal(reader.words.size, 0)
  assert.equal(reader.stats.eligible, 0)
  assert.equal(reader.stats.missingGlyph, 0)
})

test('north korean rows skip the header and keep the first duplicate', () => {
  const entries = loadNorthKorean('hanja\thangul\trequire_hanja\trequire_hangul\n女子\t녀자\tfalse\tfalse\n女子\t여자\tfalse\tfalse\n')
  assert.deepEqual(entries, [{ hanja: '女子', reading: '녀자' }])
  const raw = readFileSync(join(root, 'data', 'ko-kp-opendict.tsv'))
  assert.equal(createHash('sha256').update(raw).digest('hex'), NORTH_KOREAN_SHA256)
})

test('ko-KP keeps 우리말샘 readings and does not build 두음 glyphs', () => {
  const table = JSON.parse(readFileSync(join(root, 'data', 'khangul.json'), 'utf8')) as Record<string, Record<string, string>>
  const underlying = loadUnderlying(table)
  const south = loadSouthKorean(readFileSync(join(root, 'data', 'ko-kr-stdict.tsv'), 'utf8'))
  const north = loadNorthKorean(readFileSync(join(root, 'data', 'ko-kp-opendict.tsv'), 'utf8'))
  const entries = entriesForRegion(south, north, underlying, 'ko-KP')
  const kpUnderlying = applyCharacterOverrides(underlying, north)
  assert.equal(kpUnderlying.get(cp('娘')), '랑')
  assert.equal(kpUnderlying.get(cp('綠')), '녹')
  assert.notEqual(underlying.get(cp('娘')), kpUnderlying.get(cp('娘')))
  const coverage = new Set<number>(kpUnderlying.keys())
  for (const entry of entries) {
    for (const char of entry.hanja)
      coverage.add(char.codePointAt(0)!)
  }
  assert.equal(readWithDictionary('平壤 冷麵', new Map(), underlying, false), '평양 랭면')
  assert.equal(readWithDictionary('女子', new Map(), underlying, false), '녀자')
  assert.equal(readWithDictionary('六月', new Map(), underlying, false), '륙월')
  assert.equal(readWithDictionary('音樂', new Map(), underlying, false), '음락')
  assert.equal(readWithDictionary('快樂', new Map(), underlying, false), '쾌락')

  const planned = planReadings({ underlying: kpUnderlying, entries, coverage, baseGlyphCount: 24973, initialSoundLaw: false })
  const { reader, shape, report, plan } = emitFamily(planned, 'ruby', productName('ruby', 'ko-KP', 'static'))
  assert.equal(plan.names.family, 'Gukhanmun Sans KP')
  assert.equal(plan.names.family.includes('Source'), false)
  assert.equal(report.initialSoundLaw, false)
  assert.equal(report.initialGlyphs, 0)
  assert.equal(report.droppedForBudget, 0)
  assert.equal(plan.fea.includes('lookup adjust'), false)
  assert.equal(plan.fea.includes('gki'), false)
  for (const sample of SAMPLES)
    assert.equal(reader.read(sample.text), sample.kp, sample.text)
  assert.equal(shape('女子')[0], 'gkc5973')
  assert.equal(shape('男女')[1], 'gkc5973')
  assert.equal(shape('冷')[0], 'gkc51B7')
  assert.equal(shape('六月').length, 1)
  assert.equal(reader.words.get('六月'), '류월')
  assert.equal(reader.read('困難'), '곤난')
  assert.equal(reader.words.has('困難'), false)
  assert.equal(shape('困難').length, 2)
  assert.equal(reader.words.has('女子'), false)
  assert.equal(shape('比率')[1], 'gkc7387')
  assert.equal(shape('分裂')[1], 'gkc88C2')
  assert.deepEqual(shape('利率'), ['gkc5229', 'gkc7387'])
  assert.equal(shape('法律')[1], 'gkc5F8B')

  const byName = new Map(plan.glyphs.map(glyph => [glyph.name, glyph]))
  assert.equal(byName.get(shape('六月')[0]!)?.ruby.map(part => part.text).join(''), '류월')
  assert.equal(byName.get('gkc5973')?.ruby[0]?.text, '녀')
  assert.equal(byName.has('gki5973'), false)

  let mismatches = 0
  for (const entry of entries) {
    if ([...entry.hanja].some(char => !isHan(char.codePointAt(0)!) || !coverage.has(char.codePointAt(0)!)))
      continue
    const target = hangulOnly(entry.reading)
    if (!target)
      continue
    if (reader.read(entry.hanja) !== target)
      mismatches++
  }
  assert.equal(mismatches, 0)
})

test('web coverage keeps non-Hanja and KS X 1001, and shared outlines', () => {
  const table = JSON.parse(readFileSync(join(root, 'data', 'khangul.json'), 'utf8')) as Record<string, Record<string, string>>
  const ksx = ksx1001Codepoints(table)
  assert.ok(ksx.includes(cp('國')))
  assert.equal(formatUnicodeRange([0x4E00, 0x4E01, 0x4E02, 0xAC00]), 'U+4E00-4E02, U+AC00')
  const font = [cp('가'), cp('A'), cp('國'), cp('樂'), cp('女')]
  const selected = webCodepoints(font, [cp('國')], [cp('樂')])
  assert.deepEqual(selected, [cp('A'), cp('가'), cp('國'), cp('樂')].sort((a, b) => a - b))
  const glyphOf = new Map([[cp('女'), 7], [cp('女'), 7], [cp('가'), 3]])
  assert.deepEqual(codepointsSharingGlyph(glyphOf, [cp('女')]), [cp('女'), cp('女')].sort((a, b) => a - b))
})

test('pages paths are the gukhanmun-font site', () => {
  assert.equal(pagesBase(), '/gukhanmun-font/')
  assert.equal(pagesOrigin(), 'https://moreal.github.io/gukhanmun-font')
  assert.equal(githubOrigin(), 'https://github.com/moreal/gukhanmun-font')
})

test('the pages landing is the typesetting story and the playground is separate', () => {
  const metrics = {
    unicodeRange: 'U+4E00',
    kpUnicodeRange: 'U+4E01',
    rubyAscent: '133%',
    replaceAscent: '116%',
    descent: '28.8%',
    lineGap: '0%',
  }
  const pages = renderLanding(metrics, 'pages')
  const play = renderPlayground()
  assert.equal(pages.includes('gukhan-font'), false)
  assert.equal(pages.includes('Gukhan Sans'), false)
  assert.equal(pages.includes('Gukhan Hangul'), false)
  assert.equal(pages.includes('가족'), false)
  assert.equal(pages.includes('루비'), false)
  assert.equal(pages.includes('세온비'), false)
  assert.equal(pages.includes('drafts/'), false)
  assert.match(pages, /국한문/)
  assert.match(pages, /\/gukhanmun-font\/fonts\/GukhanmunSans-Web\.woff2/)
  assert.match(pages, /\/gukhanmun-font\/fonts\/GukhanmunSansVF\.woff2/)
  assert.match(pages, /\/gukhanmun-font\/fonts\/GukhanmunHangul-Web\.woff2/)
  assert.match(pages, /\/gukhanmun-font\/fonts\/GothicA1-Regular\.woff2/)
  assert.match(pages, /id="read"/)
  assert.match(pages, /id="liga"/)
  assert.match(pages, /id="axis"/)
  assert.match(pages, /font-variation-settings/)
  assert.match(pages, /prefers-reduced-motion/)
  assert.match(pages, /document\.fonts\.load/)
  assert.match(pages, /bezier\(0\.65, 0, 0\.35, 1\)/)
  assert.match(pages, /id="install"/)
  assert.match(pages, /id="families"/)
  assert.match(pages, /폰트 패밀리/)
  assert.match(pages, /Gukhanmun Sans/)
  assert.match(pages, /Gukhanmun Hangul/)
  assert.match(pages, /ascent-override: 133%/)
  assert.match(pages, /ascent-override: 116%/)
  assert.match(pages, /href="\/gukhanmun-font\/playground\/"/)
  assert.equal(pages.includes('href="#install"'), false)
  assert.match(pages, /독음 끄기 기능\(<code>ss01<\/code>\)/)
  assert.match(pages, /font-feature-settings: "ss01"/)
  assert.match(pages, /class="shiki gukhan-paper"/)
  assert.match(pages, /aria-label="코드 복사"/)
  assert.match(pages, /<h2>출처<\/h2>/)
  assert.match(pages, /별개의 프로젝트/)
  assert.match(pages, /본고딕\(Source Han Sans\)/)
  assert.equal(pages.includes('스타일 세트'), false)
  assert.equal(pages.includes('slides/'), false)
  assert.equal(pages.includes('슬라이드'), false)
  assert.match(pages, /href="https:\/\/gukhanmun\.org\/"/)
  assert.match(pages, /dahlia의 선비/)
  assert.match(pages, /이 글꼴과는 별개의 프로젝트/)
  assert.match(pages, /SIL OFL 1\.1/)
  assert.match(pages, /북한 ko-KP/)
  assert.equal(play.includes('루비'), false)
  assert.equal(play.includes('가족'), false)
  assert.equal(play.includes('drafts/'), false)
  assert.match(play, /독음/)
  assert.match(play, /한글/)
  assert.match(play, /title="독음 달기"/)
  assert.match(play, /title="한글로 바꾸기"/)
  assert.match(play, /prefers-reduced-motion/)
  assert.match(play, /\/gukhanmun-font\/fonts\/GukhanmunSansVF\.woff2/)
  assert.match(play, /href="\/gukhanmun-font\/"/)
  assert.equal(play.includes('slides/'), false)
  assert.equal(play.includes('슬라이드'), false)
  const local = renderDemo(metrics)
  assert.equal(local.includes('<base '), false)
  assert.equal(local.includes('drafts/'), false)
  assert.equal(local.includes('루비'), false)
  assert.match(local, /\.\.\/dist\/GukhanmunSansVF\.woff2/)
  assert.match(local, /가변 폰트/)
  assert.match(local, /id="web" name="source" type="radio" checked/)
  assert.match(local, /Gothic A1 Replace/)
  assert.match(local, /href="\/gukhanmun-font\/playground\/"/)
  assert.match(local, /id="how"/)
  assert.match(local, /gkw00891/)
  assert.match(local, /가장 긴 단어가 이깁니다/)
  assert.equal(local.includes('slides/'), false)
  assert.equal(local.includes('슬라이드'), false)
  const display = displayCodepoints()
  assert.ok(display.length < 400)
  assert.ok(display.includes('국'.codePointAt(0)!))
  assert.ok(pagesDistFonts().includes('GukhanmunSans-Web.woff2'))
})
