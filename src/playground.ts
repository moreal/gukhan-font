import { pagesBase, pagesOrigin } from './site.ts'

/** Try-it page. Wording stays 독음 / 한글. The HTML term ruby is not shown. */
export function renderPlayground(): string {
  const root = pagesBase()
  const font = (file: string) => `${root}fonts/${file}`
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>놀이터 — 국한문</title>
  <meta name="description" content="한자를 치면 독음이 붙습니다. 글자 위에서 커서를 움직이면 굵기가 따라갑니다.">
  <meta property="og:title" content="놀이터 — 국한문">
  <meta property="og:description" content="독음과 한글, 굵기를 바로 바꿔 봅니다.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pagesOrigin()}/playground/">
  <link rel="preload" href="${font('GukhanmunSansVF.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${font('GukhanmunHangulVF.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${font('GothicA1-Regular.woff2')}" as="font" type="font/woff2" crossorigin>
  <style>
    @font-face {
      font-family: "Gukhanmun Sans Play";
      src: url("${font('GukhanmunSansVF.woff2')}") format("woff2");
      font-weight: 250 900;
      font-display: block;
    }
    @font-face {
      font-family: "Gukhanmun Hangul Play";
      src: url("${font('GukhanmunHangulVF.woff2')}") format("woff2");
      font-weight: 250 900;
      font-display: block;
    }
    @font-face {
      font-family: "Gothic A1";
      src: url("${font('GothicA1-Regular.woff2')}") format("woff2");
      font-weight: 400;
      font-display: swap;
    }
    :root {
      color-scheme: dark;
      --ink: #141210;
      --paper: #f3efe6;
      --muted: #b7aea2;
      --line: rgba(243, 239, 230, 0.16);
      --cinnabar: #e07a62;
      --bar: 3.15rem;
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      display: grid;
      grid-template-rows: auto 1fr auto;
      min-height: 100vh;
      min-height: 100dvh;
      background:
        radial-gradient(ellipse at 50% 38%, rgba(224, 122, 98, 0.08), transparent 46%),
        var(--ink);
      color: var(--paper);
      font-family: "Gothic A1", sans-serif;
      font-synthesis: none;
      overflow: hidden;
    }
    a { color: inherit; }
    .top, .dock {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.65rem 1.1rem;
    }
    .top { border-bottom: 1px solid var(--line); }
    .brand { text-decoration: none; letter-spacing: 0.16em; font-size: 0.92rem; }
    .top nav { display: flex; gap: 0.9rem; align-items: center; }
    .top nav a { color: var(--muted); text-decoration: none; font-size: 0.88rem; }
    .top nav a[aria-current="page"] { color: var(--cinnabar); }
    .stage-wrap {
      position: relative;
      min-height: 0;
      display: grid;
      grid-template-rows: 1fr auto;
      align-items: center;
      padding: 0.75rem 1.15rem 1rem;
      gap: 0.85rem;
    }
    .stack {
      position: relative;
      width: min(100%, 16em);
      margin: 0 auto;
      font-size: clamp(1.9rem, 5.2vw, 4.35rem);
      min-height: 4.4em;
      display: grid;
      place-items: center;
    }
    #stage, .ghost {
      grid-area: 1 / 1;
      width: 100%;
      margin: 0;
      text-align: center;
      font-family: "Gukhanmun Sans Play", sans-serif;
      font-weight: 400;
      font-variation-settings: "wght" 400;
      font-size: 1em;
      line-height: 2;
      outline: none;
      overflow-wrap: anywhere;
      caret-color: var(--cinnabar);
    }
    #stage.is-replace, .ghost.is-replace { font-family: "Gukhanmun Hangul Play", sans-serif; }
    #stage:focus-visible { outline: 1px solid var(--cinnabar); outline-offset: 0.4rem; }
    .ghost { opacity: 0; pointer-events: none; user-select: none; }
    #stage, .ghost { visibility: hidden; }
    html.ready #stage, html.ready .ghost { visibility: visible; }
    .hairline {
      position: absolute;
      top: 12%;
      bottom: 22%;
      left: 0;
      width: 1px;
      background: var(--cinnabar);
      opacity: 0;
      pointer-events: none;
    }
    .hint {
      margin: 0;
      min-height: 2.8em;
      text-align: center;
      color: var(--muted);
      font-size: 0.86rem;
    }
    .dock {
      border-top: 1px solid var(--line);
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.75rem 1rem;
    }
    .modes { border: 0; margin: 0; padding: 0; display: flex; gap: 0.35rem; }
    .modes button, .chips button {
      font: inherit;
      font-size: 0.92rem;
      color: var(--paper);
      background: transparent;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 0.38rem 0.85rem;
      cursor: pointer;
    }
    .modes button[aria-pressed="true"] {
      background: var(--cinnabar);
      border-color: var(--cinnabar);
      color: var(--ink);
    }
    .modes button:focus-visible, .chips button:focus-visible {
      outline: 1px solid var(--cinnabar);
      outline-offset: 2px;
    }
    .weight {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      min-width: 0;
      color: var(--muted);
      font-size: 0.86rem;
    }
    .weight input { width: min(16rem, 100%); accent-color: var(--cinnabar); }
    #wght { color: var(--paper); font-variant-numeric: tabular-nums; min-width: 3.2ch; }
    .chips { display: flex; flex-wrap: wrap; gap: 0.35rem; justify-content: flex-end; }
    @media (max-width: 720px) {
      body { overflow: auto; }
      .top nav { gap: 0.65rem; }
      .dock { grid-template-columns: 1fr; justify-items: stretch; }
      .chips { justify-content: flex-start; }
      .hairline { display: none; }
      .stack { font-size: 2.05rem; width: 100%; }
      .modes button, .chips button { padding: 0.42rem 0.75rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      #stage, .ghost { transition: none !important; }
    }
  </style>
</head>
<body>
  <header class="top">
    <a class="brand" href="${root}">국한문</a>
    <nav aria-label="페이지">
      <a href="${root}">본문</a>
      <a href="${root}playground/" aria-current="page">놀이터</a>
      <a href="${root}slides/">슬라이드</a>
    </nav>
  </header>
  <h1 class="visually-hidden">놀이터. 한자를 치면 독음이 붙습니다.</h1>
  <div class="stage-wrap" id="field">
    <div class="stack">
      <div class="ghost" id="ghost" aria-hidden="true"></div>
      <div id="stage" contenteditable="true" role="textbox" aria-multiline="true" aria-label="시험 문장" spellcheck="false">大韓民國의 音樂과 平壤 冷麵.</div>
    </div>
    <div class="hairline" id="hair" aria-hidden="true"></div>
    <p class="hint" id="hint">독음을 글자 위에 답니다. 글자 위에서 마우스를 좌우로 움직이면 굵기가 바뀝니다.</p>
  </div>
  <footer class="dock">
    <fieldset class="modes">
      <legend class="visually-hidden">그리는 방식</legend>
      <button type="button" id="reading" aria-pressed="true" title="독음 달기">독음</button>
      <button type="button" id="hangul" aria-pressed="false" title="한글로 바꾸기">한글</button>
    </fieldset>
    <label class="weight">굵기
      <input id="range" type="range" min="250" max="900" value="400" aria-valuemin="250" aria-valuemax="900" aria-valuenow="400">
      <span id="wght">400</span>
    </label>
    <div class="chips" aria-label="예문">
      <button type="button" data-sample="國漢文混用">國漢文混用</button>
      <button type="button" data-sample="音樂과 快樂">音樂</button>
      <button type="button" data-sample="女子와 男女">女子</button>
      <button type="button" data-sample="平壤 冷麵">冷麵</button>
    </div>
  </footer>
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
      var stage = document.getElementById('stage')
      var ghost = document.getElementById('ghost')
      var field = document.getElementById('field')
      var range = document.getElementById('range')
      var out = document.getElementById('wght')
      var hair = document.getElementById('hair')
      var reading = document.getElementById('reading')
      var hangul = document.getElementById('hangul')
      var hint = document.getElementById('hint')
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      function touchHint() { return window.matchMedia('(max-width: 720px)').matches }
      var mode = 'reading'
      var timer = 0
      function show() { document.documentElement.classList.add('ready') }
      Promise.all([
        document.fonts.load('250 16px "Gukhanmun Sans Play"'),
        document.fonts.load('900 16px "Gukhanmun Sans Play"'),
        document.fonts.load('250 16px "Gukhanmun Hangul Play"'),
        document.fonts.load('900 16px "Gukhanmun Hangul Play"')
      ]).then(show, show)
      function paint(weight) {
        weight = Math.max(250, Math.min(900, Math.round(weight)))
        var axis = '"wght" ' + weight
        stage.style.fontVariationSettings = axis
        ghost.style.fontVariationSettings = axis
        range.value = String(weight)
        range.setAttribute('aria-valuenow', String(weight))
        out.textContent = String(weight)
      }
      function hintText(next) {
        var how = next === 'hangul' ? '한자로 둔 채 한글로 바꿉니다.' : '독음을 글자 위에 답니다.'
        var axis = touchHint() ? '슬라이더로 굵기를 바꿉니다.' : '글자 위에서 마우스를 좌우로 움직이면 굵기가 바뀝니다.'
        hint.textContent = how + ' ' + axis
      }
      function applyMode(next) {
        mode = next
        var asHangul = next === 'hangul'
        reading.setAttribute('aria-pressed', asHangul ? 'false' : 'true')
        hangul.setAttribute('aria-pressed', asHangul ? 'true' : 'false')
        stage.classList.toggle('is-replace', asHangul)
        hintText(next)
      }
      function morph(next) {
        if (next === mode) return
        window.clearTimeout(timer)
        if (reduce) { applyMode(next); return }
        ghost.textContent = stage.textContent
        ghost.classList.toggle('is-replace', next === 'hangul')
        ghost.style.fontVariationSettings = stage.style.fontVariationSettings
        ghost.style.transition = 'none'
        stage.style.transition = 'none'
        ghost.style.opacity = '0'
        stage.style.opacity = '1'
        ghost.getBoundingClientRect()
        ghost.style.transition = 'opacity 320ms cubic-bezier(0.22, 1, 0.36, 1)'
        stage.style.transition = 'opacity 320ms cubic-bezier(0.22, 1, 0.36, 1)'
        ghost.style.opacity = '1'
        stage.style.opacity = '0'
        timer = window.setTimeout(function () {
          applyMode(next)
          stage.style.transition = 'none'
          ghost.style.transition = 'none'
          stage.style.opacity = '1'
          ghost.style.opacity = '0'
        }, 320)
      }
      reading.addEventListener('click', function () { morph('reading') })
      hangul.addEventListener('click', function () { morph('hangul') })
      range.addEventListener('input', function () { paint(range.value) })
      field.addEventListener('pointermove', function (event) {
        if (event.pointerType !== 'mouse') return
        if (event.target.closest && event.target.closest('.hint')) return
        var box = field.getBoundingClientRect()
        var x = event.clientX - box.left
        if (x < 8 || x > box.width - 8) { hair.style.opacity = '0'; return }
        hair.style.opacity = '0.55'
        hair.style.transform = 'translate3d(' + x + 'px,0,0)'
        paint(250 + (x / box.width) * 650)
      })
      field.addEventListener('pointerleave', function () { hair.style.opacity = '0' })
      stage.addEventListener('paste', function (event) {
        event.preventDefault()
        var text = event.clipboardData ? event.clipboardData.getData('text') : ''
        var selection = window.getSelection()
        if (!selection || !selection.rangeCount) return
        selection.deleteFromDocument()
        selection.getRangeAt(0).insertNode(document.createTextNode(text))
        selection.collapseToEnd()
      })
      document.querySelectorAll('[data-sample]').forEach(function (button) {
        button.addEventListener('click', function () {
          stage.textContent = button.getAttribute('data-sample')
        })
      })
      paint(400)
      hintText('reading')
      window.addEventListener('resize', function () { hintText(mode) })
    })()
  </script>
</body>
</html>
`
}
