/** Diagrams shared by the Pages demo and the Slidev deck. `step` reveals one stage per click. */

const ink = '#1c1915'
const muted = '#6b645b'
const line = '#cfc6b6'
const red = '#8c2f2b'
const indigo = '#243856'
const wash = '#f6d7c8'
const paper = '#fffaf3'

function svg(width: number, height: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" style="display:block;width:100%;height:auto;aspect-ratio:${width}/${height}" role="img">${body}</svg>`
}

function show(step: number, index: number): string {
  if (step >= index)
    return '1'
  return '0.22'
}

export function fontTables(step = 99): string {
  const rows = [
    ['cmap', '코드포인트 → 글리프 ID'],
    ['CFF / glyf', '윤곽. 정적은 CFF, 가변 폰트는 glyf'],
    ['hmtx', '진행 너비와 왼쪽 사이드베어링'],
    ['maxp', '글리프 수. numGlyphs는 16비트'],
    ['GSUB', '글리프를 다른 글리프로 바꿈'],
    ['GPOS', '위치. 루비는 여기 있지 않음'],
    ['name', '폰트 패밀리 이름, 저작권, 설명'],
  ]
  const body = rows.map((row, index) => {
    const y = 18 + index * 42
    const on = step >= index
    return `<g opacity="${show(step, index)}">
      <rect x="16" y="${y}" width="140" height="32" rx="6" fill="${on ? wash : paper}" stroke="${on ? red : line}"/>
      <text x="86" y="${y + 21}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="15" fill="${ink}">${row[0]}</text>
      <text x="172" y="${y + 21}" font-family="sans-serif" font-size="15" fill="${muted}">${row[1]}</text>
    </g>`
  }).join('')
  return svg(920, 18 + rows.length * 42, body)
}

export function cmapPicture(step = 99): string {
  const rows = [
    ['U+516D', '六', '2975', 'cid10936'],
    ['U+6708', '月', '5271', 'cid20702'],
    ['U+5973', '女', '3779', 'cid14218'],
  ]
  const head = `<text x="24" y="28" font-family="sans-serif" font-size="14" fill="${muted}">GukhanmunSans-Regular.otf cmap</text>
    <text x="24" y="56" font-family="ui-monospace, monospace" font-size="13" fill="${muted}">codepoint</text>
    <text x="250" y="56" font-family="ui-monospace, monospace" font-size="13" fill="${muted}">glyph id</text>
    <text x="430" y="56" font-family="ui-monospace, monospace" font-size="13" fill="${muted}">CFF name</text>`
  const body = rows.map((row, index) => {
    const y = 78 + index * 48
    return `<g opacity="${show(step, index)}">
      <rect x="16" y="${y}" width="560" height="40" rx="6" fill="${paper}" stroke="${step >= index ? red : line}"/>
      <text x="36" y="${y + 26}" font-family="ui-monospace, monospace" font-size="16" fill="${ink}">${row[0]} ${row[1]}</text>
      <text x="250" y="${y + 26}" font-family="ui-monospace, monospace" font-size="16" fill="${red}">${row[2]}</text>
      <text x="430" y="${y + 26}" font-family="ui-monospace, monospace" font-size="16" fill="${muted}">${row[3]}</text>
    </g>`
  }).join('')
  const note = `<text x="24" y="232" font-family="sans-serif" font-size="14" fill="${muted}" opacity="${show(step, 3)}">독음 글리프 gkc / gki / gkw는 cmap에 없습니다. GSUB가 기본 글리프를 바꿉니다.</text>`
  return svg(920, 250, head + body + note)
}

export function pipeline(step = 99): string {
  const stages = [
    ['텍스트', '코드포인트'],
    ['아이템화', '스크립트 런'],
    ['cmap', '글리프 ID'],
    ['GSUB', '치환'],
    ['GPOS', '위치'],
    ['그리기', '픽셀'],
  ]
  const body = stages.map((stage, index) => {
    const x = 16 + index * 152
    const on = step >= index
    const arrow = index < stages.length - 1
      ? `<path d="M${x + 128} 78 H${x + 146}" stroke="${on && step >= index + 1 ? red : line}" stroke-width="2" marker-end="url(#arr)"/>`
      : ''
    return `<g opacity="${show(step, index)}">
      <rect x="${x}" y="48" width="124" height="64" rx="8" fill="${on ? '#fff' : paper}" stroke="${step === index ? red : line}" stroke-width="${step === index ? 2.5 : 1}"/>
      <text x="${x + 62}" y="74" text-anchor="middle" font-family="ui-monospace, monospace" font-size="15" fill="${ink}">${stage[0]}</text>
      <text x="${x + 62}" y="96" text-anchor="middle" font-family="sans-serif" font-size="13" fill="${muted}">${stage[1]}</text>
      ${arrow}
    </g>`
  }).join('')
  return svg(930, 140, `<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="${red}"/></marker></defs>${body}`)
}

export function runs(step = 99): string {
  const chips = [
    ['大韓民國', 'Han', true],
    ['의', 'Hangul', false],
    ['憲法', 'Han', true],
  ]
  const body = chips.map((chip, index) => {
    const x = 24 + index * 200
    const han = chip[2] === true
    return `<g opacity="${show(step, index)}">
      <rect x="${x}" y="36" width="170" height="64" rx="8" fill="${han ? wash : paper}" stroke="${han ? red : indigo}"/>
      <text x="${x + 85}" y="66" text-anchor="middle" font-family="sans-serif" font-size="22" fill="${ink}">${chip[0]}</text>
      <text x="${x + 85}" y="86" text-anchor="middle" font-family="ui-monospace, monospace" font-size="12" fill="${muted}">${chip[1]}</text>
    </g>`
  }).join('')
  const note = `<text x="24" y="132" font-family="sans-serif" font-size="14" fill="${muted}" opacity="${show(step, 3)}">GSUB는 칠한 Han 런만 봅니다. 의는 베이스 글리프이고, 진행 너비는 920입니다.</text>`
  return svg(680, 150, body + note)
}

export function liga(step = 99): string {
  const before = `<g opacity="${show(step, 0)}">
    <text x="24" y="28" font-family="sans-serif" font-size="14" fill="${muted}">cmap 글리프, 치환 전</text>
    <rect x="24" y="40" width="150" height="72" rx="8" fill="${paper}" stroke="${line}"/>
    <text x="99" y="72" text-anchor="middle" font-family="sans-serif" font-size="28" fill="${ink}">六</text>
    <text x="99" y="100" text-anchor="middle" font-family="ui-monospace, monospace" font-size="12" fill="${muted}">gid 2975</text>
    <rect x="190" y="40" width="150" height="72" rx="8" fill="${paper}" stroke="${line}"/>
    <text x="265" y="72" text-anchor="middle" font-family="sans-serif" font-size="28" fill="${ink}">月</text>
    <text x="265" y="100" text-anchor="middle" font-family="ui-monospace, monospace" font-size="12" fill="${muted}">gid 5271</text>
  </g>`
  const rule = `<g opacity="${show(step, 1)}">
    <text x="370" y="82" font-family="ui-monospace, monospace" font-size="18" fill="${red}">→</text>
    <text x="400" y="78" font-family="ui-monospace, monospace" font-size="13" fill="${ink}">sub uni516D uni6708</text>
    <text x="400" y="98" font-family="ui-monospace, monospace" font-size="13" fill="${ink}">by gkw00891</text>
  </g>`
  const after = `<g opacity="${show(step, 2)}">
    <rect x="620" y="28" width="270" height="96" rx="8" fill="${wash}" stroke="${red}" stroke-width="2"/>
    <text x="755" y="58" text-anchor="middle" font-family="sans-serif" font-size="16" fill="${ink}">합자 하나</text>
    <text x="755" y="84" text-anchor="middle" font-family="ui-monospace, monospace" font-size="15" fill="${red}">gid34500=0+2000</text>
    <text x="755" y="106" text-anchor="middle" font-family="sans-serif" font-size="13" fill="${muted}">클러스터 0, 진행 2000</text>
  </g>`
  return svg(920, 140, before + rule + after)
}

export function dueum(step = 99): string {
  const left = `<g opacity="${show(step, 0)}">
    <text x="24" y="24" font-family="sans-serif" font-size="14" fill="${muted}">女子 · 런의 첫 글자</text>
    <rect x="24" y="36" width="400" height="78" rx="8" fill="${wash}" stroke="${red}"/>
    <text x="40" y="64" font-family="ui-monospace, monospace" font-size="15" fill="${ink}">女 gid 26394</text>
    <text x="40" y="88" font-family="sans-serif" font-size="14" fill="${muted}">gki5973 · 두음 법칙 · 여</text>
    <text x="230" y="64" font-family="ui-monospace, monospace" font-size="15" fill="${ink}">子 gid 26591</text>
    <text x="230" y="88" font-family="sans-serif" font-size="14" fill="${muted}">gkc5B50 · 자</text>
  </g>`
  const right = `<g opacity="${show(step, 1)}">
    <text x="460" y="24" font-family="sans-serif" font-size="14" fill="${muted}">男女 · 남 뒤의 女</text>
    <rect x="460" y="36" width="430" height="78" rx="8" fill="${paper}" stroke="${indigo}"/>
    <text x="476" y="64" font-family="ui-monospace, monospace" font-size="15" fill="${ink}">男 gid 29649</text>
    <text x="476" y="88" font-family="sans-serif" font-size="14" fill="${muted}">gkc7537 · 남</text>
    <text x="680" y="64" font-family="ui-monospace, monospace" font-size="15" fill="${ink}">女 gid 26393</text>
    <text x="680" y="88" font-family="sans-serif" font-size="14" fill="${muted}">gkc5973 · 녀</text>
  </g>`
  const note = `<text x="24" y="142" font-family="sans-serif" font-size="14" fill="${muted}" opacity="${show(step, 2)}">같은 U+5973이 문맥에 따라 글리프 ID가 다릅니다.</text>`
  return svg(920, 160, left + right + note)
}

export function draw(step = 99): string {
  const ruby = `<g opacity="${show(step, 0)}">
    <text x="24" y="24" font-family="sans-serif" font-size="14" fill="${muted}">Gukhanmun Sans · 윤곽 안의 루비</text>
    <rect x="24" y="36" width="200" height="250" fill="none" stroke="${line}"/>
    <line x1="24" y1="210" x2="224" y2="210" stroke="${indigo}"/>
    <text x="124" y="78" text-anchor="middle" font-family="sans-serif" font-size="16" fill="${red}">유월</text>
    <text x="124" y="190" text-anchor="middle" font-family="sans-serif" font-size="64" fill="${ink}">六月</text>
    <text x="240" y="120" font-family="ui-monospace, monospace" font-size="14" fill="${ink}">gid 34500</text>
    <text x="240" y="144" font-family="ui-monospace, monospace" font-size="14" fill="${ink}">advance 2000</text>
    <text x="240" y="168" font-family="sans-serif" font-size="14" fill="${muted}">한자 너비 1000 × 2</text>
    <text x="240" y="192" font-family="sans-serif" font-size="14" fill="${muted}">hhea ascender 1330</text>
  </g>`
  const replace = `<g opacity="${show(step, 1)}">
    <text x="500" y="24" font-family="sans-serif" font-size="14" fill="${muted}">Gukhanmun Hangul · 같은 글리프 ID</text>
    <rect x="500" y="96" width="184" height="140" fill="none" stroke="${line}"/>
    <rect x="684" y="96" width="184" height="140" fill="none" stroke="${line}"/>
    <line x1="500" y1="210" x2="868" y2="210" stroke="${indigo}"/>
    <text x="592" y="180" text-anchor="middle" font-family="sans-serif" font-size="42" fill="${indigo}">유</text>
    <text x="776" y="180" text-anchor="middle" font-family="sans-serif" font-size="42" fill="${indigo}">월</text>
    <text x="500" y="250" font-family="ui-monospace, monospace" font-size="14" fill="${ink}">gid 34500 · advance 1840</text>
    <text x="500" y="272" font-family="sans-serif" font-size="14" fill="${muted}">920 × 2음절. ascender 1160</text>
  </g>`
  return svg(920, 290, ruby + replace)
}

export function budget(step = 99): string {
  const width = 880
  const used = 41259
  const limit = 65535
  const usedW = Math.round(width * used / limit)
  const bar = `<g opacity="${show(step, 0)}">
    <text x="20" y="28" font-family="sans-serif" font-size="14" fill="${muted}">ko-KR 전체 41,259 / 65,535. 여유 64개. 버린 합자 0개.</text>
    <rect x="20" y="44" width="${width}" height="28" rx="6" fill="${paper}" stroke="${line}"/>
    <rect x="20" y="44" width="${usedW}" height="28" rx="6" fill="${wash}" stroke="${red}"/>
  </g>`
  const parts = [
    ['베이스', '24,973'],
    ['글자 독음', '8,144'],
    ['두음 법칙', '574'],
    ['단어 합자', '7,567'],
    ['프로브', '1'],
  ]
  const chips = parts.map((part, index) => {
    const x = 20 + index * 176
    return `<g opacity="${show(step, index + 1)}">
      <text x="${x}" y="104" font-family="sans-serif" font-size="13" fill="${muted}">${part[0]}</text>
      <text x="${x}" y="126" font-family="ui-monospace, monospace" font-size="16" fill="${ink}">${part[1]}</text>
    </g>`
  }).join('')
  return svg(920, 146, bar + chips)
}

export function layerStack(step = 99): string {
  const rows = [
    ['1', 'Gukhanmun Sans Hanja', 'unicode-range 안의 한자만', wash, red],
    ['2', 'Gothic A1', '한글, 라틴, 그 밖의 문자', '#e7eef6', indigo],
    ['3', 'Hanja Box', '애드온이 맡지 않은 한자를 빈 상자로', paper, line],
  ]
  const body = rows.map((row, index) => {
    const y = 24 + index * 58
    return `<g opacity="${show(step, index)}">
      <rect x="20" y="${y}" width="880" height="48" rx="8" fill="${row[3]}" stroke="${row[4]}"/>
      <text x="40" y="${y + 30}" font-family="ui-monospace, monospace" font-size="16" fill="${ink}">${row[0]}  ${row[1]}</text>
      <text x="430" y="${y + 30}" font-family="sans-serif" font-size="15" fill="${muted}">${row[2]}</text>
    </g>`
  }).join('')
  return svg(920, 210, body)
}
