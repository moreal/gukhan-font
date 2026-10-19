import { codeBlockCss, copyScript, cssBlock } from './codeblock.ts'
import { installSnippets, type DemoMetrics } from './demo.ts'
import { githubOrigin, pagesBase, pagesOrigin } from './site.ts'

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!)
}

/** Scroll-scrubbed landing. The Pages profile is served under `/gukhanmun-font/`. */
export function renderLanding(metrics: DemoMetrics, profile: 'pages' | 'local' = 'pages'): string {
  const snippet = installSnippets(metrics)
  const root = pagesBase()
  const font = (file: string) => profile === 'pages' ? `${root}fonts/${file}` : `../dist/${file}`
  const releases = `${githubOrigin()}/releases`
  const repo = githubOrigin()
  const play = `${root}playground/`
  const ofl = `${githubOrigin()}/blob/main/OFL.txt`
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>국한문 Gukhanmun — 한자 위에 독음을 그리는 글꼴</title>
  <meta name="description" content="한자는 그대로 두고, 독음만 그립니다. 스크롤하면 독음이 앉고, 音樂이 음악으로 묶이며, 굵기가 따라갑니다.">
  <meta property="og:title" content="국한문 Gukhanmun">
  <meta property="og:description" content="한자는 그대로 두고, 독음만 그립니다.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pagesOrigin()}/">
  <meta name="twitter:card" content="summary">
  <link rel="preload" href="${font('GukhanmunSans-Web.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${font('GukhanmunSansVF.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${font('GothicA1-Regular.woff2')}" as="font" type="font/woff2" crossorigin>
  <style>
    @font-face {
      font-family: "Gukhanmun Sans Web";
      src: url("${font('GukhanmunSans-Web.woff2')}") format("woff2");
      font-weight: 400;
      font-display: block;
    }
    @font-face {
      font-family: "Gukhanmun Sans VF";
      src: url("${font('GukhanmunSansVF.woff2')}") format("woff2");
      font-weight: 250 900;
      font-display: block;
    }
    @font-face {
      font-family: "Gukhanmun Hangul Web";
      src: url("${font('GukhanmunHangul-Web.woff2')}") format("woff2");
      font-weight: 400;
      font-display: block;
    }
    @font-face {
      font-family: "Gothic A1";
      src: url("${font('GothicA1-Regular.woff2')}") format("woff2");
      font-weight: 400;
      font-display: swap;
    }
    :root {
      color-scheme: light;
      --paper: #f4f0e6;
      --ink: #1b1916;
      --muted: #5c564e;
      --line: rgba(27, 25, 22, 0.14);
      --cinnabar: #8c2f2b;
      --bar: 3.4rem;
      --type: clamp(2.7rem, 9.2vw, 7.1rem);
      --band: 0.38;
    }
    * { box-sizing: border-box; }
    html { background: var(--paper); }
    body {
      margin: 0;
      color: var(--ink);
      background: var(--paper);
      font-family: "Gothic A1", sans-serif;
      font-size: 1.05rem;
      line-height: 1.7;
      font-synthesis: none;
      word-break: keep-all;
      overflow-x: clip;
    }
    a { color: inherit; }
    .top {
      position: fixed;
      z-index: 20;
      inset: 0 0 auto 0;
      height: var(--bar);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0 1.25rem;
      background: color-mix(in srgb, var(--paper) 86%, transparent);
      border-bottom: 1px solid var(--line);
      backdrop-filter: blur(14px);
    }
    .brand { text-decoration: none; letter-spacing: 0.18em; font-size: 0.95rem; }
    .top nav { display: flex; gap: 1.15rem; }
    .top nav a { color: var(--muted); text-decoration: none; font-size: 0.92rem; }
    .top nav a:hover { color: var(--cinnabar); }
    .scene { position: relative; height: 220dvh; }
    .scene + .scene { margin-top: -120dvh; }
    #read { z-index: 1; }
    #liga { z-index: 2; }
    #axis { z-index: 3; }
    .pin {
      position: sticky;
      top: 0;
      height: 100dvh;
      display: grid;
      align-content: center;
      justify-items: center;
      padding: calc(var(--bar) + 1.5rem) 1.4rem 2.5rem;
      text-align: center;
    }
    .step, .deck, .specimen, .cap, .meet, .axis-slot, .axis-out {
      opacity: 0;
      transform: translate3d(0, 16px, 0);
    }
    #read .step, #read .deck, #read .specimen, #read .cap {
      opacity: 1;
      transform: none;
    }
    #read .cap .on { opacity: 0; }
    .step {
      margin: 0 0 0.85rem;
      color: var(--cinnabar);
      font-size: 0.78rem;
      letter-spacing: 0.22em;
    }
    .deck {
      margin: 0 0 1.1rem;
      max-width: 16em;
      font-size: clamp(1.25rem, 2.2vw, 1.7rem);
      line-height: 1.45;
    }
    .specimen {
      position: relative;
      font-size: var(--type);
      line-height: 2;
    }
    .face, .axis {
      margin: 0;
      font-size: 1em;
      line-height: 2;
      font-weight: 400;
      letter-spacing: 0;
      white-space: nowrap;
    }
    .hanja, .reading, .split, .joined, .mini.sans { font-family: "Gukhanmun Sans Web", sans-serif; }
    .hanja { font-feature-settings: "ss01" 1; }
    .reading { font-feature-settings: "ss01" 0; }
    .window {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      height: calc(var(--band) * 100%);
      overflow: clip;
      pointer-events: none;
    }
    .band {
      height: calc(100% / var(--band));
      clip-path: inset(0 0 calc((1 - var(--band)) * 100%) 0);
      opacity: 0;
      transform: translate3d(0, -48%, 0);
      will-change: transform, opacity;
    }
    .cap {
      position: relative;
      width: min(28rem, 100%);
      min-height: 4.6em;
      margin: 1.1rem 0 0;
      color: var(--muted);
      font-size: 1rem;
      line-height: 1.65;
    }
    .cap span { display: block; }
    .cap .on { position: absolute; left: 0; right: 0; top: 0; }
    .meet {
      display: grid;
      place-items: center;
      font-size: var(--type);
      line-height: 2;
    }
    .split, .joined { grid-area: 1 / 1; margin: 0; }
    .split { display: flex; justify-content: center; will-change: opacity; }
    .split span {
      display: block;
      will-change: transform;
    }
    .joined { opacity: 0; will-change: opacity; }
    .axis-slot {
      display: grid;
      place-items: center;
      width: 5.2em;
      height: 2em;
      font-size: var(--type);
    }
    .axis {
      font-family: "Gukhanmun Sans VF", sans-serif;
      font-weight: 250;
      font-variation-settings: "wght" 250;
    }
    .axis-out {
      margin: 0.7rem 0 0;
      min-width: 4ch;
      color: var(--cinnabar);
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.14em;
    }
    .face, .axis { visibility: hidden; }
    html.ready .face, html.ready .axis { visibility: visible; }
    .prose {
      position: relative;
      z-index: 4;
      margin-top: 0;
      padding: 0 clamp(1.25rem, 5vw, 4.5rem) 5rem;
      background: var(--paper);
    }
    .sheet {
      max-width: 46rem;
      margin: 0 auto;
      padding-top: clamp(4rem, 10vh, 7rem);
    }
    .sheet + .sheet { padding-top: clamp(4.5rem, 12vh, 8rem); }
    .kicker {
      margin: 0 0 0.55rem;
      color: var(--cinnabar);
      font-size: 0.78rem;
      letter-spacing: 0.2em;
    }
    h2 {
      margin: 0 0 0.8rem;
      font-size: clamp(1.8rem, 3vw, 2.5rem);
      font-weight: 400;
      letter-spacing: -0.02em;
      line-height: 1.3;
    }
    .lead { margin: 0; max-width: 38em; color: var(--muted); }
    .actions { display: flex; flex-wrap: wrap; gap: 0.8rem 1.2rem; margin-top: 1.5rem; }
    .btn {
      display: inline-block;
      background: var(--cinnabar);
      color: var(--paper);
      text-decoration: none;
      padding: 0.72rem 1.2rem;
      border: 1px solid var(--cinnabar);
    }
    .btn:hover { background: #6e2622; border-color: #6e2622; }
    .btn.quiet {
      background: transparent;
      color: var(--ink);
      border-color: transparent;
      text-decoration: underline;
      text-underline-offset: 0.2em;
      padding-left: 0;
      padding-right: 0;
    }
    .families {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-top: 1.6rem;
    }
    .family {
      margin: 0;
      padding: 1.1rem 1rem 0.4rem;
      border-top: 1px solid var(--line);
    }
    .family h3 { margin: 0; font-size: 1.05rem; font-weight: 400; }
    .family p { margin: 0.35rem 0 0; color: var(--muted); font-size: 0.95rem; }
    .mini {
      margin: 0.8rem 0 0.2rem;
      font-size: clamp(1.7rem, 3vw, 2.3rem);
      line-height: 2;
    }
    .mini.hangul { font-family: "Gukhanmun Hangul Web", sans-serif; color: #243856; }
    .points { margin: 1.2rem 0 0; padding: 0; list-style: none; }
    .points li {
      padding: 0.85rem 0;
      border-top: 1px solid var(--line);
      max-width: 40em;
    }
    .points strong { font-weight: 400; }
    .snippet { margin-top: 1.5rem; }
    .snippet h3 {
      margin: 0 0 0.15rem;
      font-size: 1rem;
      font-weight: 400;
    }
    ${codeBlockCss()}
    .note { margin: 0.7rem 0 0; color: var(--muted); font-size: 0.95rem; }
    .foot {
      display: grid;
      gap: 1.6rem;
      margin-top: 1rem;
    }
    .foot h2 { font-size: 1.15rem; }
    .foot p { margin: 0.35rem 0 0; max-width: 42em; }
    .foot a { color: var(--cinnabar); }
    :focus-visible { outline: 2px solid var(--cinnabar); outline-offset: 3px; }
    @media (max-width: 720px) {
      :root { --bar: 3rem; --type: clamp(2.4rem, 14vw, 3.5rem); }
      .top { padding: 0 0.9rem; }
      .top nav { gap: 0.75rem; }
      .top nav a { font-size: 0.84rem; }
      .pin { padding-left: 1rem; padding-right: 1rem; }
      .cap { font-size: 0.92rem; }
      .families { grid-template-columns: 1fr; }
      .deck { font-size: 1.2rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      .scene,
      .scene + .scene,
      .prose { height: auto; margin-top: 0; }
      .pin { position: relative; height: auto; min-height: 70dvh; }
      .step, .deck, .specimen, .cap, .meet, .axis-slot, .axis-out,
      .band, .split, .joined, .split span {
        opacity: 1;
        transform: none;
        will-change: auto;
      }
      .band { opacity: 1; transform: none; }
      .split, #read .cap .off, #liga .cap .off { opacity: 0; }
      .joined, #read .cap .on, #liga .cap .on { opacity: 1; }
      .axis { font-variation-settings: "wght" 560; }
    }
  </style>
</head>
<body>
  <header class="top">
    <a class="brand" href="${root}">국한문</a>
    <nav aria-label="페이지">
      <a href="${play}">놀이터</a>
    </nav>
  </header>
  <h1 class="visually-hidden">국한문. 한자는 그대로 두고, 독음만 그립니다.</h1>

  <section class="scene" id="read">
    <div class="pin">
      <p class="step" id="read-step">01 · 독음</p>
      <p class="deck" id="read-deck">한자는 그대로 두고, 독음만 그립니다.</p>
      <div class="specimen" id="read-type">
        <p class="face hanja">國漢文混用</p>
        <div class="window" aria-hidden="true">
          <div class="band" id="band">
            <p class="face reading">國漢文混用</p>
          </div>
        </div>
      </div>
      <p class="cap" id="read-cap">
        <span class="off" id="read-off">한자만 보입니다. 독음 끄기 기능(<code>ss01</code>)을 켠 상태입니다.</span>
        <span class="on" id="read-on">같은 글꼴이 독음을 글자 안에 그립니다. 덧붙인 주석이 아닙니다.</span>
      </p>
    </div>
  </section>

  <section class="scene" id="liga">
    <div class="pin">
      <p class="step" id="liga-step">02 · 합자</p>
      <div class="meet" id="liga-type">
        <p class="split face" id="split"><span id="split-a">音</span><span id="split-b">樂</span></p>
        <p class="joined face" id="joined">音樂</p>
      </div>
      <p class="cap" id="liga-cap">
        <span class="off" id="liga-off">떨어져 있으면 음, 낙입니다. 樂이 어두라 두음이 바뀝니다.</span>
        <span class="on" id="liga-on">붙으면 합자 하나입니다. 音樂의 독음은 음악입니다.</span>
      </p>
    </div>
  </section>

  <section class="scene" id="axis">
    <div class="pin">
      <p class="step" id="axis-step">03 · 굵기</p>
      <div class="axis-slot" id="axis-type">
        <p class="axis" id="axis-face">音樂</p>
      </div>
      <p class="axis-out" id="wght">250</p>
      <p class="cap" id="axis-cap"><span class="on">가변 폰트입니다. 한자와 독음의 획이 같은 굵기를 탑니다.</span></p>
    </div>
  </section>

  <div class="prose">
    <section class="sheet" id="install">
      <p class="kicker">받는 법</p>
      <h2>파일은 릴리스에 있습니다.</h2>
      <p class="lead">웹 서브셋은 Regular 하나이고, 이 주소로도 바로 쓸 수 있습니다. 일곱 굵기의 정적 파일과 가변 폰트, 한자 애드온은 zip 안에 있습니다. 독음은 <code>line-height</code>를 2로 둡니다.</p>
      <div class="actions">
        <a class="btn" href="${releases}">다운로드</a>
        <a class="btn quiet" href="${repo}">저장소</a>
      </div>
      <div class="snippet">
        <h3>웹 서브셋</h3>
        ${cssBlock('css-web', snippet.web)}
      </div>
      <div class="snippet">
        <h3>한자 애드온</h3>
        <p class="note">애드온은 한글 글꼴 앞에 둡니다. 그 한글 글꼴에도 같은 어센더, 디센더, 라인갭을 주세요. 독음은 ${escapeHtml(metrics.rubyAscent)}, 치환은 ${escapeHtml(metrics.replaceAscent)}입니다. 값이 다르면 한자가 있는 줄과 없는 줄의 높이가 달라집니다. <code>unicode-range</code> 전체는 릴리스의 <code>hanja.css</code>에 있습니다.</p>
        ${cssBlock('css-addon', snippet.addon)}
      </div>
    </section>

    <section class="sheet" id="families">
      <p class="kicker">폰트 패밀리</p>
      <h2>독음을 그리거나, 한글로 바꿉니다.</h2>
      <p class="lead">둘 다 남한 ko-KR과 북한 ko-KP가 있습니다. 북한 독음은 두음 법칙을 따르지 않습니다.</p>
      <div class="families">
        <article class="family">
          <h3>Gukhanmun Sans</h3>
          <p>한자는 두고, 독음을 글자 위에 그립니다.</p>
          <p class="mini sans face">國漢文混用</p>
        </article>
        <article class="family">
          <h3>Gukhanmun Hangul</h3>
          <p>한자 자리에 한글이 앉습니다. 복사하면 한자입니다.</p>
          <p class="mini hangul face">國漢文混用</p>
        </article>
      </div>
    </section>

    <section class="sheet" id="features">
      <p class="kicker">특징</p>
      <h2>글꼴이 읽습니다.</h2>
      <ul class="points">
        <li>독음은 기본으로 켜져 있습니다. CSS에서 <code>font-feature-settings: "ss01"</code>을 켜면 독음만 사라지고 한자는 그대로 남습니다.</li>
        <li><strong>합자.</strong> 붙어 있는 音樂은 음악이 됩니다. 글자 사이가 떨어지면 음, 낙입니다.</li>
        <li><strong>굵기.</strong> 가변 폰트는 250에서 900까지입니다. 한자와 독음이 함께 굵어집니다.</li>
        <li><strong>본문.</strong> 자바스크립트는 필요 없습니다. 선택한 글자는 한자입니다.</li>
      </ul>
    </section>

    <section class="sheet" id="try">
      <p class="kicker">놀이터</p>
      <h2>한자를 직접 쳐 보세요.</h2>
      <p class="lead">독음과 한글을 바꾸고, 글자 위에서 굵기를 움직입니다.</p>
      <div class="actions">
        <a class="btn" href="${play}">놀이터 열기</a>
      </div>
    </section>

    <footer class="sheet foot" id="license">
      <div>
        <h2>라이선스</h2>
        <p>글꼴은 <a href="${ofl}">SIL OFL 1.1</a>로 배포합니다. <a href="https://github.com/adobe-fonts/source-han-sans">본고딕(Source Han Sans)</a>을 바탕으로 만들었지만, OFL 조건에 따라 원본의 예약 글꼴 이름인 Source는 쓰지 않습니다. 저장소 코드는 MIT 라이선스입니다.</p>
      </div>
      <div>
        <h2>출처</h2>
        <p>글자 모양은 Adobe의 <a href="https://github.com/adobe-fonts/source-han-sans">본고딕(Source Han Sans KR)</a>을 바탕으로 했습니다.</p>
        <p>남한 독음은 <a href="https://github.com/dahlia/seonbi">dahlia의 선비</a>에서, 북한 독음은 <a href="https://gukhanmun.org/">dahlia의 gukhanmun</a>이 2026년 6월 3일 <a href="https://opendict.korean.go.kr/">우리말샘</a>에서 추린 단어 목록에서 가져왔습니다. gukhanmun은 국한문혼용 글을 한글로 바꿔 주는 라이브러리로, 이 글꼴과는 별개의 프로젝트입니다.</p>
        <p>남한 단어는 국립국어원 <a href="https://stdict.korean.go.kr/">표준국어대사전</a>에서, 북한 단어는 국립국어원 <a href="https://opendict.korean.go.kr/">우리말샘</a>에서 왔으며, 둘 다 <a href="https://creativecommons.org/licenses/by-sa/2.0/kr/">CC BY-SA 2.0 KR</a>입니다.</p>
        <p>글꼴 빌드에는 <a href="https://github.com/antfu/furifont">Anthony Fu의 furifont</a>를 썼습니다.</p>
        <p>이 페이지의 본문 서체는 <a href="https://fonts.google.com/specimen/Gothic+A1">Gothic A1</a>(OFL)이며, 한자 애드온과 함께 쓸 때 줄 높이가 맞도록 메트릭을 조정했습니다.</p>
      </div>
    </footer>
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
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      function show() { document.documentElement.classList.add('ready') }
      Promise.all([
        document.fonts.load('400 64px "Gukhanmun Sans Web"'),
        document.fonts.load('400 64px "Gukhanmun Hangul Web"'),
        document.fonts.load('250 64px "Gukhanmun Sans VF"'),
        document.fonts.load('900 64px "Gukhanmun Sans VF"')
      ]).then(show, show)
      ${copyScript()}
      if (reduce) {
        var held = document.getElementById('wght')
        if (held) held.textContent = '560'
        return
      }

      function bezier(x1, y1, x2, y2) {
        return function (x) {
          if (x <= 0) return 0
          if (x >= 1) return 1
          var t = x
          var i
          for (i = 0; i < 6; i++) {
            var cx = 3 * x1
            var bx = 3 * (x2 - x1) - cx
            var ax = 1 - cx - bx
            var xEst = ((ax * t + bx) * t + cx) * t
            var dx = (3 * ax * t + 2 * bx) * t + cx
            if (Math.abs(xEst - x) < 0.0001) break
            if (dx) t -= (xEst - x) / dx
          }
          var cy = 3 * y1
          var by = 3 * (y2 - y1) - cy
          var ay = 1 - cy - by
          return ((ay * t + by) * t + cy) * t
        }
      }
      var easeOut = bezier(0.16, 1, 0.3, 1)
      var easeInOut = bezier(0.65, 0, 0.35, 1)
      function span(p, a, b) {
        var t = (p - a) / (b - a)
        return t < 0 ? 0 : t > 1 ? 1 : t
      }
      function place(el, opacity, y) {
        el.style.opacity = opacity.toFixed(3)
        el.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)'
      }

      var scenes = [
        document.getElementById('read'),
        document.getElementById('liga'),
        document.getElementById('axis')
      ]
      var band = document.getElementById('band')
      var readStep = document.getElementById('read-step')
      var readDeck = document.getElementById('read-deck')
      var readType = document.getElementById('read-type')
      var readCap = document.getElementById('read-cap')
      var readOff = document.getElementById('read-off')
      var readOn = document.getElementById('read-on')
      var ligaStep = document.getElementById('liga-step')
      var ligaType = document.getElementById('liga-type')
      var ligaCap = document.getElementById('liga-cap')
      var ligaOff = document.getElementById('liga-off')
      var ligaOn = document.getElementById('liga-on')
      var split = document.getElementById('split')
      var splitA = document.getElementById('split-a')
      var splitB = document.getElementById('split-b')
      var joined = document.getElementById('joined')
      var axisStep = document.getElementById('axis-step')
      var axisType = document.getElementById('axis-type')
      var axisCap = document.getElementById('axis-cap')
      var axisFace = document.getElementById('axis-face')
      var axisOut = document.getElementById('wght')
      var boxes = scenes.map(function (el) { return { el: el, start: 0, travel: 1 } })
      var frame = 0

      function measure() {
        var vh = window.innerHeight
        for (var i = 0; i < boxes.length; i++) {
          boxes[i].start = boxes[i].el.offsetTop
          boxes[i].travel = Math.max(1, boxes[i].el.offsetHeight - vh)
        }
      }
      function progress(box) {
        var p = (window.scrollY - box.start) / box.travel
        return p < 0 ? 0 : p > 1 ? 1 : p
      }
      function handoff(nextP) {
        return easeInOut(span(nextP, 0, 0.1))
      }
      function render() {
        frame = 0
        var p0 = progress(boxes[0])
        var p1 = progress(boxes[1])
        var p2 = progress(boxes[2])
        var l0 = handoff(p1)
        place(readStep, 1 - l0, -l0 * 28)
        place(readDeck, 1 - l0, -l0 * 28)
        place(readType, 1 - l0, -l0 * 36)
        place(readCap, 1 - l0, -l0 * 20)
        var move = easeInOut(span(p0, 0.12, 0.56))
        var fade = easeOut(span(p0, 0.26, 0.5))
        band.style.opacity = fade.toFixed(3)
        band.style.transform = 'translate3d(0,' + ((1 - move) * -48).toFixed(2) + '%,0)'
        var cap = easeInOut(span(p0, 0.34, 0.58))
        readOff.style.opacity = (1 - cap).toFixed(3)
        readOn.style.opacity = cap.toFixed(3)

        var a1 = easeOut(span(p1, 0.04, 0.16))
        var l1 = handoff(p2)
        var shown = a1 * (1 - l1)
        var typeIn = easeOut(span(p1, 0.05, 0.17))
        place(ligaStep, shown, (1 - a1) * 28 - l1 * 24)
        place(ligaType, typeIn * (1 - l1), (1 - typeIn) * 34 - l1 * 28)
        place(ligaCap, easeOut(span(p1, 0.08, 0.2)) * (1 - l1), (1 - easeOut(span(p1, 0.08, 0.2))) * 22 - l1 * 18)
        var approach = easeInOut(span(p1, 0.22, 0.52))
        var cross = easeInOut(span(p1, 0.5, 0.7))
        splitA.style.transform = 'translate3d(' + ((1 - approach) * -0.72).toFixed(3) + 'em,0,0)'
        splitB.style.transform = 'translate3d(' + ((1 - approach) * 0.72).toFixed(3) + 'em,0,0)'
        split.style.opacity = (1 - cross).toFixed(3)
        joined.style.opacity = cross.toFixed(3)
        ligaOff.style.opacity = (1 - cross).toFixed(3)
        ligaOn.style.opacity = cross.toFixed(3)

        var a2 = easeOut(span(p2, 0.04, 0.16))
        var l2 = 0
        var axisIn = easeOut(span(p2, 0.05, 0.17))
        place(axisStep, a2 * (1 - l2), (1 - a2) * 26 - l2 * 22)
        place(axisType, axisIn * (1 - l2), (1 - axisIn) * 32 - l2 * 24)
        place(axisOut, easeOut(span(p2, 0.08, 0.2)) * (1 - l2), (1 - easeOut(span(p2, 0.08, 0.2))) * 18 - l2 * 16)
        place(axisCap, easeOut(span(p2, 0.1, 0.22)) * (1 - l2), (1 - easeOut(span(p2, 0.1, 0.22))) * 18 - l2 * 16)
        var weight = Math.round(250 + easeInOut(span(p2, 0.24, 0.74)) * 650)
        axisFace.style.fontVariationSettings = '"wght" ' + weight
        axisOut.textContent = String(weight)
      }
      function request() {
        if (!frame) frame = requestAnimationFrame(render)
      }
      measure()
      render()
      window.addEventListener('scroll', request, { passive: true })
      window.addEventListener('resize', function () { measure(); request() })
      document.fonts.ready.then(function () { measure(); request() })
    })()
  </script>
</body>
</html>
`
}
