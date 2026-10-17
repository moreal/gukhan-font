---
theme: default
title: 국한. 한자를 읽는 글꼴
addons:
  - subtitle
aspectRatio: 16/9
canvasWidth: 1120
colorSchema: light
highlighter: shiki
routerMode: hash
---

# 국한

글꼴이 한자를 읽고, 텍스트는 한자로 남습니다.

<p class="ruby">國漢文混用</p>

<!--
[subtitle:pause]
국한은 한자 위에 루비를 그리거나, 그 한자를 한글로 바꿔 그리는 글꼴입니다.
복사하고 검색해도 텍스트는 한자입니다.
-->

---

# 國漢文混用

한글과 한자를 한 문장에 섞어 쓰는 글입니다.

<p class="ruby">大韓民國의 憲法</p>

- 한자는 뜻을 가릅니다. `음악`만으로는 音樂인지 淫樂인지 보이지 않습니다.
- 독음은 그 한자를 소리 내어 읽게 합니다.
- 글을 쓴 사람이 한자를 고른 것입니다. 글꼴이 그 선택을 지우면 안 됩니다.

<!--
국한문혼용은 한글과 한자를 한 문장에 섞는 한국 글쓰기입니다.
한자는 같은 소리의 단어를 가릅니다. 음악이라는 소리만으로는 音樂인지 다른 말인지 알 수 없습니다.
그래서 독음이 필요합니다. 원문은 쓴 사람이 고른 한자 그대로입니다.
-->

---

# 마크업으로는 안 되는 이유

독음을 붙이는 흔한 방법은 글을 다른 데이터로 바꿉니다.

```html
<ruby>樂<rt>악</rt></ruby>
```

```ts
seonbi('音樂') // => '음악'
```

- `<ruby>`는 DOM을 바꿉니다. 복사, 검색, 인용, 플레인 텍스트 편집기에는 독음이 없습니다.
- 문자열을 한글로 바꾸면 한자가 사라집니다.
- 바꿔야 하는 것은 렌더링입니다. 코드포인트는 그대로입니다.

<!--
ruby 태그는 문서를 마크업으로 바꿉니다. 그 마크업 밖에는 독음이 없습니다.
선비처럼 문자열을 한글로 바꾸면 한자 자체가 사라집니다.
바꿔야 하는 층은 렌더링입니다. 유니코드 코드포인트는 한자로 남습니다.
-->

---

# 앞선 작업. 선비

[선비](https://github.com/dahlia/seonbi)는 한글 조판 라이브러리입니다.

- 한자를 한글 문자열로 바꿉니다.
- 두음 법칙을 적용합니다.
- ko-KR과 ko-KP를 나눕니다.
- 국립국어원 표준국어대사전 표를 정리해 두었습니다. 국한의 남한 단어 표는 그 데이터입니다.

국한은 선비 코드를 가져오지 않습니다. 데이터 라이선스에 따라 읽고, 치환은 글꼴 안에서 합니다.

<!--
선비는 한글 조판 라이브러리입니다. 한자를 한글로 바꾸고, 두음 법칙을 적용하고, 남한과 북한을 나눕니다.
국한의 남한 단어 목록은 선비가 정리한 표준국어대사전 표입니다.
코드는 가져오지 않았습니다. 선비는 문자열을 바꾸고, 국한은 글리프를 바꿉니다.
-->

---

# 앞선 작업. furifont

[antfu/furifont](https://github.com/antfu/furifont) 0.5.1은 후리가나를 글꼴이 직접 그리는 컴파일러입니다.

- 플랜을 받아 CFF 또는 glyf에 독음 윤곽을 그립니다.
- 피처 파일을 GSUB로 컴파일합니다.
- 어떤 한자를 어떤 독음으로 읽을지는 알지 못합니다.

`vendor/furifont/`가 그 컴파일러입니다. 라이선스는 MIT입니다. 국한이 더한 것은 `placement: 'replace'`입니다. 독음을 베이스라인에, 음절 너비로 그립니다.

<!--
furifont는 Anthony Fu가 만든 컴파일러입니다. 독음 윤곽을 글리프 안에 그리고, 피처 파일을 GSUB로 컴파일합니다.
어떤 한자를 어떻게 읽는지는 알지 못합니다. 그건 국한의 플래너가 정합니다.
vendor의 furifont는 0.5.1이고, 치환 배치만 국한이 더했습니다.
-->

---

# 어디서 왔나

<div class="cols">
<div>

### 萌神拼音字体

[MaruTama/Mengshen-pinyin-font](https://github.com/MaruTama/Mengshen-pinyin-font)

한자 위에 병음을 그립니다. 여러 독음은 GSUB `rclt`가 문맥으로 고르고, 수동 선택은 IVS로 합니다.

</div>
<div>

### Fira Code

합자 글꼴입니다. `!=`이라는 코드포인트 열이 GSUB `liga`로 그려진 글리프 하나가 됩니다.

국한의 `六月 → 유월`은 같은 종류의 치환입니다. 대상이 연산자가 아니라 독음입니다.

</div>
</div>

<!--
맹신 병음 글꼴은 한자 위에 병음을 그립니다.
여러 독음은 rclt 문맥 치환으로 고릅니다.
Fira Code는 프로그래밍 합자입니다.
코드포인트 열이 글리프 하나로 바뀝니다.
국한의 단어 합자는 그 둘을 한국어 독음에 씁니다.
-->

---

# 글꼴 파일은 표의 묶음

OTF와 TTF는 매직 넘버 다음에 테이블 디렉터리가 있는 sfnt입니다. 셰이핑이 읽는 표는 이렇습니다.

<Diagram name="fontTables" frozen />

<!--
글꼴 파일은 그림 한 장이 아닙니다.
sfnt 컨테이너 안의 표입니다.
cmap은 문자를 글리프 ID로 바꿉니다.
CFF나 glyf는 윤곽이고, hmtx는 진행 너비입니다.
maxp는 글리프 수를 셉니다.
GSUB는 글리프를 바꾸고, GPOS는 위치를 옮깁니다.
name은 폰트 패밀리 이름을 적습니다.
국한의 루비는 GPOS 마크가 아닙니다.
윤곽 안에 그려 넣고, 진행 너비는 hmtx에 적습니다.
-->

---

# 코드포인트와 글리프

텍스트의 `六`은 U+516D라는 코드포인트입니다. 글꼴 안의 그림은 다른 번호입니다.

<Diagram name="cmap" frozen />

```text
cmap  U+516D 六  →  glyph 2975  cid10936
cmap  U+6708 月  →  glyph 5271  cid20702
cmap  U+5973 女  →  glyph 3779  cid14218
```

측정은 `GukhanSans-Regular.otf`, 글리프 41,259개입니다. 독음 글리프는 이 표에 없습니다.

<!--
코드포인트와 글리프 ID는 다른 번호입니다.
육은 U+516D이고, 이 파일의 cmap은 그것을 글리프 2975로 보냅니다.
독음 글리프는 cmap에 없습니다. 문자 키가 없기 때문입니다. GSUB만 그 글리프에 도달합니다.
-->

---

# 셰이핑이 하는 일

HarfBuzz와 브라우저가 같은 파이프라인을 탑니다.

<Diagram name="pipeline" />

<!--
텍스트는 코드포인트의 배열입니다.
[click]
아이템화는 스크립트 런으로 나누고, 한자와 한글은 다른 런입니다.
[click]
cmap이 코드포인트를 글리프 ID로 바꿉니다.
[click]
GSUB가 글리프 ID를 바꾸고, 합자와 두음 법칙은 이 단계입니다.
[click]
GPOS는 위치를 옮기지만, 국한의 루비는 이 단계에 없습니다.
[click]
래스터라이저가 윤곽을 픽셀로 그립니다.
-->

---

# 아이템화. 스크립트 런

브라우저는 텍스트를 스크립트마다 나눕니다. 한자 런만 이 GSUB를 탑니다.

<Diagram name="runs" frozen />

```text
hb-shape GukhanSans-Regular.otf --text '大韓民國의 憲法'
[gid26352=0+1000|gid32991=1+1000|gid28555=2+1000|gid26142=3+1000
 |gid17325=4+920|gid1=5+224
 |gid27377=6+1000|gid28648=7+1000]
```

`gid=클러스터+진행너비`입니다. 클러스터 4는 `의`로 한글 진행 너비 920, 클러스터 5는 공백으로 224입니다.

<!--
HarfBuzz에서 등호 왼쪽은 글리프 ID입니다.
오른쪽은 클러스터와 진행 너비입니다.
대한민국은 클러스터 0부터 3이고, 진행 너비는 각 1000입니다.
의는 한글이라 진행 너비가 920입니다.
공백은 글리프 1이고 Regular에서 224입니다.
헌법부터 다시 한자 런입니다.
-->

---

# GSUB는 룩업의 목록

피처는 태그를 룩업에 연결할 뿐입니다. 규칙은 룩업 안에 있습니다.

```text
feature rclt {
  lookup words;
  lookup medial;
  lookup adjust;
} rclt;

feature ss01 {
  lookup ruby_off;
  lookup ruby_off_liga;
} ss01;
```

`rclt`는 필수 문맥 대체입니다. 한자 런에서는 셰이핑이 이 피처를 기본으로 켭니다. `liga`는 앱이 끌 수 있어서 쓰지 않습니다. `ss01`은 스타일 세트이고, 기본은 꺼져 있습니다.

<!--
피처 태그는 스위치이고, 룩업이 규칙입니다.
rclt에는 단어 합자, 글자 폴백, 두음 법칙이 이 순서로 들어 있습니다.
liga 대신 rclt를 씁니다. 많은 앱이 일반 합자를 끄지만, 한자 런의 필수 문맥 대체는 켜져 있습니다.
ss01은 기본으로 꺼진 스타일 세트입니다. 켜면 루비를 다시 한자로 바꿉니다.
-->

---

# 합자 치환. 피처 파일 그대로

`src/emit.ts`가 이 줄을 만듭니다. 이름 `gkw#####`는 사전 순 인덱스입니다.

```text
lookup words useExtension {
  sub uni516D uni6708 by gkw00891;
  sub uni4E0A uni6D77 by gkw00164;
  sub uni4E0A uni6D77 uni6599 uni7406 by gkw00165;
  sub uni4E0A uni6D77 uni81E8 uni6642 uni653F uni5E9C by gkw00166;
  sub uni97F3 uni6A02 by gkw08396;
} words;
```

한 룩업에 같은 앞글자의 규칙이 여러 개 있으면, 셰이핑은 가장 긴 일치를 고릅니다. 파일에 적힌 순서가 아니라 OpenType 스펙이 그렇게 정합니다.

<!--
이 블록은 빌드가 만든 피처 파일의 일부입니다. 꾸민 예제가 아닙니다.
육월은 uni516D와 uni6708을 gkw00891 하나로 바꿉니다.
상해, 상해요리, 상해임시정부가 같은 룩업에 있습니다.
OpenType 합자 치환은 가장 긴 일치를 고르므로, 더 긴 단어가 짧은 단어를 이깁니다.
-->

---

# 그 규칙의 셰이핑 결과

컴파일러가 `gkw00891`을 CFF 글리프 ID 34500으로 넣습니다. 이름은 cid로 바뀌고, 계약은 글리프 ID입니다.

```text
hb-shape GukhanSans-Regular.otf --text 六月
[gid34500=0+2000]

hb-shape GukhanSans-Regular.otf --text 六月 --features +ss01
[gid2975=0+1000|gid5271=0+1000]

hb-shape GukhanHangul-Regular.otf --text 六月
[gid34500=0+1840]
```

루비 폰트의 2000은 한자 전각 둘입니다. 치환 폰트의 1840은 한글 음절 920이 둘입니다. 글리프 ID는 같습니다.

<p class="ruby">六月</p>
<p class="replace">六月</p>

<!--
육월은 글리프 34500 하나이고, 클러스터 0, 진행 너비 2000입니다.
ss01을 켜면 글리프 2975와 5271, 곧 육과 월입니다.
둘 다 클러스터 0인 것은 한 합자에서 풀렸기 때문입니다.
치환 폰트도 같은 34500이고, 진행 너비는 1840입니다.
폭이 음절 두 개이기 때문입니다.
-->

---

# 글자 폴백, 그다음 문맥

합자에 없는 한자는 `medial` 룩업이 독음 글리프로 바꿉니다. 두음 법칙은 그다음입니다.

```text
sub uni5973 by gkc5973;
sub gkc5973 by gki5973;

lookup adjust useExtension {
  sub @open @ryeol' lookup surface;
  ignore sub @hanctx @dueum';
  sub @dueum' lookup surface;
} adjust;
```

`gkc5973`은 녀, `gki5973`은 여입니다. `ignore`는 한자 뒤에서는 두음 법칙을 적용하지 않는 문맥이고, 그다음 줄이 런의 첫 글자만 `surface` 룩업으로 보냅니다.

<!--
합자가 되지 않은 한자는 글자 폴백입니다. uni5973은 gkc5973, 곧 녀가 됩니다.
두음 법칙이 다른 글자는 gki 이름의 두 번째 글리프가 있습니다. 어두 형태입니다.
adjust 룩업의 ignore 규칙은 앞에 한자가 있으면 두음 법칙을 건너뜁니다.
그래서 런의 첫 글자만 surface 룩업을 타고 여가 됩니다.
-->

---

# 같은 코드, 다른 글리프 ID

`女子와 男女`를 Regular 루비 폰트로 셰이핑한 결과입니다.

<Diagram name="dueum" frozen />

```text
[gid26394=0+1000|gid26591=1+1000|gid17045=2+920|
 gid1=3+224|gid29649=4+1000|gid26393=5+1000]
```

U+5973이 두 번 나옵니다. gid 26394와 gid 26393입니다. 플래너의 이름은 `gki5973`, `gkc5973`입니다.

<!--
이 한 줄이 두음 법칙입니다.
첫 여자는 글리프 26394, 어두 형태 여입니다.
남은 글리프 29649이고, 그 뒤의 여자는 26393, 녀입니다.
코드포인트는 같고 글리프 ID만 다릅니다. 와와 공백은 한자 런이 아니라 베이스 글리프입니다.
-->

---

# 루비 글리프와 치환 글리프

규칙은 한 벌입니다. `emitFamily`가 그리는 방식만 나눕니다.

<Diagram name="draw" />

`上海`의 치환 진행 너비는 2760입니다. 상하이는 음절이 셋이라 920을 세 번 더한 값입니다.

<!--
루비 배치는 한자 위에 독음을 올리고, 진행 너비는 1000입니다.
[click]
치환 배치는 한자가 없고, 상해의 진행 너비는 2760입니다.
-->

---

# ss01은 루비를 끕니다

`ruby_off`가 글자 글리프를 cmap 글리프로 되돌리고, `ruby_off_liga`가 합자를 원래 한자 열로 되돌립니다.

```text
sub gki5973 by uni5973;
sub gkw00891 by uni516D uni6708;

font-feature-settings: "ss01" 1;
```

치환 폰트에는 이 스위치가 없습니다. 한자가 이미 한글로 바뀌어 있어서, 되돌릴 루비가 없습니다.

<!--
ss01은 스타일 세트입니다. 기본값은 0입니다.
켜면 루비 글리프와 합자가 원래 한자 글리프로 돌아갑니다. 육월이 다시 육과 월이 됩니다.
치환 폰트는 이 피처를 넣지 않습니다. 화면에 한자가 없고, 되돌릴 루비 층이 없기 때문입니다.
-->

---

# ko-KP는 다른 폰트 패밀리

같은 컴파일러, 다른 플랜입니다. 두음 법칙 단계가 없고, 우리말샘 표제어가 남한 단어보다 우선합니다.

<div class="cols">
<p class="ruby">平壤 冷麵<br>六月<br>困難</p>
<p class="kp">平壤 冷麵<br>六月<br>困難</p>
</div>

```text
hb-shape GukhanSansKP-Regular.otf --text 困難
[gid26056=0+1000|gid32378=1+1000]
```

남한 `困難`은 합자 하나, gid 35197, 진행 2000입니다. 북한은 곤과 난이라 합자가 없습니다.

<!--
북한 폰트 패밀리는 이름에 KP가 붙습니다.
두음 법칙을 적용하지 않아서 여자는 녀자고 냉면은 랭면입니다.
육월은 류월입니다. 시월의 시는 십의 두음이 아니라 사전 독음이라 그대로입니다.
곤란은 남한에서만 합자입니다. 북한 우리말샘은 곤난이라 글리프가 둘입니다.
-->

---

# 16비트가 예산을 정한다

글리프 ID는 `uint16`입니다. `maxp.numGlyphs`도 그렇습니다. 0은 `.notdef`에 쓰고, 사용 가능한 최대는 65,535입니다.

<Diagram name="budget" frozen />

```ts
const reserved = baseGlyphs + characterGlyphs + initialGlyphs + probe
const ligatureBudget = Math.max(0, 65535 - 64 - reserved)
```

ko-KR 예약은 24,973 + 8,144 + 574 + 1입니다. 합자 7,567개를 넣고도 버린 단어는 0개입니다.

<!--
예산은 글리프 ID가 16비트이기 때문입니다.
Source Han Sans KR이 이미 2만 5천 개 가까이 씁니다.
글자 독음과 두음 법칙 형태와 프로브를 더한 뒤 64개를 남깁니다.
그 나머지가 합자 예산입니다.
이번 빌드는 후보를 모두 넣었고, 버린 합자는 없습니다.
-->

---

# 한자 애드온은 cmap을 자른 글꼴

정적 글꼴을 fontTools로 잘라 한자 코드포인트만 남깁니다. 독음 글리프는 룩업이 참조하므로 글꼴 안에 남아 있고, cmap에는 없습니다.

<Diagram name="stack" frozen />

`unicode-range`를 블록 전체로 적으면, 글꼴에 없는 한자까지 이 글꼴이 맡아 빈 칸이 됩니다. 목록은 cmap과 같은 8,497자입니다.

<p class="plain">女子와 男女</p>
<p class="addon">女子와 男女</p>

<!--
애드온은 새 디자인이 아닙니다.
정적 글꼴에서 한자가 아닌 cmap 항목을 뺀 것입니다.
폰트 패밀리 맨 앞에 두면 한자만 애드온이 그립니다.
한글은 다음 글꼴로 넘어갑니다.
unicode-range를 블록으로 적으면 빠진 한자가 빈 칸이 됩니다.
그래서 unicode-range는 cmap과 같아야 합니다.
첫 줄은 Gothic A1이라 한자가 빈 상자입니다.
둘째 줄은 애드온이 한자만 그립니다.
-->

---

# 빌드 파이프라인

한 플랜을 두 번 그립니다. 지역마다 플랜이 다르고, 독음과 치환은 같습니다.

```ts
const planned = planReadings({ underlying, entries, coverage, glyphOf, initialSoundLaw })
const { plan } = emitFamily(planned, 'ruby' | 'replace', names)
const built = await compileFont({ plan, base, version, date, subsetWasm })
```

```ts
tables.set('GSUB', buildGsub(plan.fea, tables.get('GSUB'), resolve))
```

그다음 정적 글꼴을 `scripts/hanja_subset.py`가 자르고, Brotli 품질 11로 WOFF2를 만듭니다. `pnpm build`가 그 순서입니다. 릴리스 태그는 `vYYYY.MM.DD`입니다.

<!--
플래너가 사전과 Unihan으로 피처 파일과 글리프 목록을 만듭니다.
emitFamily가 같은 규칙을 루비 배치 또는 치환 배치로 넘깁니다.
컴파일러가 윤곽을 그리고, 피처 파일을 기존 GSUB에 합칩니다.
애드온은 그 결과를 fontTools로 자르고, 웹 서브셋은 Brotli로 압축합니다.
-->

---

# 룩업 타입은 정수다

`sub A B by C`는 룩업 타입 4, 합자 치환입니다. `ignore sub`와 `lookup surface`는 타입 6, 체인 문맥 치환입니다. `vendor/furifont/gsub.ts`가 둘 다 타입 7 Extension으로 감쌉니다.

```ts
const LOOKUP_TYPE = { single: 1, multiple: 2, alternate: 3, ligature: 4, chain: 6 } as const
const EXTENSION = 7

w.u16(EXTENSION).u16(lookup.flag).u16(lookup.subtables.length)
// extension subtable: format 1, then the real lookup type, then a 32-bit offset
w.u16(1).u16(e.type)
```

서브테이블 오프셋이 16비트면 합자 표가 넘칩니다. Extension의 오프셋은 32비트입니다. 베이스 GSUB의 룩업은 앞에 남고, 우리 룩업이 뒤에 붙습니다. 같은 태그가 있으면 그 피처의 룩업 인덱스 목록에 더합니다.

<!--
피처 파일의 sub 줄은 OpenType 룩업 타입으로 컴파일됩니다.
합자는 타입 4이고, 두음 법칙의 ignore와 문맥은 타입 6입니다.
오프셋이 16비트라 큰 표가 넘칩니다.
그래서 룩업을 타입 7로 감싸 32비트 오프셋을 씁니다.
베이스 GSUB는 남기고, 우리 룩업을 뒤에 붙입니다.
-->

---

# fontTools가 cmap을 자른다

furifont의 wasm `subsetFont`는 이 컴파일러가 다시 쓴 CFF 테이블을 버립니다. 한자 애드온은 `scripts/hanja_subset.py`입니다.

```python
font = TTFont(source)
options = Options()
options.layout_features = ['rclt', 'ss01']
options.notdef_outline = True
subsetter = Subsetter(options)
subsetter.populate(unicodes=unicodes)  # 한자 cmap, 8497개
subsetter.subset(font)
```

`layout_features`를 비우면 합자 글리프를 아무도 참조하지 않아 잘립니다. 그 다음 name ID 1, 4, 6, 16을 `Gukhan Sans Hanja`로 바꿉니다. 독음 글리프는 cmap에 없고, GSUB가 가리키므로 글꼴 안에 남습니다.

<!--
wasm subsetFont는 다시 쓴 CFF를 버리므로 애드온에는 쓰지 않습니다.
fontTools는 한자만 남기고 rclt와 ss01을 유지합니다.
합자 글리프는 그 피처가 참조해서 남습니다.
name 테이블의 폰트 패밀리를 애드온 이름으로 바꿉니다.
-->

---

# CSS

릴리스 zip의 WOFF2를 그대로 둡니다. 가변 폰트의 기본 인스턴스는 ExtraLight라서, 굵기를 지정합니다.

```css
@font-face {
  font-family: "Gukhan Sans";
  src: url("GukhanSans-Regular.woff2") format("woff2");
  font-weight: 400;
}
.ruby { font-family: "Gukhan Sans", sans-serif; line-height: 2; }
```

```css
@font-face {
  font-family: "Gukhan Sans Hanja";
  src: url("GukhanSansHanja-Regular.woff2") format("woff2");
  unicode-range: /* dist/hanja.css, cmap과 같은 8497자 */;
  ascent-override: 158%;
  descent-override: 28.8%;
  line-gap-override: 0%;
}
.gukhan-hanja {
  font-family: "Gukhan Sans Hanja", "Pretendard", sans-serif;
  line-height: 2;
}
```

<!--
정적 Regular의 폰트 패밀리는 Gukhan Sans이고, 굵기는 400입니다.
루비는 줄 높이 2가 필요합니다.
애드온은 폰트 패밀리 목록의 맨 앞에 둡니다.
unicode-range는 한자 스타일시트의 목록을 그대로 붙입니다.
ascent-override 158퍼센트는 루비 때문에 올린 hhea 어센더입니다.
descent-override는 28.8퍼센트입니다.
size-adjust 기본은 100퍼센트입니다.
본문 한글 키에 맞출 때만 바꿉니다.
-->

---

# 데모

[morealdot.github.io/gukhan-font](https://morealdot.github.io/gukhan-font/)

페이지에는 웹 서브셋, Regular 한자 애드온, Gothic A1, 그리고 굵기 슬라이더용 가변 폰트가 있습니다. 가변 폰트는 슬라이더를 움직이거나 굵기 목록이 보일 때 받습니다. 일곱 굵기의 정적 파일은 [릴리스](https://github.com/morealdot/gukhan-font/releases)에 있습니다.

<p class="ruby">音樂과 快樂, 女子와 男女</p>
<p class="replace">音樂과 快樂, 女子와 男女</p>

<!--
라이브 데모는 GitHub Pages입니다.
경로는 /gukhan-font/ 아래입니다.
페이지의 가변 폰트는 굵기 슬라이더와 굵기 목록에서 받습니다.
일곱 굵기의 정적 파일은 릴리스 zip에 있습니다.
화면의 문장을 복사하면 한자가 나옵니다.
-->

---

# 한계

- 한 글자의 독음이 여러 개면 폴백은 하나만 고릅니다. 다른 독음은 사전에 있을 때만 맞습니다.
- 셰이핑은 한자 런만 봅니다. 줄바꿈이 단어 중간이면 합자가 풀립니다.
- 베이스 글꼴에 획이 없는 한자는 독음도 없습니다.
- 우리말샘에 없는 북한 단어는 남한 독음에서 두음만 되돌린 값입니다.
- 가로쓰기만 됩니다. 루비는 GPOS 마크가 아니라 윤곽이라 세로쓰기 위치가 없습니다.
- 한자 사이 공백은 한글 사이보다 좁습니다. Regular에서 224이고, 한글 사이는 280입니다.
- 애드온의 획은 Source Han입니다. 본문 한글과 디자인이 다르면 `size-adjust`로 키를 맞춥니다.

<!--
한계는 구현이 숨긴 것이 아니라 모델의 경계입니다.
폴백은 독음을 하나만 고르고, 런이 끊기면 합자가 풀립니다.
북한어는 사전에 없는 단어를 남한 독음에서 두음만 되돌리므로 틀릴 수 있습니다.
세로쓰기는 없습니다. 루비를 마크 글리프로 붙이지 않았기 때문입니다.
공백 너비와 본문 글꼴과의 디자인 차이도 메트릭으로 남습니다.
-->

---

# 다음에 할 일

- 세로쓰기. 루비를 GPOS 마크로 옮기거나, 세로 메트릭을 따로 그리는 일입니다.
- 세리프 동반 폰트 패밀리. 지금은 Source Han Sans KR뿐입니다.
- 자주 쓰는 본문 글꼴의 `size-adjust` 프리셋.
- 우리말샘에 없는 북한 단어. 지금 값은 두음만 되돌린 근사입니다.
- 페이지 데모의 굵기. 파일 크기 때문에 Regular와 웹 서브셋만 올렸습니다.

규칙과 컴파일러는 그대로 두고, 베이스 글꼴과 사전만 바꾸는 쪽이 이 구조에 맞습니다.

<!--
다음 작업은 렌더링 모델을 넓히는 쪽입니다.
세로쓰기는 윤곽에 그린 루비의 한계를 넘어야 합니다.
세리프와 size-adjust 프리셋은 같은 플래너로 베이스만 바꾸면 됩니다.
북한 사전의 빈칸과, 페이지에 굵기를 더 올리는 일이 남아 있습니다.
-->

---

# 내려받기

[릴리스](https://github.com/morealdot/gukhan-font/releases)의 zip 네 개. `GukhanSans`, `GukhanSansKP`, `GukhanHangul`, `GukhanHangulKP`.

각 zip에 정적 일곱 굵기, 가변, 웹 서브셋, 한자 애드온, `hanja.css`, `SHA256SUMS.txt`가 있습니다.

코드는 MIT, 글꼴은 SIL OFL, 남한 사전은 CC BY-SA 4.0, 북한 사전은 CC BY-SA 2.0 KR, Unihan은 Unicode 라이선스입니다.

<!--
받는 곳은 GitHub 릴리스입니다. 폰트 패밀리마다 zip이 하나이고, 체크섬이 들어 있습니다.
코드는 MIT, 글꼴 파일은 OFL, 사전과 Unihan은 각자의 라이선스입니다.
Source Han의 예약된 이름 Source는 이 글꼴의 이름이 아닙니다.
-->
