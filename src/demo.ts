import { SAMPLES } from './samples.ts'

/** The specimen page. Readings are drawn by the font; the caption is only a check. */
export function renderDemo(): string {
  const cards = SAMPLES.map(sample => `        <figure>
          <figcaption>${escapeHtml(sample.note)} <span>${escapeHtml(sample.reading)}</span></figcaption>
          <p>${escapeHtml(sample.text)}</p>
        </figure>`).join('\n')
  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>국한 Gukhan Sans</title>
    <style>
      @font-face {
        font-family: "Gukhan Sans";
        src: url("../dist/GukhanSans-Regular.woff2") format("woff2"),
             url("../dist/GukhanSans-Regular.otf") format("opentype");
        font-weight: 400;
        font-display: swap;
      }
      :root {
        color-scheme: light;
        --paper: #f3efe4;
        --ink: #1c1915;
        --muted: #6b645b;
        --rule: #ddd4c4;
        --cinnabar: #8c2f2b;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--paper);
        color: var(--ink);
        font-family: "Iowan Old Style", Palatino, "Palatino Linotype", "Songti SC", serif;
      }
      main { max-width: 46rem; margin: 0 auto; padding: 3.5rem 1.4rem 5rem; }
      header p { max-width: 38rem; }
      .mark {
        margin: 0 0 0.4rem;
        color: var(--cinnabar);
        font-family: "Gukhan Sans", sans-serif;
        font-size: 1.35rem;
        line-height: 2;
        letter-spacing: 0.08em;
      }
      h1 { font-weight: 500; font-size: clamp(2.4rem, 6vw, 4rem); line-height: 1.9; margin: 0 0 0.4rem; }
      h1 span { font-family: "Gukhan Sans", sans-serif; }
      .lede { font-size: 1.15rem; line-height: 1.55; }
      .toggle { display: flex; gap: 0.6rem; align-items: center; margin: 1.6rem 0 0; color: var(--muted); }
      #off { accent-color: var(--cinnabar); }
      #off:checked ~ .specimen { font-feature-settings: "ss01" 1; }
      .specimen { margin-top: 1.4rem; border-top: 1px solid var(--rule); }
      figure { margin: 0; padding: 1.35rem 0 1.5rem; border-bottom: 1px solid var(--rule); }
      figcaption { color: var(--muted); font-size: 0.92rem; line-height: 1.45; }
      figcaption span { display: block; margin-top: 0.15rem; color: var(--cinnabar); }
      figure p, .try {
        font-family: "Gukhan Sans", sans-serif;
        font-size: clamp(1.8rem, 4vw, 2.55rem);
        line-height: 2;
        margin: 0.55rem 0 0;
      }
      .try {
        width: 100%;
        min-height: 6.2rem;
        border: 0;
        padding: 0;
        resize: vertical;
        background: transparent;
        color: inherit;
        font: inherit;
      }
      .try:focus { outline: none; }
      footer { margin-top: 2rem; color: var(--muted); font-size: 0.92rem; line-height: 1.5; }
      code { font-family: ui-monospace, monospace; font-size: 0.88em; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="mark">國漢 · GUKHAN SANS</p>
        <h1><span>國漢文混用</span></h1>
        <p class="lede">한글 독음이 글꼴 안에 있습니다. <code>&lt;ruby&gt;</code>도 스크립트도 쓰지 않습니다. 선택한 글자는 그대로 한자입니다. 줄 간격은 독음이 잘리지 않도록 넉넉히 잡혀 있습니다.</p>
        <p class="lede">The Hangul reading is set by the font. The characters you copy are still the Hanja.</p>
      </header>
      <input id="off" type="checkbox">
      <label class="toggle" for="off">독음 끄기 · stylistic set ss01</label>
      <section class="specimen">
${cards}
        <figure>
          <figcaption>직접 쳐 보세요. 한자 묶음이 길수록 그 단어가 이깁니다.</figcaption>
          <textarea class="try" spellcheck="false">大韓民國의 音樂과 平壤 冷麵.</textarea>
        </figure>
      </section>
      <footer>
        <p>Gukhan Sans Regular. Source Han Sans KR에 표준국어대사전 단어와 Unihan kHangul 글자 읽음을 올렸습니다. 빌드하기 전에는 독음이 보이지 않습니다.</p>
      </footer>
    </main>
  </body>
</html>
`
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]!)
}
