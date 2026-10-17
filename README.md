# 국한 / Gukhan Sans · Gukhan Hangul

같은 한자에 독음을 다는 글꼴 두 개입니다. `國漢文混用`이라고만 적습니다. `<ruby>`도, 자바스크립트도 필요 없고, 복사하면 한자 그대로입니다.

- **Gukhan Sans**는 한글 독음 `국한문혼용`을 한자 위에 그립니다.
- **Gukhan Hangul**은 그 한자를 독음 자체로 바꿉니다. 화면에는 `국한문혼용`만 보입니다.

Two families from one reading plan. Gukhan Sans draws the Hangul above the Hanja. Gukhan Hangul replaces the Hanja with that reading, at the same width as ordinary Hangul. Copy, paste, and search still see the Hanja.

![國漢文混用 in Gukhan Sans and Gukhan Hangul](demo/screenshot-specimen.png)

## 쓰는 법

```html
<p class="ruby">國漢文混用으로 쓴 大韓民國.</p>
<p class="hangul">國漢文混用으로 쓴 大韓民國.</p>
<style>
  @font-face {
    font-family: "Gukhan Sans";
    src: url("GukhanSans-Regular.woff2") format("woff2");
  }
  @font-face {
    font-family: "Gukhan Hangul";
    src: url("GukhanHangul-Regular.woff2") format("woff2");
  }
  .ruby { font-family: "Gukhan Sans", sans-serif; line-height: 2; }
  .hangul { font-family: "Gukhan Hangul", sans-serif; }
</style>
```

Gukhan Sans는 `line-height`를 1.8 이상으로 두세요. 독음은 전각 상자 위에 그려지므로, 줄 간격이 좁으면 잘립니다. `font-feature-settings: "ss01" 1`이면 그 글꼴의 독음이 꺼지고 원래 한자만 남습니다. Gukhan Hangul에는 그 스위치가 필요 없습니다. 한자가 이미 한글로 바뀌어 있습니다.

Set `line-height` to 1.8 or more for Gukhan Sans so the reading is not clipped. Stylistic set `ss01` turns that family's readings off.

## 빌드

Node.js 22.14 이상이 필요합니다. 베이스 글꼴은 빌드가 Adobe Source Han Sans KR Regular(2.005R)를 받아 `.cache/`에 둡니다.

```sh
npm install
npm test
npm run build
npm run demo   # http://localhost:4173/demo/
```

`npm test`는 글꼴 없이 읽음 규칙만 확인합니다. `npm run build`가 두 글꼴을 같이 만듭니다.

| | OTF | WOFF2 |
| --- | ---: | ---: |
| `dist/GukhanSans-Regular` | 14,200,272 bytes | 3,897,684 bytes |
| `dist/GukhanHangul-Regular` | 7,884,472 bytes | 3,491,732 bytes |

크기는 빌드가 `dist/report.json`의 `families`에 다시 적습니다. 데모 페이지도 그때 `demo/index.html`로 다시 씁니다.

## 동작

브라우저가 글을 모양 내기 전에 문자 체계마다 자릅니다. 한자(Han)와 한글은 다른 체계라, 글꼴이 보는 것은 **한자가 이어진 구간**뿐입니다. 그 구간 안에서 OpenType `rclt`가 다음 순서로 글자를 바꿉니다.

1. **단어 합자.** 사전에 있는 여러 글자 단어는 독음이 그려진 합자 하나로 바뀝니다. 같은 첫 글자에서는 긴 단어가 이깁니다. `六月`은 `유월`이고, 그 안의 `六`이 `육`으로 갈라지지 않습니다.
2. **글자 폴백.** 남은 한자는 Unihan `kHangul`에서 고른 한 음절로 읽습니다. 그래서 사전에 없는 한자도 독음이 붙습니다.
3. **두음 법칙.** 남한 맞춤법입니다. 구간 첫 글자만 `녀→여`, `래→내`, `륙→육`처럼 바뀝니다. `女子`는 `여자`, `男女`는 `남녀`입니다. 모음이나 ㄴ 받침 뒤의 `렬`/`률`은 `열`/`율`이 되어 `比率`은 `비율`, `法律`은 `법률`입니다.

합자는 폴백만으로는 틀리는 단어에만 씁니다. `音樂`의 `樂`은 글자 폴백이 `락`이라 `음락`이 되므로 합자로 `음악`을 넣습니다. `快樂`은 폴백이 이미 `쾌락`이라 합자가 없고, 보이는 결과는 같습니다. 짧은 단어부터 정하고, 그 합자를 써도 틀린 긴 단어만 다시 합자로 남깁니다. 그래서 사전의 표제어는 글꼴이 그 독음으로 읽습니다.

두 글꼴은 `planReadings` 한 번으로 같은 합자, 같은 글자 폴백, 같은 `rclt` 규칙을 고릅니다. 그리는 방식만 다릅니다.

- **Gukhan Sans**는 한자 획을 두고 그 위에 독음을 축소해서 올립니다.
- **Gukhan Hangul**은 한자 획을 그리지 않고, 독음의 음절을 제 크기로 나란히 놓습니다. 음절 하나의 너비는 베이스 글꼴의 한글(920)이고, N음절 합자는 그 N개의 합입니다. `音樂`은 글자 둘을 `음`+`악` 너비의 합자 하나로 바꿉니다. `上海`처럼 음절이 글자보다 많으면(`상하이`) 음절 수만큼의 너비가 됩니다.

This follows [furifont](https://github.com/antfu/furifont): one plan, then a compiler draws it into a CFF font and appends OpenType lookups. The compiler in `vendor/furifont/` is furifont's, MIT. Gukhan adds a `replace` placement that draws Hangul on the baseline instead of ruby. Korean readings, 두음 법칙, and which words become ligatures are implemented here and are not a copy of seonbi's code.

Browsers itemize by script, so the font only ever sees a run of Hanja. Inside that run, required contextual alternates (`rclt`) apply longest-match word ligatures, then a per-character reading, then the South Korean initial-sound rule. A ligature is spent only when the per-character reading would be wrong (`音樂` → 음악, where the fallback would say 음락). Words the fallback already reads correctly (`快樂` → 쾌락, `國漢文混用` → 국한문혼용) look the same without a ligature.

## 글자 수

OpenType 글꼴 하나의 글리프는 65,535개가 한계입니다. Source Han Sans KR Regular는 이미 24,973개입니다. 이 프로토타입은 그 위에 다음을 올립니다 (`dist/report.json`).

| | 개수 |
| --- | ---: |
| 베이스 글리프 | 24,973 |
| 한자 독음 (글자당 하나, 같은 획은 하나로) | 8,144 |
| 두음이 다른 첫소리 형태 | 574 |
| 단어 합자 | 7,567 |
| 버전 확인용 빈 글리프 | 1 |
| **합계** | **41,259** |
| 한계까지 남은 자리 | 약 24,000 |

합자 7,567개는 베이스 글꼴에 획이 있는 사전 표제어 231,533개 가운데, 글자 폴백과 더 짧은 합자만으로는 독음이 어긋나는 단어입니다. 예산이 모자라 버린 단어는 0개입니다. 같은 획을 공유하는 호환용 한자(女 = 女)는 독음 글리프를 다시 만들지 않습니다.

자리를 더 쓰는 방법은 `src/emit.ts`의 합자 예산입니다. 한계는 65,535에서 여유 64를 뺀 값이고, 글자 독음을 먼저 예약한 뒤 남은 수만큼 짧은 단어부터 합자를 넣습니다. 베이스를 더 작은 서브셋으로 바꾸거나 합자 상한을 낮추면 파일이 줄고, 반대로 예산 안의 정상 단어도 합자로 넣을 수 있습니다. 그 단어는 지금과 같은 모습이라 독음이 늘지는 않습니다.

The 7,567 ligatures are every in-font dictionary word whose reading is not already produced by shorter matches plus the per-character fallback. Nothing was dropped for the glyph limit. Another ~24,000 glyph ids remain. Both families spend the same ids; only the outlines differ. Scaling means raising or lowering that ligature budget. Adding words the fallback already reads correctly does not change what a reader sees.

## 한계

- 한 글자에 독음이 여럿이면 글자 폴백은 그중 하나만 고릅니다. `樂`은 기본적으로 `락`이고, `음악`처럼 다른 독음은 사전에 있을 때만 맞습니다. 사전에 없는 `악`은 틀립니다.
- 글꼴은 한자 구간만 봅니다. 줄이 단어 중간에서 끊기면 합자가 풀립니다.
- 베이스 글꼴에 없는 한자(대부분 확장 한자)는 이 글꼴이 그리지 않으므로 독음도 없습니다. 사전 표제어 1,621개가 그래서 빠졌습니다.
- Unihan에 독음이 없는 한자는 그대로 둡니다.
- 기본값은 남한식(ko-KR)입니다. `平壤 冷麵`은 `평양 냉면`입니다. 북한식 `평양 랭면`은 글자 폴백에서 두음 법칙을 끄면 나오지만, 사전 표제어 자체가 남한 독음이라 별도 글꼴이 필요합니다.
- 가로쓰기만 됩니다. 세로쓰기용 독음 위치는 없습니다.
- Gukhan Hangul에서 한자 사이의 공백은 한자 구간으로 남습니다. 베이스 글꼴은 한글 사이의 공백을 280, 한자 사이의 공백을 224로 두므로, `平壤 冷麵`의 빈칸은 `평양 냉면`의 빈칸보다 조금 좁습니다. 음절 자체의 너비는 한글과 같습니다.
- 호환용 한자와 본자가 같은 획이면 독음도 하나입니다. 둘의 사전 독음이 다르면 본자 쪽을 택합니다.

## 라이선스

| | |
| --- | --- |
| 이 저장소의 코드 | [MIT](LICENSE) |
| `vendor/furifont/` | [MIT](vendor/furifont/LICENSE.md), Anthony Fu, [furifont](https://github.com/antfu/furifont) 0.5.1 |
| 글꼴 (`dist/`의 OTF, WOFF2) | [SIL OFL 1.1](OFL.txt). Adobe Source Han Sans KR에서 파생. 예약된 이름 Source는 이 글꼴의 이름이 아닙니다. |
| `data/ko-kr-stdict.tsv` | [CC BY-SA 4.0](LICENSES/CC-BY-SA-4.0.txt). 국립국어원 표준국어대사전. seonbi가 정리한 표. |
| `data/khangul.json` | [Unicode License](LICENSES/Unicode-License.txt). Unihan `kHangul`. seonbi가 KS X 인용과 함께 정리한 파일. |

글꼴 파일의 획은 OFL이고, 그 안에 컴파일된 독음 선택은 위 사전과 Unihan에서 왔습니다. 이름 테이블에 그 출처를 적었습니다.
