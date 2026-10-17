import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import * as hb from 'harfbuzzjs'
import { brotli, compileFont, readFontInfo, subsetWasm, toWoff2 } from '../vendor/furifont/index.ts'
import { renderDemo } from './demo.ts'
import { buildPlan } from './emit.ts'
import { loadUnderlying } from './readings.ts'
import { SAMPLES } from './samples.ts'
import type { WordEntry } from './select.ts'

const exec = promisify(execFile)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const FONT_URL = 'https://github.com/adobe-fonts/source-han-sans/releases/download/2.005R/18_SourceHanSansKR.zip'
const FONT_SHA256 = 'd8299926a5284f7461b46fa0617cc05d4f1fce8f034ffff78084225ce8b38071'
const FONT_ZIP_ENTRY = 'SubsetOTF/KR/SourceHanSansKR-Regular.otf'

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  }
  catch {
    return false
  }
}

async function download(url: string, dest: string): Promise<void> {
  const response = await fetch(url, { headers: { 'user-agent': 'gukhan-font-build' } })
  if (!response.ok)
    throw new Error(`failed to download ${url}: ${response.status}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  await writeFile(dest, bytes)
}

/** Source Han Sans KR Regular, cached after a checksum check. */
async function ensureBaseFont(): Promise<Uint8Array> {
  const cache = join(root, '.cache')
  const fontPath = join(cache, 'SourceHanSansKR-Regular.otf')
  await mkdir(cache, { recursive: true })
  if (await fileExists(fontPath)) {
    const cached = new Uint8Array(await readFile(fontPath))
    if (sha256(cached) === FONT_SHA256)
      return cached
  }
  const zipPath = join(cache, 'SourceHanSansKR.zip')
  console.log('downloading Source Han Sans KR')
  await download(FONT_URL, zipPath)
  await exec('unzip', ['-qo', zipPath, FONT_ZIP_ENTRY, '-d', cache])
  const extracted = join(cache, FONT_ZIP_ENTRY)
  await rename(extracted, fontPath)
  await rm(join(cache, 'SubsetOTF'), { recursive: true, force: true })
  const font = new Uint8Array(await readFile(fontPath))
  const sum = sha256(font)
  if (sum !== FONT_SHA256)
    throw new Error(`Source Han Sans KR checksum ${sum} != ${FONT_SHA256}`)
  return font
}

function loadEntries(tsv: string): WordEntry[] {
  const entries: WordEntry[] = []
  for (const line of tsv.split('\n')) {
    const row = line.endsWith('\r') ? line.slice(0, -1) : line
    if (!row)
      continue
    const tab = row.indexOf('\t')
    if (tab < 0)
      continue
    entries.push({ hanja: row.slice(0, tab), reading: row.slice(tab + 1) })
  }
  return entries
}

async function main(): Promise<void> {
  const dist = join(root, 'dist')
  await mkdir(dist, { recursive: true })
  await writeFile(join(root, 'demo', 'index.html'), renderDemo())

  const [font, khangul, tsv] = await Promise.all([
    ensureBaseFont(),
    readFile(join(root, 'data', 'khangul.json'), 'utf8'),
    readFile(join(root, 'data', 'ko-kr-stdict.tsv'), 'utf8'),
  ])
  const info = readFontInfo(font)
  console.log(`base font ${info.family} ${info.style}: ${info.glyphCount} glyphs, ${info.codepoints.length} codepoints`)
  const hbFont = new hb.Font(new hb.Face(new hb.Blob(font)))
  const glyphOf = new Map<number, number>()
  for (const cp of info.codepoints) {
    const glyph = hbFont.nominalGlyph(cp)
    if (glyph !== undefined)
      glyphOf.set(cp, glyph)
  }
  const underlying = loadUnderlying(JSON.parse(khangul) as Record<string, Record<string, string>>)
  const entries = loadEntries(tsv)
  const { plan, reader, report } = buildPlan({
    underlying,
    entries,
    coverage: new Set(info.codepoints),
    baseGlyphCount: info.glyphCount,
    glyphOf,
  })
  for (const sample of SAMPLES) {
    const got = reader.read(sample.text)
    if (got !== sample.reading)
      throw new Error(`${sample.text} reads ${got}, expected ${sample.reading}`)
  }
  console.log(report)
  await writeFile(join(dist, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)

  console.log(`planning ${plan.glyphs.length} glyphs`)
  const started = Date.now()
  let built
  try {
    built = await compileFont({
      plan,
      base: font,
      version: '0.1.0',
      date: new Date('2026-10-17T00:00:00Z'),
      subsetWasm,
      onProgress: (progress) => {
        if (progress.done == null || progress.done === progress.total || progress.done % 2000 === 0)
          console.log(`  ${progress.step}${progress.total == null ? '' : ` ${progress.done}/${progress.total}`}`)
      },
    })
  }
  catch (error) {
    await writeFile(join(dist, 'failed.fea'), plan.fea)
    throw error
  }
  const otf = join(dist, 'GukhanSans-Regular.otf')
  const woff2 = join(dist, 'GukhanSans-Regular.woff2')
  await writeFile(otf, built.font)
  console.log(`opentype ${built.font.byteLength} bytes in ${((Date.now() - started) / 1000).toFixed(1)}s`)
  console.log('compressing woff2')
  const web = await toWoff2(built.font, data => brotli(data, 11))
  await writeFile(woff2, web)
  console.log(`woff2 ${web.byteLength} bytes`)
  console.log(`wrote ${otf}`)
  console.log(`wrote ${woff2}`)
}

await main()
