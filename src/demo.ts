import { explainCss, explainHtml } from './explain.ts'
import { fileName, productName, WEIGHTS, type WeightName } from './families.ts'
import type { FamilyStyle } from './emit.ts'
import type { Region } from './region.ts'
import { SAMPLES } from './samples.ts'

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

/** Project-site prefix. Relative `fonts/` URLs resolve here even when the path has no trailing slash. */
export const PAGES_BASE = '/gukhan-font/'

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
  const gothic = 'fonts/GothicA1-Regular.woff2'
  blocks.push(faceBlock({ family: 'Gothic A1', weight: '400', src: gothic }))
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

/** WOFF2 files the Pages site copies from `dist/`. Gothic A1 and the Hanja box are copied beside them.
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
    '      .page .spec p { font-family: "Gukhan Sans Web", sans-serif; }',
    '      .page:has(#kp:checked) .spec p { font-family: "Gukhan Sans KP Web", sans-serif; }',
    '      .page:has(#hangul:checked) .spec p { font-family: "Gukhan Hangul Web", sans-serif; }',
    '      .page:has(#kp:checked):has(#hangul:checked) .spec p { font-family: "Gukhan Hangul KP Web", sans-serif; }',
    '      .wsample { font-family: "Gukhan Sans Web", sans-serif; }',
    '      #weights.live .wsample { font-family: "Gukhan Sans VF", sans-serif; }',
    '      .page:has(#kp:checked) #weights.live .wsample { font-family: "Gukhan Sans KP VF", sans-serif; }',
    '      .page:has(#hangul:checked) #weights.live .wsample { font-family: "Gukhan Hangul VF", sans-serif; }',
    '      .page:has(#kp:checked):has(#hangul:checked) #weights.live .wsample { font-family: "Gukhan Hangul KP VF", sans-serif; }',
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
   루비(Gukhan Sans Hanja)는 글줄을 키우므로 line-height: 2 를 씁니다.
   본문 한글 글꼴에도 같은 ascent-override, descent-override, line-gap-override 를 주세요.
   루비는 133%, 치환은 116%라서 본문 글꼴의 폰트 패밀리를 둘로 나눕니다.
   size-adjust 로 본문 한글의 크기에 맞춥니다. 기본은 100%입니다. */
${blocks.join('\n')}
.gukhan-hanja {
  font-family: "Gukhan Sans Hanja", "Pretendard", sans-serif;
  line-height: 2;
}
.gukhan-hanja-replace {
  font-family: "Gukhan Hangul Hanja", "Pretendard", sans-serif;
}
`
}

function cssSnippet(metrics: DemoMetrics): { web: string, addon: string } {
  const web = `@font-face {
  font-family: "Gukhan Sans Web";
  src: url("https://morealdot.github.io/gukhan-font/fonts/GukhanSans-Web.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
.ruby {
  font-family: "Gukhan Sans Web", sans-serif;
  line-height: 2;
}`
  const addon = `@font-face {
  font-family: "Gukhan Sans Hanja";
  src: url("GukhanSansHanja-Regular.woff2") format("woff2");
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
.gukhan-hanja {
  font-family: "Gukhan Sans Hanja", "${hangulCompanion('ruby')}", sans-serif;
  line-height: 2;
}
.gukhan-hangul {
  font-family: "Gukhan Hangul Hanja", "${hangulCompanion('replace')}", sans-serif;
}`
  return { web, addon }
}

const RELEASES = 'https://github.com/morealdot/gukhan-font/releases'
const REPO = 'https://github.com/morealdot/gukhan-font'

/** Landing page. `pages` is served under `/gukhan-font/`. Variable fonts load when the slider or the waterfall asks for them. */
export function renderDemo(metrics: DemoMetrics, profile: DemoProfile = 'local'): string {
  const snippet = cssSnippet(metrics)
  const cards = SAMPLES.map(sample => `          <figure class="spec">
            <figcaption>
              <span class="kr-note">${escapeHtml(sample.note)}</span>
              <span class="kp-note">${escapeHtml(sample.kpNote)}</span>
              <span class="read kr-read">${escapeHtml(sample.reading)}</span>
              <span class="read kp-read">${escapeHtml(sample.kp)}</span>
            </figcaption>
            <p>${escapeHtml(sample.text)}</p>
          </figure>`).join('\n')
  const waterfall = WEIGHTS.map(weight => `          <div class="wrow">
            <p class="wmeta">${weight.name} <span class="wnum">${weight.css}</span></p>
            <p class="wsample" style="--w:${weight.css}">國漢文混用으로 쓴 大韓民國</p>
          </div>`).join('\n')
  const preload = profile === 'pages' ? 'fonts/GukhanSans-Web.woff2' : '../dist/GukhanSans-Web.woff2'
  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
${profile === 'pages' ? `    <base href="${PAGES_BASE}">\n` : ''}    <title>국한 Gukhan — 한자 위에 독음을 그리는 글꼴</title>
    <meta name="description" content="한자는 그대로 두고, 독음만 그립니다. 루비와 치환, 남한·북한 독음, 가변 폰트.">
    <link rel="preload" href="${preload}" as="font" type="font/woff2" crossorigin>
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
      }
      * { box-sizing: border-box; }
      html { background: var(--paper); color: var(--ink); }
      body {
        margin: 0;
        background: var(--paper);
        color: var(--ink);
        font-family: "Iowan Old Style", Palatino, "Palatino Linotype", "Songti SC", serif;
        font-size: 1.05rem;
        line-height: 1.65;
        overflow-x: clip;
      }
      .wrap { max-width: 68rem; margin: 0 auto; padding: 0 clamp(1.15rem, 4vw, 3.5rem); }
      .bar {
        position: sticky;
        top: 0;
        z-index: 2;
        background: var(--paper);
        border-bottom: 1px solid var(--rule);
      }
      .bar-inner {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.6rem 1.2rem;
        padding-top: 0.85rem;
        padding-bottom: 0.85rem;
      }
      .mark {
        color: var(--ink);
        text-decoration: none;
        font-size: 1.15rem;
        letter-spacing: 0.04em;
      }
      .nav { display: flex; flex-wrap: wrap; gap: 0.35rem 0.95rem; }
      .nav a {
        color: var(--ink);
        text-decoration: underline;
        text-underline-offset: 0.22em;
        text-decoration-color: var(--rule);
        font-size: 0.95rem;
      }
      .nav a:hover { color: var(--cinnabar); text-decoration-color: var(--cinnabar); }
      .hero { padding: clamp(2.6rem, 7vw, 5.5rem) 0 clamp(2.2rem, 5vw, 4rem); scroll-margin-top: 4.5rem; }
      .kicker {
        margin: 0 0 0.8rem;
        color: var(--muted);
        font-size: 0.92rem;
        letter-spacing: 0.08em;
      }
      h1 {
        margin: 0;
        font-family: "Gukhan Sans Web", sans-serif;
        font-weight: 400;
        font-size: clamp(2.8rem, 12vw, 8.25rem);
        line-height: 1.9;
        letter-spacing: -0.03em;
      }
      .tagline {
        margin: 0.4rem 0 0;
        max-width: 28em;
        font-size: clamp(1.25rem, 2.4vw, 1.7rem);
        line-height: 1.45;
      }
      .sub { margin: 0.7rem 0 0; max-width: 36em; color: var(--muted); }
      .actions { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1.6rem; }
      .btn {
        display: inline-block;
        background: var(--cinnabar);
        color: #f3efe4;
        text-decoration: none;
        padding: 0.7rem 1.2rem;
        border-radius: 999px;
        border: 1px solid var(--cinnabar);
      }
      .btn:hover { background: #6e2622; border-color: #6e2622; }
      .btn.ghost { background: transparent; color: var(--ink); border-color: var(--ink); }
      .btn.ghost:hover { color: var(--cinnabar); border-color: var(--cinnabar); background: transparent; }
      .block { padding: clamp(3rem, 7vw, 5.5rem) 0; border-top: 1px solid var(--rule); scroll-margin-top: 4.5rem; }
      h2 {
        margin: 0 0 0.7rem;
        font-size: clamp(1.55rem, 3vw, 2.2rem);
        font-weight: 500;
        line-height: 1.25;
      }
      .lead { margin: 0 0 1.2rem; max-width: 40em; }
      .snippet { margin: 1.4rem 0 0; }
      .snippet-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.8rem;
        margin-bottom: 0.4rem;
      }
      .snippet h3 { margin: 0; font-size: 1.02rem; font-weight: 500; }
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
        min-height: 4.6em;
        margin: 0 0 1.2rem;
        padding: 0.15rem 0 0.4rem;
        border: 0;
        border-bottom: 1px solid var(--rule);
        resize: vertical;
        background: transparent;
        color: var(--ink);
        font-family: "Gukhan Sans Web", sans-serif;
        font-weight: 400;
        font-size: 48px;
        line-height: 2;
        overflow-wrap: anywhere;
      }
      .stage:focus { outline: none; border-bottom-color: var(--cinnabar); }
      .controls {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.1rem 1.6rem;
      }
      .slider, fieldset { margin: 0; }
      .slider {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.45rem 0.7rem;
        color: var(--muted);
        font-size: 0.92rem;
      }
      .slider input { flex: 1 1 8rem; accent-color: var(--cinnabar); }
      .slider output { color: var(--ink); min-width: 2.4rem; }
      fieldset { border: 0; padding: 0; }
      legend { padding: 0; margin-bottom: 0.4rem; color: var(--muted); font-size: 0.92rem; }
      .choice { display: flex; flex-wrap: wrap; gap: 0.4rem; }
      .choice label {
        position: relative;
        border: 1px solid var(--rule);
        border-radius: 999px;
        padding: 0.32rem 0.75rem;
        cursor: pointer;
        color: var(--ink);
      }
      .choice input {
        position: absolute;
        inset: 0;
        opacity: 0;
        margin: 0;
        cursor: pointer;
      }
      .choice label:has(input:checked) {
        color: var(--cinnabar);
        border-color: var(--cinnabar);
      }
      .choice label:focus-within { outline: 2px solid var(--cinnabar); outline-offset: 2px; }
${familyRules('.stage')}
      .page:has(#ss01:checked) .stage { font-feature-settings: "ss01" 1; }
      .page:has(#ss01:checked):has(#hangul:checked) .stage { font-feature-settings: "ss01" 0; }
      .wrow {
        display: grid;
        grid-template-columns: 9.5rem 1fr;
        gap: 0.4rem 1.2rem;
        align-items: baseline;
        border-top: 1px solid var(--rule);
        padding: 0.35rem 0 0.15rem;
      }
      .wmeta { margin: 0; color: var(--muted); font-size: 0.92rem; font-weight: 400; line-height: 1.4; }
      .wnum { color: var(--ink); }
      .wsample {
        margin: 0;
        font-size: clamp(1.65rem, 3.3vw, 2.7rem);
        line-height: 2;
        font-weight: 400;
        overflow-wrap: anywhere;
      }
      #weights.live .wsample { font-weight: var(--w); font-synthesis: none; }
${specimenRules()}
      .spec { margin: 0; padding: 1.15rem 0; border-top: 1px solid var(--rule); }
      .spec figcaption { color: var(--muted); font-size: 0.95rem; line-height: 1.5; }
      .spec .read { display: block; color: var(--cinnabar); margin-top: 0.15rem; }
      .spec p {
        margin: 0.35rem 0 0;
        font-size: clamp(1.55rem, 3vw, 2.35rem);
        line-height: 2;
        font-weight: 400;
        overflow-wrap: anywhere;
      }
      .kp-note, .kp-read { display: none; }
      .page:has(#kp:checked) .kr-note,
      .page:has(#kp:checked) .kr-read { display: none; }
      .page:has(#kp:checked) .kp-note { display: inline; }
      .page:has(#kp:checked) .kp-read { display: block; }
      .layer-body { font-family: "Gothic A1", "Hanja Box"; color: var(--indigo); }
      .layer-ruby { font-family: "Gukhan Sans Hanja", "${hangulCompanion('ruby')}", sans-serif; }
      .layer-replace { font-family: "Gukhan Hangul Hanja", "${hangulCompanion('replace')}", sans-serif; color: var(--indigo); }
      .layer-kp { font-family: "Gukhan Sans KP Hanja", "${hangulCompanion('ruby')}", sans-serif; }
${explainCss()}
      .how {
        margin-top: 0;
        padding: clamp(3rem, 7vw, 5.5rem) 0;
        border-top: 1px solid var(--rule);
        scroll-margin-top: 4.5rem;
      }
      .how svg { max-width: 100%; height: auto; }
      .credit { margin: 0.35rem 0; }
      .how a, .credit a, .lead a { color: var(--cinnabar); }
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
        font-size: 0.82rem;
        line-height: 1.5;
      }
      pre code { background: transparent; color: inherit; padding: 0; font-size: 1em; }
      :focus-visible { outline: 2px solid var(--cinnabar); outline-offset: 2px; }
      @media (max-width: 720px) {
        .controls { grid-template-columns: 1fr; }
        .wrow { grid-template-columns: 1fr; gap: 0; padding-top: 0.7rem; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="bar">
        <div class="wrap bar-inner">
          <a class="mark" href="${profile === 'pages' ? PAGES_BASE : './'}">국한</a>
          <nav class="nav" aria-label="페이지">
            <a href="#try">써 보기</a>
            <a href="#weights">굵기</a>
            <a href="#specimens">예문</a>
            <a href="#how">동작</a>
            <a href="#license">라이선스</a>
            <a href="/gukhan-font/slides/">슬라이드</a>
          </nav>
        </div>
      </header>
      <div class="wrap">
        <section class="hero">
          <p class="kicker">GUKHAN SANS · OFL</p>
          <h1>國漢文混用</h1>
          <p class="tagline">한자는 그대로 두고, 독음만 그립니다.</p>
          <p class="sub">OpenType 셰이핑으로 독음을 붙입니다. <code>&lt;ruby&gt;</code>도 자바스크립트도 필요 없고, 복사하면 한자입니다.</p>
          <div class="actions">
            <a class="btn" href="${RELEASES}">다운로드</a>
            <a class="btn ghost" href="/gukhan-font/slides/">슬라이드</a>
            <a class="btn ghost" href="${REPO}">저장소</a>
          </div>
        </section>

        <section class="block" id="use">
          <h2>넣는 법</h2>
          <p class="lead">파일은 <a href="${RELEASES}">GitHub 릴리스</a>에 있습니다. 웹 서브셋은 Regular 하나이고, 이 주소로도 바로 쓸 수 있습니다. 일곱 굵기의 정적 파일과 가변 폰트, 한자 애드온은 zip 안에 있습니다. 루비는 <code>line-height</code>를 2로 둡니다.</p>
          <div class="snippet">
            <div class="snippet-head">
              <h3>웹 서브셋</h3>
              <button class="copy" type="button" data-copy="css-web">복사</button>
            </div>
            <pre id="css-web"><code>${escapeHtml(snippet.web)}</code></pre>
          </div>
          <div class="snippet">
            <div class="snippet-head">
              <h3>한자 애드온</h3>
              <button class="copy" type="button" data-copy="css-addon">복사</button>
            </div>
            <p class="lead">애드온은 한글 글꼴 앞에 둡니다. 그 한글 글꼴에도 같은 어센더, 디센더, 라인갭을 주세요. 루비는 ${escapeHtml(metrics.rubyAscent)}, 치환은 ${escapeHtml(metrics.replaceAscent)}입니다. 값이 다르면 한자가 있는 줄과 없는 줄의 높이가 달라집니다. <code>unicode-range</code> 전체는 릴리스의 <code>hanja.css</code>에 있습니다.</p>
            <pre id="css-addon"><code>${escapeHtml(snippet.addon)}</code></pre>
          </div>
        </section>

        <section class="block" id="try">
          <h2>써 보기</h2>
          <p class="lead">문장을 고쳐 보세요. 크기, 굵기, 남한·북한 독음, 루비와 치환, 한자 애드온을 바꿉니다. 굵기 슬라이더는 가변 폰트를 받습니다. 이 페이지의 애드온은 Regular입니다. 복사하면 한자입니다.</p>
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
                <label><input id="sans" name="family" type="radio" checked>루비 Gukhan Sans</label>
                <label><input id="hangul" name="family" type="radio">치환 Gukhan Hangul</label>
              </div>
            </fieldset>
            <fieldset>
              <legend>지역</legend>
              <div class="choice">
                <label><input id="kr" name="region" type="radio" checked>남한 ko-KR</label>
                <label><input id="kp" name="region" type="radio">북한 ko-KP</label>
              </div>
            </fieldset>
            <fieldset>
              <legend>파일</legend>
              <div class="choice">
                <label><input id="web" name="source" type="radio" checked>웹 서브셋</label>
                <label><input id="vf" name="source" type="radio">가변 폰트</label>
                <label><input id="addon" name="source" type="radio">한자 애드온</label>
              </div>
            </fieldset>
            <fieldset>
              <legend>루비</legend>
              <div class="choice">
                <label><input id="ss01" type="checkbox">루비 끄기 · ss01</label>
              </div>
            </fieldset>
          </div>
        </section>

        <section class="block" id="weights">
          <h2>굵기</h2>
          <p class="lead">ExtraLight부터 Heavy까지입니다. 이 목록이 화면에 들어올 때 가변 폰트를 받습니다. 지금은 고른 폰트 패밀리와 지역을 따릅니다.</p>
${waterfall}
        </section>

        <section class="block" id="specimens">
          <h2>예문</h2>
          <p class="lead">국한문혼용 문장입니다. 웹 서브셋으로 그립니다. 지역과 폰트 패밀리를 바꾸면 독음이 바뀝니다.</p>
${cards}
        </section>

${explainHtml()}

        <section class="block" id="license">
          <h2>라이선스</h2>
          <p class="credit">글꼴은 <a href="https://github.com/morealdot/gukhan-font/blob/main/OFL.txt">SIL OFL 1.1</a>입니다. 윤곽은 Adobe <a href="https://github.com/adobe-fonts/source-han-sans">Source Han Sans</a> KR에서 왔습니다. 예약된 이름 Source는 이 글꼴의 이름이 아닙니다.</p>
          <p class="credit">단어 독음 표는 <a href="https://github.com/dahlia/seonbi">dahlia의 선비</a>에서 왔습니다. 글꼴 컴파일은 <a href="https://github.com/antfu/furifont">Anthony Fu의 furifont</a>입니다.</p>
          <p class="credit">데모의 한글 본문은 Gothic A1(OFL)입니다. 애드온과 짝이 되는 폰트 패밀리에는 같은 메트릭 오버라이드를 얹었습니다. 저장소 코드는 MIT입니다.</p>
          <p class="credit"><a href="/gukhan-font/slides/">슬라이드</a>가 셰이핑과 합자, 두음 법칙을 코드와 함께 설명합니다.</p>
        </section>
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
        document.querySelectorAll('[data-copy]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var node = document.getElementById(btn.getAttribute('data-copy'))
            var text = node.innerText
            var done = function () {
              var prev = btn.textContent
              btn.textContent = '복사했습니다'
              setTimeout(function () { btn.textContent = prev }, 1400)
            }
            if (navigator.clipboard && navigator.clipboard.writeText)
              navigator.clipboard.writeText(text).then(done).catch(function () {})
          })
        })
      })()
    </script>
  </body>
</html>
`
}

export type { WeightName }
