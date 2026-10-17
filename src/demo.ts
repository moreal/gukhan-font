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

function fontFaces(metrics: DemoMetrics, profile: DemoProfile): string {
  const blocks: string[] = []
  const hanjaWeights = profile === 'pages' ? WEIGHTS.filter(weight => weight.name === 'Regular') : WEIGHTS
  for (const region of REGIONS) {
    for (const style of STYLES) {
      if (profile === 'local') {
        const vf = productName(style, region, 'vf')
        blocks.push(faceBlock({ family: vf.family, weight: '250 900', src: fontSrc(profile, fileName(style, region, 'vf')) }))
      }
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
  blocks.push(faceBlock({ family: 'Gothic A1', weight: '400', src: 'fonts/GothicA1-Regular.woff2' }))
  blocks.push(faceBlock({
    family: 'Hanja Box',
    weight: '400',
    src: 'fonts/HanjaBox.woff',
    format: 'woff',
    range: 'U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF',
  }))
  return blocks.join('\n')
}

/** WOFF2 files the Pages demo loads from `dist/`. Gothic A1 and the Hanja box are copied beside them. */
export function pagesDistFonts(): string[] {
  const names: string[] = []
  for (const region of REGIONS) {
    for (const style of STYLES) {
      names.push(`${fileName(style, region, 'web')}.woff2`)
      names.push(`${fileName(style, region, 'hanja', 'Regular')}.woff2`)
    }
  }
  return names
}

function familyOf(source: 'full' | 'web' | 'addon', region: 'kr' | 'kp', family: 'sans' | 'hangul'): string {
  const style: FamilyStyle = family === 'sans' ? 'ruby' : 'replace'
  const regionId: Region = region === 'kr' ? 'ko-KR' : 'ko-KP'
  const kind = source === 'full' ? 'vf' : source === 'web' ? 'web' : 'hanja'
  const name = productName(style, regionId, kind).family
  return source === 'addon' ? `"${name}", "Gothic A1", sans-serif` : `"${name}", sans-serif`
}

function selector(source: 'full' | 'web' | 'addon', region: 'kr' | 'kp', family: 'sans' | 'hangul'): string {
  const ids = [
    source === 'full' ? '' : `#${source}:checked`,
    region === 'kp' ? '#kp:checked' : '',
    family === 'hangul' ? '#hangul:checked' : '',
  ].filter(Boolean)
  return ids.length ? `${ids.join(' ~ ')} ~ main .face` : 'main .face'
}

function familyRules(profile: DemoProfile): string {
  const lines: string[] = []
  const sources = profile === 'pages' ? ['web', 'addon'] as const : ['full', 'web', 'addon'] as const
  for (const source of sources) {
    for (const region of ['kr', 'kp'] as const) {
      for (const family of ['sans', 'hangul'] as const) {
        const weight = source === 'web' ? ' font-weight: 400;' : ''
        lines.push(`      ${selector(source, region, family)} { font-family: ${familyOf(source, region, family)};${weight} }`)
      }
    }
  }
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
   애드온을 font-family 맨 앞에 두면 그 폰트의 메트릭이 줄 높이를 정합니다.
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

/** Region, family, weight, and source, plus a Hanja add-on layered on Gothic A1.
 *  `local` is the full demo. `pages` ships the web subset and Regular Hanja add-on under `/gukhan-font/`. */
export function renderDemo(metrics: DemoMetrics, profile: DemoProfile = 'local'): string {
  const cards = SAMPLES.map(sample => `        <figure>
          <figcaption>
            <span class="kr-note">${escapeHtml(sample.note)}</span>
            <span class="kp-note">${escapeHtml(sample.kpNote)}</span>
            <span class="kr-read">${escapeHtml(sample.reading)}</span>
            <span class="kp-read">${escapeHtml(sample.kp)}</span>
          </figcaption>
          <p class="face">${escapeHtml(sample.text)}</p>
        </figure>`).join('\n')
  const weights = WEIGHTS.map(weight => `      <input id="w${weight.css}" name="weight" type="radio"${weight.name === 'Regular' ? ' checked' : ''}>
      <label for="w${weight.css}">${weight.name} ${weight.css}</label>`).join('\n')
  const checkedIds = [
    ...(profile === 'local' ? ['full'] : []),
    'web',
    'addon',
    'off',
    'kr',
    'kp',
    'sans',
    'hangul',
    ...(profile === 'local' ? WEIGHTS.map(weight => `w${weight.css}`) : []),
  ]
  const defaultFamily = profile === 'pages' ? 'Gukhan Sans Web' : 'Gukhan Sans VF'
  const lede = profile === 'pages'
    ? '같은 한자를 루비, 치환, 남한·북한 독음, 웹 서브셋, 한자 애드온으로 바꿉니다. 복사하면 한자입니다. 이 사이트는 웹 서브셋과 Regular 한자 애드온만 올립니다.'
    : '같은 한자를 루비, 치환, 남한·북한 독음, 굵기, 웹 서브셋, 한자 애드온으로 바꿉니다. 복사하면 한자입니다.'
  const footer = profile === 'pages'
    ? `이 페이지는 웹 서브셋(Regular)과 Regular 한자 애드온만 올립니다. 일곱 굵기와 가변 폰트는 <a href="https://github.com/morealdot/gukhan-font/releases">GitHub 릴리스</a>에 있습니다. 루비 애드온의 어센더는 ${escapeHtml(metrics.rubyAscent)}이고, 치환은 ${escapeHtml(metrics.replaceAscent)}입니다. 디센더는 ${escapeHtml(metrics.descent)}입니다.`
    : `가변 폰트의 기본 인스턴스는 ExtraLight라서, 이 페이지는 굵기 400에서 시작합니다. 웹 서브셋은 Regular 하나입니다. 루비 애드온의 어센더는 ${escapeHtml(metrics.rubyAscent)}이고, 치환은 ${escapeHtml(metrics.replaceAscent)}입니다. 디센더는 ${escapeHtml(metrics.descent)}입니다.`
  const sourceInputs = profile === 'pages'
    ? `    <input id="web" name="source" type="radio" checked>
    <input id="addon" name="source" type="radio">`
    : `    <input id="full" name="source" type="radio" checked>
    <input id="web" name="source" type="radio">
    <input id="addon" name="source" type="radio">`
  const sourceLabels = profile === 'pages'
    ? `        <label for="web">웹 서브셋</label>
        <label for="addon">한자 애드온</label>`
    : `        <label for="full">가변 폰트</label>
        <label for="web">웹 서브셋</label>
        <label for="addon">한자 애드온</label>`
  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
${profile === 'pages' ? `    <base href="${PAGES_BASE}">\n` : ''}    <title>국한 Gukhan</title>
    <style>
      ${fontFaces(metrics, profile)}
      :root {
        color-scheme: light;
        --paper: #f3efe4;
        --ink: #1c1915;
        --muted: #6b645b;
        --rule: #ddd4c4;
        --cinnabar: #8c2f2b;
        --indigo: #243856;
      }
      * { box-sizing: border-box; }
      body > input {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
      }
      body {
        margin: 0;
        background: var(--paper);
        color: var(--ink);
        font-family: "Iowan Old Style", Palatino, "Palatino Linotype", "Songti SC", serif;
      }
      main { max-width: 46rem; margin: 0 auto; padding: 2.4rem 1.4rem 5rem; }
      h1 { font-weight: 500; font-size: clamp(1.8rem, 4vw, 2.6rem); line-height: 1.15; margin: 0 0 0.6rem; }
      .lede { font-size: 1.05rem; line-height: 1.55; }
      fieldset { border: 1px solid var(--rule); margin: 0.8rem 0; padding: 0.7rem 0.9rem 0.8rem; }
      legend { padding: 0 0.3rem; color: var(--muted); }
      label { margin-right: 0.8rem; cursor: pointer; }
      ${checkedIds.map(id => `#${id}:checked ~ main label[for="${id}"]`).join(',\n      ')} {
        color: var(--cinnabar);
      }
      .face, .try, .layer p {
        font-size: clamp(1.45rem, 2.8vw, 2.15rem);
        line-height: 2;
        margin: 0;
      }
      main .face { font-family: "${defaultFamily}", sans-serif; font-weight: 400; }
${profile === 'local' ? `      ${WEIGHTS.map(weight => `#w${weight.css}:checked ~ main .face { font-weight: ${weight.css}; }`).join('\n      ')}\n` : ''}${familyRules(profile)}
      #off:checked ~ main .face { font-feature-settings: "ss01" 1; }
      #off:checked ~ #hangul:checked ~ main .face { font-feature-settings: "ss01" 0; }
      .kp-note, .kp-read { display: none; }
      #kp:checked ~ main .kr-note, #kp:checked ~ main .kr-read { display: none; }
      #kp:checked ~ main .kp-note, #kp:checked ~ main .kp-read { display: inline; }
      figure { margin: 0; padding: 0.9rem 0; border-bottom: 1px solid var(--rule); }
      figcaption { color: var(--muted); font-size: 0.92rem; line-height: 1.45; margin-bottom: 0.2rem; }
      figcaption .kr-read { display: block; color: var(--cinnabar); }
      figcaption .kp-read { display: none; color: var(--cinnabar); }
      #kp:checked ~ main figcaption .kr-read { display: none; }
      #kp:checked ~ main figcaption .kp-read { display: block; }
      .try {
        width: 100%;
        min-height: 6rem;
        border: 0;
        padding: 0;
        resize: vertical;
        background: transparent;
        color: inherit;
      }
      .try:focus { outline: none; }
      .layer { margin-top: 1.6rem; padding-top: 0.4rem; border-top: 1px solid var(--rule); }
      .layer h2 { font-size: 1.15rem; font-weight: 500; margin: 0.8rem 0; }
      .layer p { margin: 0.2rem 0 0.8rem; }
      .layer-body { font-family: "Gothic A1", "Hanja Box"; color: var(--indigo); }
      .layer-ruby { font-family: "Gukhan Sans Hanja", "Gothic A1", sans-serif; }
      .layer-replace { font-family: "Gukhan Hangul Hanja", "Gothic A1", sans-serif; color: var(--indigo); }
      .layer-kp { font-family: "Gukhan Sans KP Hanja", "Gothic A1", sans-serif; }
${explainCss()}
      footer { margin-top: 2rem; color: var(--muted); font-size: 0.92rem; line-height: 1.5; }
      footer a, .how a { color: var(--cinnabar); }
      code { font-family: ui-monospace, monospace; font-size: 0.88em; }
    </style>
  </head>
  <body>
${sourceInputs}
    <input id="off" type="checkbox">
    <input id="kr" name="region" type="radio" checked>
    <input id="kp" name="region" type="radio">
    <input id="sans" name="family" type="radio" checked>
    <input id="hangul" name="family" type="radio">
${profile === 'local' ? `${weights}\n` : ''}    <main>
      <header>
        <h1>國漢文混用</h1>
        <p class="lede">${lede}</p>
      </header>
      <fieldset>
        <legend>구성</legend>
${sourceLabels}
      </fieldset>
      <fieldset>
        <legend>루비</legend>
        <label for="off">루비 끄기 · ss01</label>
      </fieldset>
      <fieldset>
        <legend>지역</legend>
        <label for="kr">남한 ko-KR</label>
        <label for="kp">북한 ko-KP</label>
      </fieldset>
      <fieldset>
        <legend>폰트 패밀리</legend>
        <label for="sans">루비 Gukhan Sans</label>
        <label for="hangul">치환 Gukhan Hangul</label>
      </fieldset>
${profile === 'local' ? `      <fieldset>
        <legend>굵기</legend>
        ${WEIGHTS.map(weight => `<label for="w${weight.css}">${weight.name}</label>`).join('\n        ')}
      </fieldset>
` : ''}      <section>
${cards}
        <figure>
          <figcaption>직접 입력해 보세요. 복사하면 한자입니다.</figcaption>
          <textarea class="try face" spellcheck="false">大韓民國의 音樂과 平壤 冷麵.</textarea>
        </figure>
      </section>
${explainHtml()}
      <footer>
        <p>${footer}</p>
      </footer>
    </main>
  </body>
</html>
`
}

export type { WeightName }
