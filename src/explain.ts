import { budget, cmapPicture, draw, dueum, fontTables, layerStack, liga, pipeline, runs } from '../shared/diagrams.ts'

/** Korean explanation of the shaping model. The examples use fixed families so they stay put while the specimen radios move. */
export function explainCss(): string {
  return `
      .how { margin-top: 2.2rem; }
      .how h2 { font-size: 1.35rem; font-weight: 500; margin: 0 0 0.4rem; }
      .how h3 { font-size: 1.08rem; font-weight: 500; margin: 1.35rem 0 0.35rem; }
      .how p { line-height: 1.55; }
      .how .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
      .how .card { border: 1px solid var(--rule); padding: 0.55rem 0.75rem 0.7rem; }
      .how .label { color: var(--muted); font-size: 0.85rem; margin: 0 0 0.2rem; }
      .ex-ruby, .ex-kp { font-family: "Gukhan Sans Web", sans-serif; }
      .ex-kp { font-family: "Gukhan Sans KP Web", sans-serif; }
      .ex-replace { font-family: "Gukhan Hangul Web", sans-serif; color: var(--indigo); }
      .ex-kp-replace { font-family: "Gukhan Hangul KP Web", sans-serif; color: var(--indigo); }
      .ex-ruby, .ex-kp, .ex-replace, .ex-kp-replace {
        font-size: clamp(1.4rem, 2.6vw, 1.95rem);
        line-height: 2;
        margin: 0.1rem 0;
      }
      .run { font-size: 1.35rem; line-height: 1.8; }
      .run .han { background: #f6d7c8; padding: 0 0.15rem; }
      .ch { display: inline-block; }
      .budget { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
      .budget th, .budget td { border-bottom: 1px solid var(--rule); text-align: right; padding: 0.28rem 0.4rem; }
      .budget th:first-child, .budget td:first-child { text-align: left; }
      .how .diagram { margin: 0.4rem 0 0.8rem; }
      .how pre {
        background: #1c1915;
        color: #f3efe4;
        padding: 0.75rem 0.9rem;
        overflow: auto;
        font-size: 0.78rem;
        line-height: 1.45;
      }
      @media (max-width: 640px) {
        .how .pair { grid-template-columns: 1fr; }
      }
  `
}

export function explainHtml(): string {
  return `      <section class="how" id="how">
        <h2>동작 방식</h2>
        <p>자바스크립트는 쓰지 않습니다. 브라우저가 셰이핑할 때 텍스트를 스크립트 런으로 나누고, 한자가 이어진 런만 이 글꼴의 OpenType <code>rclt</code>가 바꿉니다. 한글과 라틴은 다른 런이라 다음 글꼴이 그립니다. 숫자는 <code>GukhanSans-Regular.otf</code>를 HarfBuzz로 셰이핑한 값입니다. 아래 큰 예시는 웹 서브셋으로 고정했습니다. 복사하면 한자입니다.</p>

        <h3>글꼴 파일은 표의 묶음입니다</h3>
        <p>OTF와 TTF는 sfnt 표의 묶음입니다. 독음을 그리는 데 쓰는 표는 이 일곱입니다. 루비 획은 글리프 윤곽 안에 그려 넣고, 진행 너비는 <code>hmtx</code>에 적습니다. <code>GPOS</code> 마크 부착은 쓰지 않습니다.</p>
        <div class="diagram">${fontTables(99)}</div>

        <h3>코드포인트, 글리프, cmap</h3>
        <p>텍스트는 코드포인트의 배열입니다. 글리프는 그 글꼴이 그리는 그림이고, 글리프 ID는 그 그림의 번호입니다. <code>cmap</code>이 코드포인트를 글리프 ID로 바꿉니다. ID는 16비트라서, 한 글꼴의 글리프는 65,535개가 한계입니다.</p>
        <div class="diagram">${cmapPicture(99)}</div>

        <h3>셰이핑</h3>
        <div class="diagram">${pipeline(99)}</div>
        <p>아이템화 다음에 cmap, 그다음 GSUB 치환, 그다음 위치, 그다음 래스터입니다. 이 글꼴이 추가하는 규칙은 GSUB <code>rclt</code>와 <code>ss01</code>입니다.</p>

        <h3>한자 런</h3>
        <div class="diagram">${runs(99)}</div>
        <p class="run"><span class="han">大韓民國</span>의 <span class="han">憲法</span></p>
        <p class="ex-ruby">大韓民國의 憲法</p>
        <p>배경을 칠한 곳이 글꼴이 한 번에 보는 런입니다. <code>의</code>는 한글이라 런을 가릅니다. 줄이 단어 중간에서 끊겨도 합자가 풀립니다.</p>

        <h3>가장 긴 단어가 이깁니다</h3>
        <div class="pair">
          <div class="card">
            <p class="label">한 런 · 六月</p>
            <p class="ex-ruby">六月</p>
            <p>사전에 있는 단어는 합자 하나입니다. 남한 독음은 유월입니다.</p>
          </div>
          <div class="card">
            <p class="label">글자를 갈라 적으면</p>
            <p class="ex-ruby"><span class="ch">六</span><span class="ch">月</span></p>
            <p>요소를 나누면 런도 나뉩니다. 합자가 풀려 육과 월로 읽습니다.</p>
          </div>
        </div>
        <p class="ex-ruby">音樂과 快樂</p>
        <p><code>樂</code>의 글자 폴백은 락입니다. <code>音樂</code>은 그대로 두면 음락이 되므로, 합자로 음악을 넣습니다. <code>快樂</code>은 폴백이 이미 쾌락이라 합자가 없고, 보이는 결과는 같습니다. 한 룩업 안에서는 셰이핑이 가장 긴 일치를 고릅니다. 파일에 적힌 순서가 아닙니다. <code>上海</code>, <code>上海料理</code>, <code>上海臨時政府</code>가 같은 <code>words</code> 룩업에 있습니다.</p>
        <div class="diagram">${liga(99)}</div>
        <pre><code>lookup words useExtension {
  sub uni516D uni6708 by gkw00891;
  sub uni4E0A uni6D77 by gkw00164;
  sub uni4E0A uni6D77 uni6599 uni7406 by gkw00165;
  sub uni97F3 uni6A02 by gkw08396;
} words;

hb-shape GukhanSans-Regular.otf --text 六月
[gid34500=0+2000]

hb-shape GukhanSans-Regular.otf --text 六月 --features ss01
[gid2975=0+1000|gid5271=0+1000]</code></pre>

        <h3>글자 폴백, 그다음 두음 법칙</h3>
        <p>합자에 없는 한자는 Unihan <code>kHangul</code>의 한 음절로 읽습니다. 룩업 <code>medial</code>이 <code>uni5973</code>을 <code>gkc5973</code>(녀)으로 바꿉니다. 남한 글꼴만, 런의 첫 글자는 <code>adjust</code>가 두음 법칙 형태로 다시 바꿉니다.</p>
        <div class="diagram">${dueum(99)}</div>
        <pre><code>sub uni5973 by gkc5973;
sub gkc5973 by gki5973;

lookup adjust useExtension {
  sub @open @ryeol' lookup surface;
  ignore sub @hanctx @dueum';
  sub @dueum' lookup surface;
} adjust;

hb-shape GukhanSans-Regular.otf --text '女子와 男女'
[gid26394=0+1000|gid26591=1+1000|gid17045=2+920|gid1=3+224|gid29649=4+1000|gid26393=5+1000]</code></pre>
        <p>코드포인트는 둘 다 U+5973입니다. 첫 女는 gid 26394(여), 남 뒤의 女는 gid 26393(녀)입니다. <code>와</code>는 한글이라 베이스 글리프 gid 17045, 진행 너비 920입니다. 한자 사이 공백은 gid 1이고, Regular에서 진행 너비 224입니다. 모음이나 ㄴ 받침 뒤의 <code>렬</code>/<code>률</code>은 <code>@open @ryeol'</code> 규칙이 <code>열</code>/<code>율</code>로 바꿉니다.</p>
        <div class="pair">
          <div class="card">
            <p class="label">남한 · 런의 첫 글자만 바뀝니다</p>
            <p class="ex-ruby">女子와 男女</p>
            <p>女는 런의 첫 글자에서 여, 남 뒤에서는 녀입니다.</p>
          </div>
          <div class="card">
            <p class="label">법률, 비율, 규율</p>
            <p class="ex-ruby">法律, 比率, 規律</p>
            <p>률은 앞 음절이 모음이나 ㄴ이면 율이 됩니다.</p>
          </div>
        </div>

        <h3>남한 ko-KR, 북한 ko-KP</h3>
        <p>폰트 패밀리 이름이 다릅니다. 북한 글꼴은 두음 법칙을 쓰지 않습니다. 우리말샘에 있는 두 글자 이상 단어가 남한 사전보다 우선하고, 거기에 없는 단어는 남한 독음에서 두음만 되돌립니다. 한 글자 우리말샘 독음이 한 음절이면 그 글자만 폴백을 바꿉니다. 그렇게 달라지는 글자가 열한 자입니다.</p>
        <div class="pair">
          <div class="card">
            <p class="label">남한 Gukhan Sans</p>
            <p class="ex-ruby">平壤 冷麵</p>
            <p class="ex-ruby">六月과 十月</p>
            <p class="ex-ruby">困難</p>
            <p>냉면, 유월과 시월, 곤란. 困難은 합자 하나입니다.</p>
          </div>
          <div class="card">
            <p class="label">북한 Gukhan Sans KP</p>
            <p class="ex-kp">平壤 冷麵</p>
            <p class="ex-kp">六月과 十月</p>
            <p class="ex-kp">困難</p>
            <p>랭면, 류월과 시월, 곤난. 困難은 글자 둘이라 글리프도 둘입니다. 十月의 시는 십의 두음이 아니라 사전 독음이라 그대로입니다.</p>
          </div>
        </div>

        <h3>루비와 치환</h3>
        <div class="diagram">${draw(99)}</div>
        <div class="pair">
          <div class="card">
            <p class="label">Gukhan Sans · 한자 위의 루비</p>
            <p class="ex-ruby">國漢文混用</p>
            <p class="ex-ruby">音樂</p>
            <p>배율은 0.4이고, 간격은 em의 0.05입니다. <code>ss01</code>을 켜면 이 폰트 패밀리의 루비만 꺼집니다. 줄 높이는 2가 필요합니다.</p>
          </div>
          <div class="card">
            <p class="label">Gukhan Hangul · 한자를 한글로</p>
            <p class="ex-replace">國漢文混用</p>
            <p class="ex-replace">音樂</p>
            <p>음절 하나의 너비는 한글 920입니다. N음절 합자는 그 N개를 더한 값입니다. 音樂은 음과 악의 너비를 가진 합자 하나입니다.</p>
          </div>
        </div>

        <h3>글리프 한도</h3>
        <p>OpenType 글리프 ID는 16비트입니다. Source Han Sans KR는 이미 24,973개입니다. 글자 독음, 두음 법칙 형태, 프로브 글리프를 뺀 나머지가 합자 예산이고, 끝에 64개를 남깁니다. 버린 합자는 0개입니다. 웹 서브셋은 한자가 아닌 문자, KS X 1001 한자, 이 페이지의 예문 한자만 남깁니다.</p>
        <div class="diagram">${budget(99)}</div>
        <table class="budget">
          <thead>
            <tr><th></th><th>ko-KR 전체</th><th>ko-KP 전체</th><th>ko-KR 웹</th><th>ko-KP 웹</th></tr>
          </thead>
          <tbody>
            <tr><td>글리프</td><td>41,259</td><td>41,313</td><td>33,310</td><td>33,596</td></tr>
            <tr><td>단어 합자</td><td>7,567</td><td>8,195</td><td>7,055</td><td>7,650</td></tr>
          </tbody>
        </table>
        <p>한자 애드온은 그 정적 글꼴에서 한자 cmap만 남긴 것입니다. 글리프는 ko-KR 24,438개, ko-KP 24,492개이고, cmap은 둘 다 8,497자입니다. 독음이 없는 한자 155자는 빼서 본문 글꼴에 맡깁니다.</p>

        <h3>한자만 얹기</h3>
        <p>애드온의 cmap은 한자뿐입니다. <code>unicode-range</code>를 그 8,497자와 같게 적어야, 글꼴에 없는 한자가 빈 칸이 되지 않고 다음 글꼴로 넘어갑니다. 블록 전체를 적으면, 없는 한자까지 이 글꼴이 맡아 빈 칸이 됩니다. 루비 애드온은 <code>ascent-override: 133%</code>, 치환은 <code>116%</code>, 디센더는 <code>28.8%</code>입니다. 애드온을 <code>font-family</code> 맨 앞에 두면 그 메트릭이 줄 높이를 정합니다.</p>
        <div class="diagram">${layerStack(99)}</div>
        <p>본문은 Gothic A1입니다. 한자가 없는 글꼴이라 첫 줄은 빈 상자입니다. 브라우저에 다른 한자 글꼴이 있으면 그 글자로 빈칸을 채우므로, 데모는 <code>Hanja Box</code>를 뒤에 둡니다. 아래 줄은 애드온이 한자만 그리고, <code>와</code> 같은 한글은 Gothic A1이 그립니다. 넷째 줄의 冷은 북한 독음 랭입니다.</p>
        <p class="layer-body">女子와 男女, 平壤 冷麵</p>
        <p class="layer-ruby">女子와 男女, 平壤 冷麵</p>
        <p class="layer-replace">女子와 男女, 平壤 冷麵</p>
        <p class="layer-kp">女子와 男女, 平壤 冷麵</p>
        <p>일곱 굵기와 가변 폰트는 <a href="https://github.com/morealdot/gukhan-font/releases">릴리스</a>에 있습니다. 가변 폰트의 루비 획은 굵기 축을 따라가고, 기본 인스턴스는 ExtraLight입니다. 한자 사이의 공백은 한글 사이보다 좁습니다. Regular에서 224이고, 한글 사이는 280입니다. 가로쓰기만 됩니다.</p>
        <p>빌드는 <code>planReadings</code>로 규칙을 한 번 고르고, <code>emitFamily</code>가 루비와 치환을 나눈 뒤, furifont <code>compileFont</code>가 윤곽과 GSUB를 씁니다. 한자 애드온은 그 정적 글꼴을 fontTools로 자릅니다. <a href="/gukhan-font/slides/">슬라이드</a>가 이 과정을 코드와 함께 설명합니다.</p>
      </section>`
}
