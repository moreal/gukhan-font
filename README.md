# 국한 / Gukhan

한자는 그대로 두고, 독음을 위에 루비로 그리거나 그 한자를 한글로 바꿔 보여주는 글꼴입니다.

![루비, 치환, 북한어, 굵기, 한자 애드온](docs/demo.gif)

[라이브 데모](https://morealdot.github.io/gukhan-font/) · [슬라이드](https://morealdot.github.io/gukhan-font/slides/) · [릴리스](https://github.com/morealdot/gukhan-font/releases)

## 내려받기

폰트 패밀리마다 zip이 하나 있습니다. `GukhanSans`, `GukhanSansKP`, `GukhanHangul`, `GukhanHangulKP`. 정적 일곱 굵기, 가변 폰트, 웹 서브셋, 한자 애드온, `hanja.css`, `SHA256SUMS.txt`가 들어 있습니다.

## 쓰는 법

```html
<p class="ruby">國漢文混用으로 쓴 大韓民國.</p>
<style>
  @font-face {
    font-family: "Gukhan Sans";
    src: url("GukhanSans-Regular.woff2") format("woff2");
    font-weight: 400;
  }
  .ruby { font-family: "Gukhan Sans", sans-serif; line-height: 2; }
</style>
```

한자만 다른 한글 글꼴 위에 얹을 때는 애드온을 `font-family` 맨 앞에 둡니다. `unicode-range` 전체는 zip 안의 `hanja.css`입니다.

```html
<p class="gukhan-hanja">女子와 男女, 平壤 冷麵.</p>
<style>
  @font-face {
    font-family: "Gukhan Sans Hanja";
    src: url("GukhanSansHanja-Regular.woff2") format("woff2");
    font-weight: 400;
    unicode-range: /* hanja.css */;
    ascent-override: 133%;
    descent-override: 28.8%;
    line-gap-override: 0%;
  }
  .gukhan-hanja {
    font-family: "Gukhan Sans Hanja", "Pretendard", sans-serif;
    line-height: 2;
  }
</style>
```

한글 글꼴에도 애드온과 같은 `ascent-override`, `descent-override`, `line-gap-override`를 주세요. 루비는 133%, 치환은 116%라서 폰트 패밀리를 둘로 나눕니다. 예는 [안내](docs/guide.md)의 「본문 글꼴의 메트릭」에 있습니다.

`ss01`은 루비 폰트의 독음만 끕니다. 가변 폰트의 기본 인스턴스는 ExtraLight라서, 굵기를 지정합니다.

## 빌드

Node.js 22.14 이상, pnpm 10.33, Python 3의 fontTools 4.67.0.

```sh
pnpm install
python3 -m pip install --user fonttools==4.67.0
pnpm test
pnpm build
pnpm build:pages
pnpm slides:build
pnpm demo
```

동작, 측정값, 라이선스 출처는 [안내](docs/guide.md)에 있습니다. 릴리스 태그는 `v2026.10.17`처럼 `vYYYY.MM.DD`입니다.

## 라이선스

| | |
| --- | --- |
| 코드 | [MIT](LICENSE) |
| 글꼴 | [SIL OFL 1.1](OFL.txt). Adobe Source Han Sans KR에서 파생. 예약된 이름 Source는 이 글꼴의 이름이 아닙니다. |
| `vendor/furifont/` | [MIT](vendor/furifont/LICENSE.md), Anthony Fu, furifont 0.5.1 |
| 남한 사전 표 | [CC BY-SA 4.0](LICENSES/CC-BY-SA-4.0.txt) |
| 북한 사전 표 | [CC BY-SA 2.0 KR](https://creativecommons.org/licenses/by-sa/2.0/kr/) |
| Unihan | [Unicode License](LICENSES/Unicode-License.txt) |
| 데모의 Gothic A1 | SIL OFL 1.1. 예약된 이름은 Gothic A1. |
