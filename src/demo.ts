import { explainCss, explainHtml } from './explain.ts'
import { fileName, productName, WEIGHTS, type WeightName } from './families.ts'
import type { FamilyStyle } from './emit.ts'
import type { Region } from './region.ts'
import { SAMPLES } from './samples.ts'
import { codeBlockCss, copyScript, cssBlock } from './codeblock.ts'
import { githubOrigin, pagesBase, pagesOrigin } from './site.ts'

export interface DemoMetrics {
  /** unicode-range of the ko-KR Hanja add-on. */
  unicodeRange: string
  /** unicode-range of the ko-KP Hanja add-on. Falls back to the ko-KR range when that font was not built. */
  kpUnicodeRange: string
  rubyAscent: string
  replaceAscent: string
  descent: string
  lineGap: string
}

const REGIONS = ['ko-KR', 'ko-KP'] as const
const STYLES = ['ruby', 'replace'] as const

/**
 * Text set in Gowun Batang. The build subsets that face to these characters plus printable ASCII.
 * The face has no Hanja, so section numbers are Roman numerals rather than 第一.
 */
export const DISPLAY_COPY = [
  '국한문',
  'Ⅰ', '넣는 법',
  'Ⅱ', '써 보기',
  'Ⅲ', '굵기',
  'Ⅳ', '예문',
  'Ⅴ', '동작 방식',
  '글자',
  '라이선스',
  '바탕',
  '더 보기',
  '남한',
  '북한',
  '남한 · 북한',
  'ko-KR',
  'ko-KP',
  'ko-KR · ko-KP',
  '본문',
  '독음 애드온',
  '치환 애드온',
  '북한 독음',
  '폰트 패밀리',
  '지역',
  '파일',
  '독음',
  '웹 서브셋',
  '한자 애드온',
  'Gukhanmun Sans · OFL',
  'Gothic A1',
  'No. 01',
].join('')

/** Codepoints the landing page's display serif is allowed to contain. */
export function displayCodepoints(): number[] {
  const set = new Set<number>()
  for (let cp = 0x20; cp <= 0x7e; cp++)
    set.add(cp)
  for (const char of DISPLAY_COPY)
    set.add(char.codePointAt(0)!)
  return [...set].sort((a, b) => a - b)
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!)
}

function faceBlock(input: { family: string, weight: string, src: string, format?: string, range?: string, ascent?: string, descent?: string, lineGap?: string }): string {
  const extra = [
    input.range ? `unicode-range: ${input.range};` : '',
    input.ascent ? `ascent-override: ${input.ascent};` : '',
    input.descent ? `descent-override: ${input.descent};` : '',
    input.lineGap ? `line-gap-override: ${input.lineGap};` : '',
  ].filter(Boolean)
  return `@font-face {
        font-family: "${input.family}";
        src: url("${input.src}") format("${input.format ?? 'woff2'}");
        font-weight: ${input.weight};
        font-style: normal;
        font-display: swap;
        ${extra.join('\n        ')}
      }`
}

export type DemoProfile = 'local' | 'pages'

function fontSrc(profile: DemoProfile, file: string): string {
  return profile === 'pages' ? `fonts/${file}.woff2` : `../dist/${file}.woff2`
}

/** Hangul companion whose CSS metrics match that add-on. One file, two family names. */
export function hangulCompanion(style: 'ruby' | 'replace'): string {
  return style === 'ruby' ? 'Gothic A1 Ruby' : 'Gothic A1 Replace'
}

function fontFaces(metrics: DemoMetrics, profile: DemoProfile): string {
  const blocks: string[] = []
  const hanjaWeights = profile === 'pages' ? WEIGHTS.filter(weight => weight.name === 'Regular') : WEIGHTS
  for (const region of REGIONS) {
    for (const style of STYLES) {
      const vf = productName(style, region, 'vf')
      blocks.push(faceBlock({ family: vf.family, weight: '250 900', src: fontSrc(profile, fileName(style, region, 'vf')) }))
      const web = productName(style, region, 'web')
      blocks.push(faceBlock({ family: web.family, weight: '400', src: fontSrc(profile, fileName(style, region, 'web')) }))
      const hanja = productName(style, region, 'hanja')
      const ascent = style === 'ruby' ? metrics.rubyAscent : metrics.replaceAscent
      const range = region === 'ko-KP' ? metrics.kpUnicodeRange : metrics.unicodeRange
      for (const weight of hanjaWeights) {
        blocks.push(faceBlock({
          family: hanja.family,
          weight: String(weight.css),
          src: fontSrc(profile, fileName(style, region, 'hanja', weight.name)),
          range,
          ascent,
          descent: metrics.descent,
          lineGap: metrics.lineGap,
        }))
      }
    }
  }
  // Same outlines as Gukhanmun Sans Web, with the ideographic em instead of the ruby ascender.
  // 86/14 was measured so 國 (ss01, ruby off) centers in a line box of line-height 1.
  blocks.push(faceBlock({
    family: 'Gukhanmun Mark',
    weight: '400',
    src: fontSrc(profile, fileName('ruby', 'ko-KR', 'web')),
    ascent: '86%',
    descent: '14%',
    lineGap: '0%',
  }))
  const gothic = 'fonts/GothicA1-Regular.woff2'
  blocks.push(faceBlock({ family: 'Gothic A1', weight: '400', src: gothic }))
  blocks.push(faceBlock({ family: 'Gowun Batang', weight: '400', src: 'fonts/GowunBatang-Regular.woff2' }))
  blocks.push(faceBlock({
    family: hangulCompanion('ruby'),
    weight: '400',
    src: gothic,
    ascent: metrics.rubyAscent,
    descent: metrics.descent,
    lineGap: metrics.lineGap,
  }))
  blocks.push(faceBlock({
    family: hangulCompanion('replace'),
    weight: '400',
    src: gothic,
    ascent: metrics.replaceAscent,
    descent: metrics.descent,
    lineGap: metrics.lineGap,
  }))
  blocks.push(faceBlock({
    family: 'Hanja Box',
    weight: '400',
    src: 'fonts/HanjaBox.woff',
    format: 'woff',
    range: 'U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF',
  }))
  return blocks.join('\n')
}

/** WOFF2 files the Pages site copies from `dist/`. Gothic A1, Gowun Batang, and the Hanja box are copied beside them.
 *  Variable fonts are referenced only after the weight slider moves or the waterfall scrolls in. */
export function pagesDistFonts(): string[] {
  const names: string[] = []
  for (const region of REGIONS) {
    for (const style of STYLES) {
      names.push(`${fileName(style, region, 'web')}.woff2`)
      names.push(`${fileName(style, region, 'vf')}.woff2`)
      names.push(`${fileName(style, region, 'hanja', 'Regular')}.woff2`)
    }
  }
  return names
}

function familyOf(source: 'vf' | 'web' | 'addon', region: 'kr' | 'kp', family: 'sans' | 'hangul'): string {
  const style: FamilyStyle = family === 'sans' ? 'ruby' : 'replace'
  const regionId: Region = region === 'kr' ? 'ko-KR' : 'ko-KP'
  const kind = source === 'vf' ? 'vf' : source === 'web' ? 'web' : 'hanja'
  const name = productName(style, regionId, kind).family
  return source === 'addon' ? `"${name}", "${hangulCompanion(style)}", sans-serif` : `"${name}", sans-serif`
}

function selector(source: 'vf' | 'web' | 'addon', region: 'kr' | 'kp', family: 'sans' | 'hangul', target: string): string {
  const conds = [
    source === 'web' ? '' : `#${source}:checked`,
    region === 'kp' ? '#kp:checked' : '',
    family === 'hangul' ? '#hangul:checked' : '',
  ].filter(Boolean)
  const has = conds.map(cond => `:has(${cond})`).join('')
  return `.page${has} ${target}`
}

function familyRules(target: string): string {
  const lines: string[] = []
  for (const source of ['web', 'vf', 'addon'] as const) {
    for (const region of ['kr', 'kp'] as const) {
      for (const family of ['sans', 'hangul'] as const) {
        const weight = source === 'vf' ? '' : ' font-weight: 400;'
        lines.push(`      ${selector(source, region, family, target)} { font-family: ${familyOf(source, region, family)};${weight} }`)
      }
    }
  }
  return lines.join('\n')
}

/** Web-font specimens follow region and family. They do not pull the variable font. */
function specimenRules(): string {
  const lines = [
    '      .page .spec .sample, .page .glyphs span { font-family: "Gukhanmun Sans Web", sans-serif; }',
    '      .page:has(#kp:checked) .spec .sample, .page:has(#kp:checked) .glyphs span { font-family: "Gukhanmun Sans KP Web", sans-serif; }',
    '      .page:has(#hangul:checked) .spec .sample, .page:has(#hangul:checked) .glyphs span { font-family: "Gukhanmun Hangul Web", sans-serif; }',
    '      .page:has(#kp:checked):has(#hangul:checked) .spec .sample, .page:has(#kp:checked):has(#hangul:checked) .glyphs span { font-family: "Gukhanmun Hangul KP Web", sans-serif; }',
    '      .wsample { font-family: "Gukhanmun Sans Web", sans-serif; }',
    '      #weights.live .wsample { font-family: "Gukhanmun Sans VF", sans-serif; }',
    '      .page:has(#kp:checked) #weights.live .wsample { font-family: "Gukhanmun Sans KP VF", sans-serif; }',
    '      .page:has(#hangul:checked) #weights.live .wsample { font-family: "Gukhanmun Hangul VF", sans-serif; }',
    '      .page:has(#kp:checked):has(#hangul:checked) #weights.live .wsample { font-family: "Gukhanmun Hangul KP VF", sans-serif; }',
  ]
  return lines.join('\n')
}

/** Ready-to-copy stylesheet for the Hanja add-on. Paths are filenames in the same directory. */
export function renderHanjaCss(metrics: DemoMetrics, only?: { style: FamilyStyle, region: Region }): string {
  const blocks: string[] = []
  for (const region of REGIONS) {
    for (const style of STYLES) {
      if (only && (only.style !== style || only.region !== region))
        continue
      const hanja = productName(style, region, 'hanja')
      const ascent = style === 'ruby' ? metrics.rubyAscent : metrics.replaceAscent
      const range = region === 'ko-KP' ? metrics.kpUnicodeRange : metrics.unicodeRange
      for (const weight of WEIGHTS) {
        blocks.push(`@font-face {
  font-family: "${hanja.family}";
  src: url("${fileName(style, region, 'hanja', weight.name)}.woff2") format("woff2");
  font-weight: ${weight.css};
  font-style: normal;
  font-display: swap;
  unicode-range: ${range};
  ascent-override: ${ascent};
  descent-override: ${metrics.descent};
  line-gap-override: ${metrics.lineGap};
}`)
      }
    }
  }
  return `/* 한자 애드온. unicode-range 안의 한자만 이 글꼴이 그립니다. 한글과 라틴은 다음 글꼴로 넘어갑니다.
   독음(Gukhanmun Sans Hanja)은 글줄을 키우므로 line-height: 2 를 씁니다.
   본문 한글 글꼴에도 같은 ascent-override, descent-override, line-gap-override 를 주세요.
   독음은 ${metrics.rubyAscent}, 치환은 ${metrics.replaceAscent}라서 본문 글꼴의 폰트 패밀리를 둘로 나눕니다.
   size-adjust 로 본문 한글의 크기에 맞춥니다. 기본은 100%입니다. */
${blocks.join('\n')}
.gukhanmun-hanja {
  font-family: "Gukhanmun Sans Hanja", "Pretendard", sans-serif;
  line-height: 2;
}
.gukhanmun-hanja-replace {
  font-family: "Gukhanmun Hangul Hanja", "Pretendard", sans-serif;
}
`
}

export function installSnippets(metrics: DemoMetrics): { web: string, addon: string } {
  const webFamily = productName('ruby', 'ko-KR', 'web').family
  const hanjaFamily = productName('ruby', 'ko-KR', 'hanja').family
  const hangulHanja = productName('replace', 'ko-KR', 'hanja').family
  const web = `@font-face {
  font-family: "${webFamily}";
  src: url("${pagesOrigin()}/fonts/${fileName('ruby', 'ko-KR', 'web')}.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
.ruby {
  font-family: "${webFamily}", sans-serif;
  line-height: 2;
}`
  const addon = `@font-face {
  font-family: "${hanjaFamily}";
  src: url("${fileName('ruby', 'ko-KR', 'hanja', 'Regular')}.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
  unicode-range: /* 릴리스 hanja.css. cmap과 같은 목록 */;
  ascent-override: ${metrics.rubyAscent};
  descent-override: ${metrics.descent};
  line-gap-override: ${metrics.lineGap};
}
@font-face {
  font-family: "${hangulCompanion('ruby')}";
  src: url("GothicA1-Regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
  ascent-override: ${metrics.rubyAscent};
  descent-override: ${metrics.descent};
  line-gap-override: ${metrics.lineGap};
}
@font-face {
  font-family: "${hangulCompanion('replace')}";
  src: url("GothicA1-Regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
  ascent-override: ${metrics.replaceAscent};
  descent-override: ${metrics.descent};
  line-gap-override: ${metrics.lineGap};
}
.gukhanmun-hanja {
  font-family: "${hanjaFamily}", "${hangulCompanion('ruby')}", sans-serif;
  line-height: 2;
}
.gukhanmun-hangul {
  font-family: "${hangulHanja}", "${hangulCompanion('replace')}", sans-serif;
}`
  return { web, addon }
}

function readRow(label: string, loc: string, reading: string): string {
  return `<div class="read-row"><dt>${label} <span class="loc">${loc}</span></dt><dd>${escapeHtml(reading)}</dd></div>`
}

function sectionHead(numeral: string, title: string): string {
  return `<header class="sec-head"><h2><span class="sec-no">${numeral}</span> ${escapeHtml(title)}</h2></header>`
}

/** Landing page. The Pages profile is served under `/gukhanmun-font/`. Variable fonts load when the slider or the waterfall asks for them. */
export function renderDemo(metrics: DemoMetrics, profile: DemoProfile = 'local'): string {
  const snippet = installSnippets(metrics)
  const releases = `${githubOrigin()}/releases`
  const repo = githubOrigin()
  const ofl = `${githubOrigin()}/blob/main/OFL.txt`
  const cards = SAMPLES.map((sample, index) => {
    const notes = sample.note === sample.kpNote
      ? `<p class="note">${escapeHtml(sample.note)}</p>`
      : `<p class="note"><span class="where">남한</span> ${escapeHtml(sample.note)}</p><p class="note"><span class="where">북한</span> ${escapeHtml(sample.kpNote)}</p>`
    const rows = sample.reading === sample.kp
      ? readRow('남한 · 북한', 'ko-KR · ko-KP', sample.reading)
      : `${readRow('남한', 'ko-KR', sample.reading)}${readRow('북한', 'ko-KP', sample.kp)}`
    const number = String(index + 1).padStart(2, '0')
    return `          <figure class="spec">
            <div class="sheet">
              <figcaption>
                <div class="sheet-top">
                  <div class="notes">${notes}</div>
                  <p class="cat">No. ${number}</p>
                </div>
                <dl class="reads">${rows}</dl>
              </figcaption>
              <p class="sample">${escapeHtml(sample.text)}</p>
            </div>
          </figure>`
  }).join('\n')
  const waterfall = WEIGHTS.map(weight => `          <div class="wrow">
            <p class="wmeta">${weight.name} <span class="wnum">${weight.css}</span></p>
            <p class="wsample" style="--w:${weight.css}">國漢文混用으로 쓴 大韓民國</p>
          </div>`).join('\n')
  const webFile = `${fileName('ruby', 'ko-KR', 'web')}.woff2`
  const preload = profile === 'pages' ? `fonts/${webFile}` : `../dist/${webFile}`
  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
${profile === 'pages' ? `    <base href="${pagesBase()}">\n` : ''}    <title>국한문 Gukhanmun — 한자 위에 독음을 그리는 글꼴</title>
    <meta name="description" content="한자는 그대로 두고, 독음만 그립니다. 독음 달기와 한글로 바꾸기, 남한·북한 독음, 가변 폰트.">
    <meta property="og:title" content="국한문 Gukhanmun">
    <meta property="og:description" content="한자는 그대로 두고, 독음만 그립니다.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${pagesOrigin()}/">
    <meta name="twitter:card" content="summary">
    <link rel="preload" href="${preload}" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="fonts/GothicA1-Regular.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="fonts/GowunBatang-Regular.woff2" as="font" type="font/woff2" crossorigin>
    <style>
      ${fontFaces(metrics, profile)}
      :root {
        color-scheme: light;
        --paper: #f3efe4;
        --ink: #1c1915;
        --muted: #4a433c;
        --rule: #ddd4c4;
        --cinnabar: #8c2f2b;
        --indigo: #243856;
        --chip: #efe6d6;
        --ui: "Gothic A1", sans-serif;
        --display: "Gowun Batang", "Gothic A1", serif;
        --bar: 4.5rem;
      }
      * { box-sizing: border-box; }
      html { background: var(--paper); color: var(--ink); }
      body {
        margin: 0;
        background: var(--paper);
        color: var(--ink);
        font-family: var(--ui);
        font-size: 1.0625rem;
        font-weight: 400;
        font-synthesis: none;
        line-height: 1.75;
        word-break: keep-all;
        overflow-wrap: anywhere;
        text-wrap: pretty;
        overflow-x: clip;
      }
      .wrap { max-width: 72rem; margin: 0 auto; padding: 0 clamp(1.25rem, 4.5vw, 4rem); }
      .bar {
        position: sticky;
        top: 0;
        z-index: 4;
        background: var(--paper);
        border-bottom: 1px solid var(--rule);
      }
      .bar-inner {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem 1.4rem;
        padding-top: 0.7rem;
        padding-bottom: 0.7rem;
      }
      .mark {
        color: var(--cinnabar);
        text-decoration: none;
        font-family: var(--display);
        font-size: 1.12rem;
        letter-spacing: 0.18em;
        line-height: 1.2;
      }
      .nav {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: 0.25rem 1.15rem;
        min-width: 0;
      }
      .nav a {
        color: var(--ink);
        text-decoration: none;
        font-size: 0.92rem;
        line-height: 1.2;
        white-space: nowrap;
      }
      .nav a:hover { color: var(--cinnabar); }
      .hero {
        position: relative;
        padding: clamp(3.5rem, 9vw, 7.5rem) 0 clamp(3.2rem, 7vw, 6rem);
        scroll-margin-top: calc(var(--bar) + 0.45rem);
        background-image:
          linear-gradient(to right, rgba(28, 25, 21, 0.045) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(28, 25, 21, 0.045) 1px, transparent 1px);
        background-size: 4.5rem 4.5rem;
        background-position: -1px -1px;
      }
      .hero-top {
        display: flex;
        align-items: center;
        gap: 1rem 1.25rem;
      }
      .seal {
        flex: 0 0 auto;
        width: 3.6rem;
        height: 3.6rem;
        display: grid;
        place-items: center;
        margin: 0;
        background: var(--cinnabar);
        color: var(--paper);
        font-family: "Gukhanmun Mark", "Gukhanmun Sans Web", sans-serif;
        font-feature-settings: "ss01" 1;
        font-size: 1.7rem;
        line-height: 1;
      }
      .kicker {
        margin: 0;
        color: var(--muted);
        font-family: var(--display);
        font-size: 0.78rem;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }
      .hero-lockup {
        margin-top: clamp(1.8rem, 4vw, 3rem);
        padding-left: clamp(0.9rem, 2vw, 1.5rem);
        border-left: 1px solid var(--cinnabar);
      }
      h1 {
        margin: 0;
        font-family: "Gukhanmun Sans Web", sans-serif;
        font-weight: 400;
        font-size: clamp(3.15rem, 10.2vw, 7.15rem);
        line-height: 2.05;
        letter-spacing: 0;
      }
      .tagline {
        margin: 0.15rem 0 0;
        max-width: 16em;
        font-size: clamp(1.35rem, 2.2vw, 1.85rem);
        line-height: 1.45;
      }
      .sub { margin: 0.85rem 0 0; max-width: 34em; color: var(--muted); }
      .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.85rem 1.3rem; margin-top: 1.8rem; }
      .btn {
        display: inline-block;
        background: var(--cinnabar);
        color: var(--paper);
        text-decoration: none;
        padding: 0.72rem 1.25rem;
        border-radius: 2px;
        border: 1px solid var(--cinnabar);
      }
      .btn:hover { background: #6e2622; border-color: #6e2622; }
      .btn.text {
        background: transparent;
        color: var(--ink);
        border-color: transparent;
        padding: 0.72rem 0;
        text-decoration: underline;
        text-underline-offset: 0.28em;
        text-decoration-color: var(--rule);
      }
      .btn.text:hover { color: var(--cinnabar); text-decoration-color: var(--cinnabar); background: transparent; }
      .block { padding: clamp(4.2rem, 9vw, 7rem) 0; border-top: 1px solid var(--rule); scroll-margin-top: calc(var(--bar) + 0.45rem); }
      .sec-head {
        margin: 0 0 1.35rem;
        padding-bottom: 0.55rem;
        border-bottom: 3px double var(--ink);
      }
      .sec-head h2, .how .sec-head h2 {
        margin: 0;
        font-family: var(--display);
        font-size: clamp(1.85rem, 3.1vw, 2.6rem);
        font-weight: 400;
        line-height: 1.25;
        letter-spacing: 0;
      }
      .sec-no {
        color: var(--cinnabar);
        font-size: 0.62em;
        letter-spacing: 0.14em;
        margin-right: 0.35rem;
      }
      h2 {
        margin: 0 0 0.85rem;
        font-family: var(--display);
        font-size: clamp(1.85rem, 3.1vw, 2.6rem);
        font-weight: 400;
        line-height: 1.25;
        letter-spacing: 0;
      }
      .lead { margin: 0 0 1.5rem; max-width: 38em; color: var(--muted); }
      .glyph-title { margin: 2.8rem 0 0.4rem; font-family: var(--display); font-size: 1.35rem; font-weight: 400; letter-spacing: 0.04em; }
      .snippet { margin: 1.4rem 0 0; }
      .snippet-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.8rem;
        margin-bottom: 0.4rem;
      }
      .snippet h3 { margin: 0; font-family: var(--display); font-size: 1.15rem; font-weight: 400; letter-spacing: 0.03em; }
      button.copy {
        font: inherit;
        font-size: 0.88rem;
        color: var(--ink);
        background: transparent;
        border: 1px solid var(--rule);
        border-radius: 999px;
        padding: 0.25rem 0.7rem;
        cursor: pointer;
      }
      .stage {
        display: block;
        width: 100%;
        min-height: 5.2em;
        margin: 0 0 1.6rem;
        padding: 0.2rem 0 0.55rem;
        border: 0;
        border-bottom: 1px solid var(--rule);
        border-radius: 0;
        resize: vertical;
        background: transparent;
        color: var(--ink);
        font-family: "Gukhanmun Sans Web", sans-serif;
        font-weight: 400;
        font-size: 48px;
        line-height: 2.05;
        overflow-wrap: anywhere;
      }
      .stage:focus { outline: none; border-bottom-color: var(--cinnabar); }
      .controls {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.35rem 2.2rem;
        align-items: end;
      }
      .slider, fieldset { margin: 0; }
      .slider {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.75rem;
        color: var(--muted);
        font-size: 0.88rem;
      }
      .slider input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 1.1rem;
        margin: 0;
        background: transparent;
        cursor: pointer;
      }
      .slider input[type="range"]::-webkit-slider-runnable-track {
        height: 1px;
        background: var(--ink);
      }
      .slider input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 0.85rem;
        height: 0.85rem;
        margin-top: -0.4rem;
        border: 0;
        border-radius: 50%;
        background: var(--cinnabar);
      }
      .slider input[type="range"]::-moz-range-track {
        height: 1px;
        background: var(--ink);
        border: 0;
      }
      .slider input[type="range"]::-moz-range-thumb {
        width: 0.85rem;
        height: 0.85rem;
        border: 0;
        border-radius: 50%;
        background: var(--cinnabar);
      }
      .slider output { color: var(--ink); min-width: 2.2rem; text-align: right; font-variant-numeric: tabular-nums; }
      fieldset { border: 0; padding: 0; min-width: 0; }
      legend { padding: 0; margin-bottom: 0.5rem; color: var(--muted); font-family: var(--display); font-size: 0.92rem; letter-spacing: 0.04em; }
      .choice {
        display: flex;
        flex-wrap: nowrap;
        gap: 0.2rem;
        width: fit-content;
        max-width: 100%;
        padding: 0.2rem;
        border: 1px solid var(--rule);
        border-radius: 999px;
      }
      .choice label {
        position: relative;
        border-radius: 999px;
        padding: 0.38rem 0.8rem;
        cursor: pointer;
        color: var(--ink);
        line-height: 1.25;
        white-space: nowrap;
      }
      .choice .brief { display: none; }
      .choice input {
        position: absolute;
        inset: 0;
        opacity: 0;
        margin: 0;
        cursor: pointer;
      }
      .choice label:has(input:checked) {
        background: var(--ink);
        color: var(--paper);
      }
      .choice label:focus-within { outline: 2px solid var(--cinnabar); outline-offset: 2px; }
      .switch {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 0.65rem;
        cursor: pointer;
      }
      .switch input {
        position: absolute;
        inset: 0;
        opacity: 0;
        margin: 0;
        cursor: pointer;
      }
      .switch i {
        width: 2.3rem;
        height: 1.28rem;
        border: 1px solid var(--ink);
        border-radius: 999px;
        background: radial-gradient(circle at 0.68rem 50%, var(--ink) 0.36rem, transparent 0.4rem);
        font-style: normal;
      }
      .page:has(#ss01:checked) .switch i {
        border-color: var(--cinnabar);
        background:
          radial-gradient(circle at calc(100% - 0.68rem) 50%, var(--paper) 0.36rem, transparent 0.4rem),
          var(--cinnabar);
      }
      .switch:focus-within { outline: 2px solid var(--cinnabar); outline-offset: 3px; }
${familyRules('.stage')}
      .page:has(#ss01:checked) .stage { font-feature-settings: "ss01" 1; }
      .page:has(#ss01:checked):has(#hangul:checked) .stage { font-feature-settings: "ss01" 0; }
      .wrow {
        display: grid;
        grid-template-columns: 9.2rem 1fr;
        gap: 0.15rem 1.5rem;
        align-items: center;
        border-top: 1px solid var(--rule);
        padding: 0.85rem 0 0.35rem;
      }
      .wrow:first-child { border-top: 3px double var(--ink); }
      .wrow:last-child { border-bottom: 3px double var(--ink); }
      .wmeta { margin: 0; color: var(--muted); font-family: var(--display); font-size: 0.84rem; font-weight: 400; line-height: 1.4; letter-spacing: 0.08em; }
      .wnum { display: block; color: var(--ink); letter-spacing: 0; font-variant-numeric: tabular-nums; }
      .wsample {
        margin: 0;
        font-size: clamp(1.85rem, 3.6vw, 3.15rem);
        line-height: 2.05;
        font-weight: 400;
        overflow-wrap: anywhere;
      }
      #weights.live .wsample { font-weight: var(--w); font-synthesis: none; }
${specimenRules()}
      .specs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.15rem;
      }
      .spec {
        margin: 0;
        padding: 0.32rem;
        border: 1px solid var(--ink);
      }
      .sheet {
        border: 1px solid var(--rule);
        padding: 0.95rem 1.05rem 1.15rem;
      }
      .spec figcaption { margin: 0; }
      .sheet-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem 1rem;
      }
      .notes { min-width: 0; }
      .note {
        margin: 0;
        color: var(--muted);
        font-size: 0.9rem;
        line-height: 1.55;
      }
      .note + .note { margin-top: 0.2rem; }
      .where {
        font-family: var(--display);
        color: var(--cinnabar);
        font-size: 0.78rem;
        letter-spacing: 0.06em;
        margin-right: 0.2rem;
      }
      .cat {
        margin: 0.15rem 0 0;
        flex: 0 0 auto;
        color: var(--muted);
        font-family: var(--display);
        font-size: 0.72rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .reads { margin: 0.7rem 0 0; }
      .read-row { margin-top: 0.35rem; }
      .reads dt {
        margin: 0;
        color: var(--muted);
        font-family: var(--display);
        font-size: 0.75rem;
        font-weight: 400;
        letter-spacing: 0.04em;
      }
      .reads .loc { letter-spacing: 0.08em; }
      .reads dd {
        margin: 0.05rem 0 0;
        color: var(--cinnabar);
        font-size: 0.98rem;
        line-height: 1.45;
      }
      .spec .sample {
        margin: 0.75rem 0 0;
        padding-top: 0.45rem;
        border-top: 1px solid var(--rule);
        font-size: clamp(1.65rem, 2.5vw, 2.35rem);
        line-height: 2.05;
        font-weight: 400;
        overflow-wrap: anywhere;
      }
      .glyphs {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        margin-top: 1.6rem;
        border-top: 1px solid var(--rule);
        border-left: 1px solid var(--rule);
      }
      .glyphs span {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        padding: 0.15rem 0.2rem;
        border-right: 1px solid var(--rule);
        border-bottom: 1px solid var(--rule);
        font-weight: 400;
        font-size: clamp(1.55rem, 2.8vw, 2.35rem);
        line-height: 2.05;
        text-align: center;
      }
      /* The ruby ascender leaves the drawn ink high in the line box. Measured on the grid. */
      .glyphs b {
        font-weight: inherit;
        line-height: inherit;
        transform: translateY(0.105em);
      }
      .layer-label {
        margin: 0.85rem 0 0;
        color: var(--muted);
        font-family: var(--display);
        font-size: 0.78rem;
        letter-spacing: 0.06em;
      }
      .layer-label .loc { letter-spacing: 0.1em; }
      .layer-body { font-family: "Gothic A1", "Hanja Box"; color: var(--indigo); }
      .layer-ruby { font-family: "Gukhanmun Sans Hanja", "${hangulCompanion('ruby')}", sans-serif; }
      .layer-replace { font-family: "Gukhanmun Hangul Hanja", "${hangulCompanion('replace')}", sans-serif; color: var(--indigo); }
      .layer-kp { font-family: "Gukhanmun Sans KP Hanja", "${hangulCompanion('ruby')}", sans-serif; }
${explainCss()}
      .how {
        margin-top: 0;
        padding: clamp(3rem, 7vw, 5.5rem) 0;
        border-top: 1px solid var(--rule);
        scroll-margin-top: calc(var(--bar) + 0.45rem);
      }
      .how svg { max-width: 100%; height: auto; }
      .credit { margin: 0.35rem 0; }
      .how a, .foot a, .lead a { color: var(--cinnabar); }
      .how h2 {
        font-family: var(--display);
        font-size: clamp(1.85rem, 3.1vw, 2.6rem);
        font-weight: 400;
        letter-spacing: 0;
        line-height: 1.25;
        margin: 0 0 0.85rem;
      }
      .foot {
        padding: clamp(3.2rem, 7vw, 5rem) 0 clamp(2.6rem, 5vw, 3.5rem);
        border-top: 3px double var(--ink);
        scroll-margin-top: calc(var(--bar) + 0.45rem);
      }
      .foot-grid {
        display: grid;
        grid-template-columns: 1.3fr 1.4fr 0.8fr;
        gap: 1.5rem 2.5rem;
      }
      .foot-label {
        margin: 0 0 0.55rem;
        color: var(--muted);
        font-family: var(--display);
        font-size: 0.78rem;
        letter-spacing: 0.14em;
      }
      .fn {
        color: var(--cinnabar);
        margin-right: 0.15rem;
        letter-spacing: 0.08em;
      }
      .foot p { margin: 0.3rem 0; max-width: 38em; }
      .foot nav { display: flex; flex-direction: column; align-items: flex-start; gap: 0.35rem; }
      .foot nav a { text-decoration: underline; text-underline-offset: 0.22em; text-decoration-color: var(--rule); }
      code {
        font-family: ui-monospace, monospace;
        font-size: 0.88em;
        background: var(--chip);
        color: var(--ink);
        padding: 0.08em 0.32em;
        border-radius: 0.25em;
      }
      pre {
        margin: 0;
        background: #1c1915;
        color: #f3efe4;
        padding: 0.9rem 1rem;
        max-width: 100%;
        overflow-x: auto;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
        text-wrap: wrap;
        font-size: 0.82rem;
        line-height: 1.5;
      }
      pre code { background: transparent; color: inherit; padding: 0; font-size: 1em; }
      ${codeBlockCss()}
      :focus-visible { outline: 2px solid var(--cinnabar); outline-offset: 2px; }
      @media (prefers-reduced-motion: reduce) {
        .btn, .nav a, .choice label { transition: none; }
      }
      @media (max-width: 860px) {
        :root { --bar: 3.35rem; }
        .bar-inner { padding-top: 0.45rem; padding-bottom: 0.45rem; gap: 0.7rem; }
        .mark { font-size: 1rem; letter-spacing: 0.1em; flex: 0 0 auto; }
        .nav {
          flex: 1 1 auto;
          justify-content: safe flex-end;
          overflow-x: auto;
          overscroll-behavior-x: contain;
          gap: 0.55rem;
          scrollbar-width: none;
        }
        .nav a { font-size: 0.84rem; }
        .nav::-webkit-scrollbar { display: none; }
        .choice {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
          width: 100%;
          border-radius: 2px;
        }
        .choice label {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 0;
          border-radius: 2px;
          padding: 0.5rem 0.3rem;
          text-align: center;
        }
        .choice .full { display: none; }
        .choice .brief { display: inline; }
        .specs { grid-template-columns: 1fr; }
        .glyphs { grid-template-columns: repeat(3, 1fr); }
        .foot-grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 720px) {
        .controls { grid-template-columns: 1fr; min-width: 0; }
        .stage { font-size: 32px; }
        .wrow { grid-template-columns: 1fr; gap: 0.1rem; padding-top: 0.85rem; }
        .hero-lockup { max-width: none; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="bar">
        <div class="wrap bar-inner">
          <a class="mark" href="${profile === 'pages' ? pagesBase() : './'}">국한문</a>
          <nav class="nav" aria-label="페이지">
            <a href="${pagesBase()}playground/">놀이터</a>
            <a href="#try">써 보기</a>
            <a href="#weights">굵기</a>
            <a href="#specimens">예문</a>
            <a href="#how">동작</a>
            <a href="#license">라이선스</a>
          </nav>
        </div>
      </header>
      <section class="hero">
        <div class="wrap">
          <div class="hero-top">
            <p class="seal" aria-hidden="true">國</p>
            <p class="kicker">Gukhanmun Sans · OFL</p>
          </div>
          <div class="hero-lockup">
            <h1>國漢文混用</h1>
          </div>
          <p class="tagline">한자는 그대로 두고, 독음만 그립니다.</p>
          <p class="sub">OpenType 셰이핑으로 독음을 붙입니다. <code>&lt;ruby&gt;</code>도 자바스크립트도 필요 없고, 복사하면 한자입니다.</p>
          <div class="actions">
            <a class="btn" href="${releases}">다운로드</a>
            <a class="btn text" href="${repo}">저장소</a>
          </div>
        </div>
      </section>
      <div class="wrap">
        <section class="block" id="use">
          ${sectionHead('Ⅰ', '넣는 법')}
          <p class="lead">파일은 <a href="${releases}">GitHub 릴리스</a>에 있습니다. 웹 서브셋은 Regular 하나이고, 이 주소로도 바로 쓸 수 있습니다. 일곱 굵기의 정적 파일과 가변 폰트, 한자 애드온은 zip 안에 있습니다. 독음은 <code>line-height</code>를 2로 둡니다.</p>
          <div class="snippet">
            <div class="snippet-head">
              <h3>웹 서브셋</h3>
            </div>
            ${cssBlock('css-web', snippet.web)}
          </div>
          <div class="snippet">
            <div class="snippet-head">
              <h3>한자 애드온</h3>
            </div>
            <p class="lead">애드온은 한글 글꼴 앞에 둡니다. 그 한글 글꼴에도 같은 어센더, 디센더, 라인갭을 주세요. 독음은 ${escapeHtml(metrics.rubyAscent)}, 치환은 ${escapeHtml(metrics.replaceAscent)}입니다. 값이 다르면 한자가 있는 줄과 없는 줄의 높이가 달라집니다. <code>unicode-range</code> 전체는 릴리스의 <code>hanja.css</code>에 있습니다.</p>
            ${cssBlock('css-addon', snippet.addon)}
          </div>
        </section>

        <section class="block" id="try">
          ${sectionHead('Ⅱ', '써 보기')}
          <p class="lead">문장을 고쳐 보세요. 크기, 굵기, 남한·북한 독음, 독음 달기와 한글로 바꾸기, 한자 애드온을 바꿉니다. 굵기 슬라이더는 가변 폰트를 받습니다. 이 페이지의 애드온은 Regular입니다. 복사하면 한자입니다.</p>
          <label class="visually-hidden" for="stage">시험할 문장</label>
          <textarea id="stage" class="stage" spellcheck="false" autocomplete="off">大韓民國의 音樂과 平壤 冷麵.</textarea>
          <div class="controls">
            <label class="slider">크기
              <input id="size" type="range" min="18" max="96" value="48" step="1">
              <output id="size-out" for="size">48</output>
            </label>
            <label class="slider">굵기
              <input id="wght" type="range" min="250" max="900" value="400" step="10">
              <output id="wght-out" for="wght">400</output>
            </label>
            <fieldset>
              <legend>폰트 패밀리</legend>
              <div class="choice">
                <label><input id="sans" name="family" type="radio" checked><span class="full">독음 Gukhanmun Sans</span><span class="brief">독음</span></label>
                <label><input id="hangul" name="family" type="radio"><span class="full">한글 Gukhanmun Hangul</span><span class="brief">한글</span></label>
              </div>
            </fieldset>
            <fieldset>
              <legend>지역</legend>
              <div class="choice">
                <label><input id="kr" name="region" type="radio" checked><span class="full">남한 ko-KR</span><span class="brief">남한</span></label>
                <label><input id="kp" name="region" type="radio"><span class="full">북한 ko-KP</span><span class="brief">북한</span></label>
              </div>
            </fieldset>
            <fieldset>
              <legend>파일</legend>
              <div class="choice">
                <label><input id="web" name="source" type="radio" checked><span class="full">웹 서브셋</span><span class="brief">웹</span></label>
                <label><input id="vf" name="source" type="radio"><span class="full">가변 폰트</span><span class="brief">가변</span></label>
                <label><input id="addon" name="source" type="radio"><span class="full">한자 애드온</span><span class="brief">애드온</span></label>
              </div>
            </fieldset>
            <fieldset>
              <legend>독음</legend>
              <label class="switch"><input id="ss01" type="checkbox"><i aria-hidden="true"></i>독음 끄기 (<code>ss01</code>)</label>
            </fieldset>
          </div>
        </section>

        <section class="block" id="weights">
          ${sectionHead('Ⅲ', '굵기')}
          <p class="lead">ExtraLight부터 Heavy까지입니다. 이 목록이 화면에 들어올 때 가변 폰트를 받습니다. 지금은 고른 폰트 패밀리와 지역을 따릅니다.</p>
${waterfall}
        </section>

        <section class="block" id="specimens">
          ${sectionHead('Ⅳ', '예문')}
          <p class="lead">국한문혼용 문장입니다. 웹 서브셋으로 그립니다. 작은 글은 남한 ko-KR과 북한 ko-KP 독음이고, 같으면 한 줄입니다. 지역과 폰트 패밀리를 바꾸면 큰 글자의 독음이 바뀝니다.</p>
          <div class="specs">
${cards}
          </div>
          <h3 class="glyph-title">글자</h3>
          <p class="lead">한 칸에 한 글자입니다. 독음은 글꼴이 그립니다.</p>
          <div class="glyphs" aria-label="한자 견본">
            ${['國', '漢', '文', '混', '用', '樂', '女', '男', '冷', '六', '月', '律', '來', '難', '問', '平', '壤', '麵'].map(char => `<span><b>${char}</b></span>`).join('')}
          </div>
        </section>

${explainHtml()}

        <footer class="foot" id="license">
          <div class="foot-grid">
            <div>
              <p class="foot-label"><span class="fn">1</span> 라이선스</p>
              <p>글꼴은 <a href="${ofl}">SIL OFL 1.1</a>로 배포합니다. <a href="https://github.com/adobe-fonts/source-han-sans">본고딕(Source Han Sans)</a>을 바탕으로 만들었지만, OFL 조건에 따라 원본의 예약 글꼴 이름인 Source는 쓰지 않습니다. 저장소 코드는 MIT 라이선스입니다.</p>
            </div>
            <div>
              <p class="foot-label"><span class="fn">2</span> 출처</p>
              <p>글자 모양은 Adobe의 <a href="https://github.com/adobe-fonts/source-han-sans">본고딕(Source Han Sans KR)</a>을 바탕으로 했습니다.</p>
              <p>남한 독음은 <a href="https://github.com/dahlia/seonbi">dahlia의 선비</a>에서, 북한 독음은 <a href="https://gukhanmun.org/">dahlia의 gukhanmun</a>이 2026년 6월 3일 <a href="https://opendict.korean.go.kr/">우리말샘</a>에서 추린 단어 목록에서 가져왔습니다. gukhanmun은 국한문혼용 글을 한글로 바꿔 주는 라이브러리로, 이 글꼴과는 별개의 프로젝트입니다.</p>
              <p>남한 단어는 국립국어원 <a href="https://stdict.korean.go.kr/">표준국어대사전</a>에서, 북한 단어는 국립국어원 <a href="https://opendict.korean.go.kr/">우리말샘</a>에서 왔으며, 둘 다 <a href="https://creativecommons.org/licenses/by-sa/2.0/kr/">CC BY-SA 2.0 KR</a>입니다.</p>
              <p>글꼴 빌드에는 <a href="https://github.com/antfu/furifont">Anthony Fu의 furifont</a>를 썼습니다.</p>
              <p>이 페이지의 본문 서체는 <a href="https://fonts.google.com/specimen/Gothic+A1">Gothic A1</a>(OFL)이며, 한자 애드온과 함께 쓸 때 줄 높이가 맞도록 메트릭을 조정했습니다. 제목은 류양희의 <a href="https://github.com/yangheeryu/Gowun-Batang">고운바탕</a>(OFL)입니다.</p>
            </div>
            <div>
              <p class="foot-label"><span class="fn">3</span> 더 보기</p>
              <nav aria-label="바깥 링크">
                <a href="${pagesBase()}playground/">놀이터</a>
                <a href="${repo}">저장소</a>
                <a href="${releases}">릴리스</a>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    </div>
    <style>
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
      }
    </style>
    <script>
      (function () {
        var size = document.getElementById('size')
        var wght = document.getElementById('wght')
        var stage = document.getElementById('stage')
        var vf = document.getElementById('vf')
        var web = document.getElementById('web')
        var addon = document.getElementById('addon')
        if (window.matchMedia('(max-width: 720px)').matches && size.value === '48')
          size.value = '32'
        function sync() {
          stage.style.fontSize = size.value + 'px'
          document.getElementById('size-out').textContent = size.value
          document.getElementById('wght-out').textContent = wght.value
          stage.style.fontWeight = vf.checked ? wght.value : '400'
        }
        size.addEventListener('input', sync)
        wght.addEventListener('input', function () {
          if (!vf.checked) vf.checked = true
          sync()
        })
        web.addEventListener('change', function () { wght.value = '400'; sync() })
        addon.addEventListener('change', function () { wght.value = '400'; sync() })
        vf.addEventListener('change', sync)
        sync()
        var weights = document.getElementById('weights')
        if (weights && 'IntersectionObserver' in window) {
          var io = new IntersectionObserver(function (entries) {
            if (entries.some(function (entry) { return entry.isIntersecting })) {
              weights.classList.add('live')
              io.disconnect()
            }
          }, { rootMargin: '280px' })
          io.observe(weights)
        } else if (weights) {
          weights.classList.add('live')
        }
        ${copyScript()}
      })()
    </script>
  </body>
</html>
`
}

export type { WeightName }
