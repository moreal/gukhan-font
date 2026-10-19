import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import * as hb from 'harfbuzzjs'
import { brotli, compileFont, readFontInfo, subsetWasm, toWoff2 } from '../vendor/furifont/index.ts'
import { subsetFont } from '../vendor/furifont/subset.ts'
import { displayCodepoints, pagesDistFonts, renderDemo, renderHanjaCss, type DemoMetrics } from './demo.ts'
import { renderLanding } from './landing.ts'
import { renderPlayground } from './playground.ts'
import { emitFamily, planReadings, type BuildReport, type FamilyStyle, type ReadingPlan } from './emit.ts'
import { fileName, productName, WEIGHTS, type ProductKind, type WeightName } from './families.ts'
import { cssPercent, faceMetrics, rubyAscender } from './metrics.ts'
import { ksx1001Codepoints, loadUnderlying } from './readings.ts'
import { applyCharacterOverrides, entriesForRegion, loadNorthKorean, loadSouthKorean, type Region } from './region.ts'
import { SAMPLES } from './samples.ts'
import type { WordEntry } from './select.ts'
import {
  GOTHIC_A1_SHA256,
  GOTHIC_A1_URL,
  GOWUN_BATANG_SHA256,
  GOWUN_BATANG_URL,
  NORTH_KOREAN_SHA256,
  SOURCE_HAN_VF_SHA256,
  SOURCE_HAN_VF_URL,
  SOURCE_HAN_WEIGHT_SHA256,
  SOURCE_HAN_ZIP_SHA256,
  SOURCE_HAN_ZIP_URL,
} from './sources.ts'
import { isHan, segment } from './text.ts'
import { codepointsSharingGlyph, formatUnicodeRange, hangulSyllables, webCodepoints } from './web.ts'

const exec = promisify(execFile)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const VERSION = '0.2.0'
const BUILD_DATE = new Date('2026-10-17T00:00:00Z')
const CHECK = process.argv.includes('--check')
const PAGES = process.argv.includes('--pages')
if (CHECK && PAGES)
  throw new Error('pass either --check or --pages')
const WOFF2_QUALITY = CHECK ? 5 : 11
const RUBY_SCALE = 0.68
const RUBY_GAP = 0.02

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  }
  catch {
    return false
  }
}

async function download(url: string, dest: string): Promise<void> {
  const response = await fetch(url, { headers: { 'user-agent': 'gukhanmun-font-build' } })
  if (!response.ok)
    throw new Error(`failed to download ${url}: ${response.status}`)
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, new Uint8Array(await response.arrayBuffer()))
}

async function hashedFile(path: string, url: string, expect: string): Promise<Uint8Array> {
  const read = async (): Promise<Uint8Array | undefined> => {
    if (!await exists(path))
      return undefined
    const bytes = new Uint8Array(await readFile(path))
    return sha256(bytes) === expect ? bytes : undefined
  }
  const cached = await read()
  if (cached)
    return cached
  console.log(`downloading ${url}`)
  await download(url, path)
  const bytes = await read()
  if (!bytes)
    throw new Error(`checksum of ${url} is not ${expect}`)
  return bytes
}

function gate<T>(width: number): (fn: () => Promise<T>) => Promise<T> {
  let active = 0
  const waiting: (() => void)[] = []
  return async (fn) => {
    if (active >= width)
      await new Promise<void>(resolve => waiting.push(resolve))
    active++
    try {
      return await fn()
    }
    finally {
      active--
      waiting.shift()?.()
    }
  }
}

function glyphMap(font: Uint8Array, codepoints: readonly number[]): Map<number, number> {
  const face = new hb.Font(new hb.Face(new hb.Blob(font)))
  const map = new Map<number, number>()
  for (const cp of codepoints) {
    const glyph = face.nominalGlyph(cp)
    if (glyph !== undefined)
      map.set(cp, glyph)
  }
  return map
}

function assertSameMap(label: string, reference: ReadonlyMap<number, number>, other: ReadonlyMap<number, number>): void {
  for (const [cp, id] of reference) {
    if (other.get(cp) !== id)
      throw new Error(`${label} maps U+${cp.toString(16)} to ${String(other.get(cp))}, not ${id}`)
  }
}

function hanRuns(text: string): string[] {
  return segment(text).flatMap(part => part.han ? [part.chars.join('')] : [])
}

function shapeIds(font: Uint8Array, text: string, feature?: string): { ids: number[], advance: number } {
  const face = new hb.Font(new hb.Face(new hb.Blob(font)))
  const buffer = new hb.Buffer()
  buffer.addText(text)
  buffer.guessSegmentProperties()
  const features = feature ? [hb.Feature.fromString(feature)!] : undefined
  hb.shape(face, buffer, features)
  const positions = buffer.getGlyphPositions()
  return {
    ids: buffer.getGlyphInfos().map(info => info.codepoint),
    advance: positions.reduce((sum, position) => sum + position.xAdvance, 0),
  }
}

const KNOWN: Record<Region, [string, string][]> = {
  'ko-KR': [
    ['音樂', '음악'],
    ['六月', '유월'],
    ['困難', '곤란'],
    ['上海', '상하이'],
    ['國漢文混用', '국한문혼용'],
    ['女子', '여자'],
    ['男女', '남녀'],
  ],
  'ko-KP': [
    ['音樂', '음악'],
    ['六月', '류월'],
    ['困難', '곤난'],
    ['上海', '상하이'],
    ['國漢文混用', '국한문혼용'],
    ['女子', '녀자'],
    ['男女', '남녀'],
  ],
}

function verifyAdvances(
  built: Uint8Array,
  reference: Uint8Array,
  read: (text: string) => string,
  region: Region,
  shape: (text: string) => string[],
): void {
  const expectWidth = (hanja: string, hangul: string, glyphs?: number): void => {
    const got = shapeIds(built, hanja)
    const expect = shapeIds(reference, hangul)
    if (got.advance !== expect.advance)
      throw new Error(`${hanja} advances ${got.advance}, ${hangul} advances ${expect.advance}`)
    if (glyphs !== undefined && got.ids.length !== glyphs)
      throw new Error(`${hanja} is ${got.ids.length} glyphs, expected ${glyphs}`)
  }
  for (const sample of SAMPLES) {
    for (const run of hanRuns(sample.text))
      expectWidth(run, read(run))
  }
  for (const [hanja, hangul] of KNOWN[region])
    expectWidth(hanja, hangul, shape(hanja).length)
}

function verifyExtent(built: Uint8Array, reference: Uint8Array, syllable: string): void {
  const shaped = shapeIds(built, '女')
  const font = new hb.Font(new hb.Face(new hb.Blob(built)))
  const source = new hb.Font(new hb.Face(new hb.Blob(reference)))
  const extents = font.glyphExtents(shaped.ids[0]!)
  const hangul = source.glyphExtents(source.nominalGlyph(syllable.codePointAt(0)!)!)
  if (!extents || !hangul)
    throw new Error(`missing extents for 女 / ${syllable}`)
  if (Math.abs(extents.yBearing - hangul.yBearing) > 1 || Math.abs(extents.height - hangul.height) > 1)
    throw new Error(`女 sits at y ${extents.yBearing} h ${extents.height}, ${syllable} is y ${hangul.yBearing} h ${hangul.height}`)
}

function verifySs01(built: Uint8Array): void {
  const on = shapeIds(built, '女子')
  const off = shapeIds(built, '女子', 'ss01')
  if (on.ids.join() === off.ids.join())
    throw new Error('ss01 did not restore 女子')
}

function verifyFamily(bytes: Uint8Array, family: string): void {
  const info = readFontInfo(bytes)
  if (info.family !== family)
    throw new Error(`family is ${info.family}, expected ${family}`)
  if (info.family.includes('Source'))
    throw new Error(`reserved name Source is in the family ${info.family}`)
}

interface PlannedRegion {
  region: Region
  entries: WordEntry[]
  full: ReadingPlan
  /** Same readings as `full`, without context-class members the add-on does not ship. */
  hanja: ReadingPlan
  web: ReadingPlan
  vf: ReadingPlan
  webBase: Uint8Array
  glyphOf: Map<number, number>
}

interface Artifact {
  file: string
  bytes: number
  sha256: string
  family: string
  region: Region
  style: FamilyStyle
  kind: ProductKind
  weight: string | null
  glyphs: number
  cmap: number
}

async function ensureAssets(): Promise<{ weights: Map<WeightName, Uint8Array>, vf: Uint8Array }> {
  const cache = join(root, '.cache')
  await mkdir(cache, { recursive: true })
  const weights = new Map<WeightName, Uint8Array>()
  let complete = true
  for (const weight of WEIGHTS) {
    const path = join(cache, 'SubsetOTF', 'KR', `SourceHanSansKR-${weight.name}.otf`)
    if (!await exists(path)) {
      complete = false
      break
    }
    const bytes = new Uint8Array(await readFile(path))
    if (sha256(bytes) !== SOURCE_HAN_WEIGHT_SHA256[weight.name]) {
      complete = false
      break
    }
    weights.set(weight.name, bytes)
  }
  if (!complete) {
    weights.clear()
    const zipPath = join(cache, 'SourceHanSansKR.zip')
    await hashedFile(zipPath, SOURCE_HAN_ZIP_URL, SOURCE_HAN_ZIP_SHA256)
    const entries = WEIGHTS.map(weight => `SubsetOTF/KR/SourceHanSansKR-${weight.name}.otf`)
    await exec('unzip', ['-qo', zipPath, ...entries, '-d', cache])
    for (const weight of WEIGHTS) {
      const path = join(cache, 'SubsetOTF', 'KR', `SourceHanSansKR-${weight.name}.otf`)
      const bytes = new Uint8Array(await readFile(path))
      const sum = sha256(bytes)
      if (sum !== SOURCE_HAN_WEIGHT_SHA256[weight.name])
        throw new Error(`SourceHanSansKR-${weight.name}.otf checksum ${sum}`)
      weights.set(weight.name, bytes)
    }
  }
  const vf = await hashedFile(join(cache, 'SourceHanSansKR-VF.ttf'), SOURCE_HAN_VF_URL, SOURCE_HAN_VF_SHA256)
  const regular = weights.get('Regular')!
  const regularInfo = readFontInfo(regular)
  const regularMap = glyphMap(regular, regularInfo.codepoints)
  for (const weight of WEIGHTS) {
    if (weight.name === 'Regular')
      continue
    const info = readFontInfo(weights.get(weight.name)!)
    assertSameMap(weight.name, regularMap, glyphMap(weights.get(weight.name)!, info.codepoints))
  }
  return { weights, vf }
}

const DEMO_FACE_FILES = ['GothicA1-Regular.woff2', 'GowunBatang-Regular.woff2', 'HanjaBox.woff']

async function ensureGothic(): Promise<void> {
  const cache = join(root, '.cache', 'GothicA1-Regular.ttf')
  const ttf = await hashedFile(cache, GOTHIC_A1_URL, GOTHIC_A1_SHA256)
  const dir = join(root, 'demo', 'fonts')
  await mkdir(dir, { recursive: true })
  const woff2 = join(dir, 'GothicA1-Regular.woff2')
  if (!await exists(woff2)) {
    console.log('compressing Gothic A1 for the demo')
    await writeFile(woff2, await toWoff2(ttf, data => brotli(data, 11)))
  }
  const box = join(dir, 'HanjaBox.woff')
  if (!await exists(box)) {
    console.log('building the demo Hanja box')
    await exec('python3', [join(root, 'scripts', 'hanja_box.py'), box])
  }
}

/** Subsets Gowun Batang to the local catalog's display text. The full face is about 8 MB and has no Hanja. */
async function ensureDisplayFace(): Promise<void> {
  const cache = join(root, '.cache', 'GowunBatang-Regular.ttf')
  const ttf = await hashedFile(cache, GOWUN_BATANG_URL, GOWUN_BATANG_SHA256)
  const dir = join(root, 'demo', 'fonts')
  await mkdir(dir, { recursive: true })
  const woff2 = join(dir, 'GowunBatang-Regular.woff2')
  if (await exists(woff2))
    return
  const codepoints = displayCodepoints()
  const have = new Set(readFontInfo(ttf).codepoints)
  const missing = codepoints.filter(cp => !have.has(cp))
  if (missing.length)
    throw new Error(`Gowun Batang lacks ${missing.map(cp => `U+${cp.toString(16).toUpperCase()}`).join(' ')}`)
  console.log(`subsetting Gowun Batang to ${codepoints.length} codepoints`)
  const subset = await subsetFont(ttf, codepoints, subsetWasm)
  const web = await toWoff2(subset, data => brotli(data, 11))
  await writeFile(woff2, web)
  console.log(`wrote GowunBatang-Regular.woff2 ${web.byteLength} bytes`)
}

function sampleHan(): number[] {
  const out = new Set<number>()
  for (const sample of SAMPLES) {
    for (const char of sample.text) {
      const cp = char.codePointAt(0)!
      if (isHan(cp))
        out.add(cp)
    }
  }
  return [...out]
}

function assertSamples(region: Region, planned: ReadingPlan): void {
  for (const sample of SAMPLES) {
    const expect = region === 'ko-KR' ? sample.reading : sample.kp
    const got = planned.reader.read(sample.text)
    if (got !== expect)
      throw new Error(`${region} ${sample.text} reads ${got}, expected ${expect}`)
  }
}

function assertHangulAvailable(planned: ReadingPlan, codepoints: readonly number[], label: string): void {
  const have = new Set(codepoints)
  for (const cp of hangulSyllables(planned.glyphs)) {
    if (!have.has(cp))
      throw new Error(`${label} is missing a reading syllable U+${cp.toString(16)}`)
  }
}

async function planAll(
  weights: Map<WeightName, Uint8Array>,
  vf: Uint8Array,
  south: WordEntry[],
  north: WordEntry[],
  underlying: Map<number, string>,
  ksx: number[],
): Promise<PlannedRegion[]> {
  const regular = weights.get('Regular')!
  const info = readFontInfo(regular)
  const glyphOf = glyphMap(regular, info.codepoints)
  const wanted = codepointsSharingGlyph(glyphOf, webCodepoints(info.codepoints, ksx, sampleHan()))
  console.log(`subsetting web base to ${wanted.length} codepoints`)
  const webBase = await subsetFont(regular, wanted, subsetWasm)
  const webInfo = readFontInfo(webBase)
  const regions: Region[] = ['ko-KR', 'ko-KP']
  const planned: PlannedRegion[] = []
  for (const region of regions) {
    const law = region === 'ko-KR'
    const entries = entriesForRegion(south, north, underlying, region)
    const readings = law ? underlying : applyCharacterOverrides(underlying, north)
    const full = planReadings({
      underlying: readings,
      entries,
      coverage: new Set(info.codepoints),
      baseGlyphCount: info.glyphCount,
      glyphOf,
      initialSoundLaw: law,
    })
    const web = planReadings({
      underlying: readings,
      entries,
      coverage: new Set(webInfo.codepoints),
      baseGlyphCount: webInfo.glyphCount,
      glyphOf: glyphMap(webBase, webInfo.codepoints),
      initialSoundLaw: law,
    })
    const vfInfo = readFontInfo(vf)
    const variable = planReadings({
      underlying: readings,
      entries,
      coverage: new Set(vfInfo.codepoints),
      baseGlyphCount: vfInfo.glyphCount,
      glyphOf: glyphMap(vf, vfInfo.codepoints),
      initialSoundLaw: law,
    })
    // Bare Hanja with no reading are only named in the context class. The add-on
    // leaves them to the body font, so they must not be required glyphs.
    const hanjaCoverage = new Set(codepointsSharingGlyph(glyphOf, full.codepoints).filter(isHan))
    const hanja = planReadings({
      underlying: readings,
      entries,
      coverage: hanjaCoverage,
      baseGlyphCount: info.glyphCount,
      glyphOf,
      initialSoundLaw: law,
    })
    assertSamples(region, full)
    assertSamples(region, hanja)
    assertSamples(region, web)
    assertSamples(region, variable)
    assertHangulAvailable(web, webInfo.codepoints, `${region} web`)
    if (hanja.report.wordLigatures !== full.report.wordLigatures)
      throw new Error(`${region} hanja ligatures ${hanja.report.wordLigatures} != full ${full.report.wordLigatures}`)
    console.log(`${region} full`, full.report)
    console.log(`${region} web`, web.report)
    planned.push({ region, entries, full, hanja, web, vf: variable, webBase, glyphOf })
  }
  return planned
}

interface Job {
  style: FamilyStyle
  region: Region
  kind: ProductKind
  weight: WeightName | null
  base: Uint8Array
  planned: ReadingPlan
  glyphOf: Map<number, number>
  reference: Uint8Array
}

function jobsFor(planned: PlannedRegion[], weights: Map<WeightName, Uint8Array>, vf: Uint8Array): Job[] {
  const styles: FamilyStyle[] = ['ruby', 'replace']
  const out: Job[] = []
  for (const region of planned) {
    for (const style of styles) {
      for (const weight of WEIGHTS) {
        const base = weights.get(weight.name)!
        out.push({ style, region: region.region, kind: 'static', weight: weight.name, base, planned: region.full, glyphOf: region.glyphOf, reference: base })
      }
      out.push({ style, region: region.region, kind: 'vf', weight: null, base: vf, planned: region.vf, glyphOf: region.glyphOf, reference: vf })
      out.push({ style, region: region.region, kind: 'web', weight: null, base: region.webBase, planned: region.web, glyphOf: region.glyphOf, reference: region.webBase })
    }
  }
  if (PAGES) {
    // The site ships web Regular, the Regular Hanja add-on, and the four variable fonts.
    // The weight slider and waterfall load a variable font only when they need it.
    return out.filter(job => job.kind === 'web' || job.kind === 'vf' || (job.kind === 'static' && job.weight === 'Regular'))
  }
  if (!CHECK)
    return out
  const keep = (job: Job): boolean => {
    if (job.kind === 'vf')
      return job.region === 'ko-KR' && job.style === 'ruby'
    if (job.kind === 'web')
      return job.region === 'ko-KR' && job.style === 'ruby'
    if (job.weight !== 'Regular')
      return false
    return true
  }
  return out.filter(keep)
}

async function compileJob(job: Job): Promise<{ bytes: Uint8Array, family: string }> {
  const names = productName(job.style, job.region, job.kind)
  const { plan } = emitFamily(job.planned, job.style, { family: names.family, description: names.description })
  const file = fileName(job.style, job.region, job.kind, job.weight ?? undefined)
  console.log(`planning ${names.family} ${job.weight ?? job.kind}: ${plan.glyphs.length} glyphs`)
  const started = Date.now()
  let built
  try {
    built = await compileFont({
      plan,
      base: job.base,
      version: VERSION,
      date: BUILD_DATE,
      subsetWasm,
      onProgress: (progress) => {
        if (progress.done == null || progress.done === progress.total || progress.done % 4000 === 0)
          console.log(`  ${file} ${progress.step}${progress.total == null ? '' : ` ${progress.done}/${progress.total}`}`)
      },
    })
  }
  catch (error) {
    await mkdir(join(root, 'dist'), { recursive: true })
    await writeFile(join(root, 'dist', `${file}.failed.fea`), plan.fea)
    throw error
  }
  const bytes = built.font
  verifyFamily(bytes, names.family)
  if (job.style === 'replace')
    verifyAdvances(bytes, job.reference, job.planned.reader.read.bind(job.planned.reader), job.region, job.planned.shape)
  if (job.style === 'replace' && job.weight === 'Regular' && job.kind !== 'vf')
    verifyExtent(bytes, job.reference, job.region === 'ko-KR' ? '여' : '녀')
  if (job.style === 'ruby' && (job.weight === 'Regular' || job.kind === 'vf' || job.kind === 'web'))
    verifySs01(bytes)
  console.log(`opentype ${bytes.byteLength} bytes in ${((Date.now() - started) / 1000).toFixed(1)}s`)
  return { bytes, family: names.family }
}

async function writeHanja(job: Job, source: string, dest: string, codepoints: readonly number[]): Promise<Uint8Array> {
  const names = productName(job.style, job.region, 'hanja')
  const stage = await mkdirTemp()
  try {
    await writeFile(join(stage, 'unicodes.txt'), `${codepoints.map(cp => cp.toString(16)).join('\n')}\n`)
    await writeFile(join(stage, 'description.txt'), names.description)
    console.log(`subsetting ${dest.split('/').at(-1)}`)
    await exec('python3', [
      join(root, 'scripts', 'hanja_subset.py'),
      source,
      dest,
      names.family,
      join(stage, 'description.txt'),
      join(stage, 'unicodes.txt'),
    ])
  }
  finally {
    await rm(stage, { recursive: true, force: true })
  }
  const bytes = new Uint8Array(await readFile(dest))
  verifyFamily(bytes, names.family)
  const info = readFontInfo(bytes)
  for (const cp of info.codepoints) {
    if (!isHan(cp))
      throw new Error(`${names.family} maps non-Hanja U+${cp.toString(16)}`)
  }
  if (job.style === 'replace')
    verifyAdvances(bytes, job.reference, job.planned.reader.read.bind(job.planned.reader), job.region, job.planned.shape)
  if (job.style === 'replace' && job.weight === 'Regular')
    verifyExtent(bytes, job.reference, job.region === 'ko-KR' ? '여' : '녀')
  if (job.style === 'ruby')
    verifySs01(bytes)
  return bytes
}

async function pack(dist: string, files: Artifact[], metrics: DemoMetrics): Promise<void> {
  const release = join(dist, 'release')
  await rm(release, { recursive: true, force: true })
  await mkdir(release)
  const groups = new Map<string, Artifact[]>()
  for (const file of files) {
    const bundle = `${file.style === 'ruby' ? 'GukhanmunSans' : 'GukhanmunHangul'}${file.region === 'ko-KP' ? 'KP' : ''}`
    const list = groups.get(bundle)
    if (list)
      list.push(file)
    else
      groups.set(bundle, [file])
  }
  const zipSums: string[] = []
  for (const [bundle, members] of [...groups].sort((a, b) => a[0] < b[0] ? -1 : 1)) {
    const stage = await mkdirTemp()
    const bundleRegion: Region = bundle.endsWith('KP') ? 'ko-KP' : 'ko-KR'
    const bundleStyle: FamilyStyle = bundle.startsWith('GukhanmunHangul') ? 'replace' : 'ruby'
    const css = renderHanjaCss(metrics, { style: bundleStyle, region: bundleRegion })
    const lines = [
      ...members.map(member => `${member.sha256}  ${member.file}`),
      `${sha256(new TextEncoder().encode(css))}  hanja.css`,
    ].sort()
    await writeFile(join(stage, 'SHA256SUMS.txt'), `${lines.join('\n')}\n`)
    for (const member of members)
      await writeFile(join(stage, member.file), await readFile(join(dist, member.file)))
    await writeFile(join(stage, 'hanja.css'), css)
    const staged = [...members.map(member => member.file), 'SHA256SUMS.txt', 'hanja.css']
    await exec('touch', ['-d', '2026-10-17T00:00:00Z', ...staged], { cwd: stage, env: { ...process.env, TZ: 'UTC' } })
    const zipPath = join(release, `${bundle}.zip`)
    await exec('zip', ['-X', '-q', zipPath, ...staged.sort()], { cwd: stage })
    await rm(stage, { recursive: true, force: true })
    const zipBytes = new Uint8Array(await readFile(zipPath))
    zipSums.push(`${sha256(zipBytes)}  ${bundle}.zip`)
    console.log(`packed ${bundle}.zip ${zipBytes.byteLength} bytes`)
  }
  const css = new Uint8Array(await readFile(join(dist, 'hanja.css')))
  zipSums.push(`${sha256(css)}  hanja.css`)
  await writeFile(join(release, 'hanja.css'), css)
  zipSums.sort()
  await writeFile(join(release, 'SHA256SUMS.txt'), `${zipSums.join('\n')}\n`)
}

async function publishSite(dist: string, metrics: DemoMetrics): Promise<void> {
  const site = join(root, 'site')
  await rm(site, { recursive: true, force: true })
  const fonts = join(site, 'fonts')
  await mkdir(fonts, { recursive: true })
  for (const name of pagesDistFonts())
    await writeFile(join(fonts, name), await readFile(join(dist, name)))
  for (const name of DEMO_FACE_FILES)
    await writeFile(join(fonts, name), await readFile(join(root, 'demo', 'fonts', name)))
  await writeFile(join(site, 'index.html'), renderLanding(metrics, 'pages'))
  await mkdir(join(site, 'playground'), { recursive: true })
  await writeFile(join(site, 'playground', 'index.html'), renderPlayground())
  await writeFile(join(site, '.nojekyll'), '')
  console.log(`wrote site/ with ${pagesDistFonts().length + DEMO_FACE_FILES.length} fonts`)
}

async function mkdirTemp(): Promise<string> {
  const { mkdtemp } = await import('node:fs/promises')
  return mkdtemp(join(tmpdir(), 'gukhanmun-release-'))
}

async function main(): Promise<void> {
  if (process.argv.includes('--demo-html')) {
    await ensureGothic()
    await ensureDisplayFace()
    const report = JSON.parse(await readFile(join(root, 'dist', 'report.json'), 'utf8')) as { metrics: DemoMetrics }
    await writeFile(join(root, 'demo', 'index.html'), renderDemo(report.metrics))
    return
  }
  const dist = join(root, 'dist')
  if (!CHECK)
    await rm(dist, { recursive: true, force: true })
  await mkdir(dist, { recursive: true })

  const [{ weights, vf }, southBytes, northBytes, khangulText] = await Promise.all([
    ensureAssets(),
    readFile(join(root, 'data', 'ko-kr-stdict.tsv')),
    readFile(join(root, 'data', 'ko-kp-opendict.tsv')),
    readFile(join(root, 'data', 'khangul.json'), 'utf8'),
    ensureGothic(),
    ensureDisplayFace(),
  ])
  const northSum = sha256(new Uint8Array(northBytes))
  if (northSum !== NORTH_KOREAN_SHA256)
    throw new Error(`ko-kp-opendict.tsv checksum ${northSum}`)
  const southText = new TextDecoder().decode(southBytes)
  const northText = new TextDecoder().decode(northBytes)
  const table = JSON.parse(khangulText) as Record<string, Record<string, string>>
  const underlying = loadUnderlying(table)
  const south = loadSouthKorean(southText)
  const north = loadNorthKorean(northText)
  const planned = await planAll(weights, vf, south, north, underlying, ksx1001Codepoints(table))

  const regular = weights.get('Regular')!
  const baseMetrics = faceMetrics(regular, readFontInfo(regular).unitsPerEm)
  const rubyAscent = rubyAscender(baseMetrics, RUBY_SCALE, RUBY_GAP)
  const metrics: DemoMetrics = {
    unicodeRange: '',
    kpUnicodeRange: '',
    rubyAscent: cssPercent(rubyAscent, baseMetrics.unitsPerEm),
    replaceAscent: cssPercent(baseMetrics.hheaAscender, baseMetrics.unitsPerEm),
    descent: cssPercent(Math.abs(baseMetrics.hheaDescender), baseMetrics.unitsPerEm),
    lineGap: cssPercent(baseMetrics.hheaLineGap, baseMetrics.unitsPerEm),
  }

  const queue = jobsFor(planned, weights, vf)
  const compress = gate(4)
  const subsetGate = gate(2)
  const pending: Promise<void>[] = []
  const artifacts: Artifact[] = []
  const hanjaRange = new Map<Region, string>()
  for (const job of queue) {
    const file = fileName(job.style, job.region, job.kind, job.weight ?? undefined)
    const extension = job.kind === 'vf' ? 'ttf' : 'otf'
    const { bytes, family } = await compileJob(job)
    if (job.kind === 'static' && job.style === 'ruby' && job.weight === 'Regular' && job.region === 'ko-KR') {
      const built = faceMetrics(bytes, baseMetrics.unitsPerEm)
      if (built.hheaAscender !== rubyAscent)
        throw new Error(`ruby ascender is ${built.hheaAscender}, expected ${rubyAscent}`)
    }
    if (job.kind === 'static' && job.weight === 'Regular' && job.region === 'ko-KR' && job.style === 'replace') {
      const built = faceMetrics(bytes, baseMetrics.unitsPerEm)
      if (built.hheaAscender !== baseMetrics.hheaAscender)
        throw new Error(`replacement ascender moved to ${built.hheaAscender}`)
    }
    const info = readFontInfo(bytes)
    const name = `${file}.${extension}`
    await writeFile(join(dist, name), bytes)
    const record = (artifact: Artifact): void => {
      artifacts.push(artifact)
    }
    record({
      file: name,
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      family,
      region: job.region,
      style: job.style,
      kind: job.kind,
      weight: job.weight,
      glyphs: info.glyphCount,
      cmap: info.codepoints.length,
    })
    const woff2Name = `${file}.woff2`
    const sourcePath = join(dist, name)
    pending.push(compress(async () => {
      const web = await toWoff2(new Uint8Array(await readFile(sourcePath)), data => brotli(data, WOFF2_QUALITY))
      await writeFile(join(dist, woff2Name), web)
      record({
        file: woff2Name,
        bytes: web.byteLength,
        sha256: sha256(web),
        family,
        region: job.region,
        style: job.style,
        kind: job.kind,
        weight: job.weight,
        glyphs: info.glyphCount,
        cmap: info.codepoints.length,
      })
      console.log(`woff2 ${woff2Name} ${web.byteLength} bytes`)
    }))
    if (job.kind === 'static' && job.weight) {
      const regionPlan = planned.find(item => item.region === job.region)!
      const unicodes = codepointsSharingGlyph(regionPlan.glyphOf, regionPlan.hanja.codepoints).filter(isHan)
      const hanjaFile = fileName(job.style, job.region, 'hanja', job.weight)
      const hanjaNames = productName(job.style, job.region, 'hanja')
      pending.push(subsetGate(async () => {
        const hanjaBytes = await writeHanja(job, sourcePath, join(dist, `${hanjaFile}.otf`), unicodes)
        const hanjaInfo = readFontInfo(hanjaBytes)
        const range = formatUnicodeRange(hanjaInfo.codepoints)
        const previous = hanjaRange.get(job.region)
        if (previous === undefined)
          hanjaRange.set(job.region, range)
        else if (previous !== range)
          throw new Error(`${hanjaFile} unicode-range differs within ${job.region}`)
        record({
          file: `${hanjaFile}.otf`,
          bytes: hanjaBytes.byteLength,
          sha256: sha256(hanjaBytes),
          family: hanjaNames.family,
          region: job.region,
          style: job.style,
          kind: 'hanja',
          weight: job.weight,
          glyphs: hanjaInfo.glyphCount,
          cmap: hanjaInfo.codepoints.length,
        })
        await compress(async () => {
          const web = await toWoff2(hanjaBytes, data => brotli(data, WOFF2_QUALITY))
          await writeFile(join(dist, `${hanjaFile}.woff2`), web)
          record({
            file: `${hanjaFile}.woff2`,
            bytes: web.byteLength,
            sha256: sha256(web),
            family: hanjaNames.family,
            region: job.region,
            style: job.style,
            kind: 'hanja',
            weight: job.weight,
            glyphs: hanjaInfo.glyphCount,
            cmap: hanjaInfo.codepoints.length,
          })
          console.log(`woff2 ${hanjaFile}.woff2 ${web.byteLength} bytes`)
        })
      }))
    }
  }
  await Promise.all(pending)
  const krRange = hanjaRange.get('ko-KR')
  if (!krRange)
    throw new Error('hanja unicode-range was not measured')
  metrics.unicodeRange = krRange
  metrics.kpUnicodeRange = hanjaRange.get('ko-KP') ?? krRange
  if (PAGES)
    await publishSite(dist, metrics)
  else
    await writeFile(join(root, 'demo', 'index.html'), renderDemo(metrics))
  await writeFile(join(dist, 'hanja.css'), renderHanjaCss(metrics))
  const reports: Record<string, { full: BuildReport, web: BuildReport }> = {}
  for (const region of planned)
    reports[region.region] = { full: region.full.report, web: region.web.report }
  await writeFile(join(dist, 'report.json'), `${JSON.stringify({
    version: VERSION,
    woff2Quality: WOFF2_QUALITY,
    check: CHECK,
    pages: PAGES,
    metrics,
    regions: reports,
    files: artifacts.sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : 0),
  }, null, 2)}\n`)
  if (!CHECK && !PAGES)
    await pack(dist, artifacts.filter(artifact => artifact.file.endsWith('.otf') || artifact.file.endsWith('.ttf') || artifact.file.endsWith('.woff2')), metrics)
  console.log(`wrote ${artifacts.length} files`)
}

await main()
