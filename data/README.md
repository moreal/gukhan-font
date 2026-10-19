# Dictionary data

The font files stay under the SIL OFL. These tables are the dictionary extracts the build reads. They are not relicensed by this file.

## `ko-kr-stdict.tsv`

Sino-Korean word list used by [선비 (seonbi)](https://github.com/dahlia/seonbi) 0.2.2 (`data/ko-kr-stdict.tsv` in the crate). Each row is a Hanja headword and its Hangul reading, extracted from the **표준국어대사전 (Standard Korean Language Dictionary)**.

- Source dictionary: [표준국어대사전](https://stdict.korean.go.kr/).
- Rights holder: 국립국어원 (National Institute of Korean Language).
- License: [CC BY-SA 2.0 KR](https://creativecommons.org/licenses/by-sa/2.0/kr/) (Creative Commons Attribution-ShareAlike 2.0 Korea). 국립국어원 states this for text on the dictionary site: [표준국어대사전 저작권 정책](https://stdict.korean.go.kr/join/copyrightPolicy.do). Share-alike applies to the table itself. A pointer to that license is in [LICENSES/CC-BY-SA-2.0-KR.txt](../LICENSES/CC-BY-SA-2.0-KR.txt). This repository used to label the extract CC BY-SA 4.0; that label does not match the institute’s copyright policy, and the 4.0 text is no longer in the tree.
- Intermediate project: packaged by Hong Minhee (홍민희), dahlia, in 선비 0.2.2. 선비’s code is [LGPL-2.1](https://github.com/dahlia/seonbi/blob/main/LICENSE). That code license does not replace the dictionary license. This repository does not copy 선비’s Haskell or Rust source.

The file is the South Korean (ko-KR) reading, so 두음 법칙 is already applied inside multi-character entries (女子 여자, 男女 남녀, 六月 유월).

## `ko-kp-opendict.tsv`

North Korean (ko-KP) headwords. Each row is `hanja`, `hangul`, `require_hanja`, `require_hangul`. The file is the 우리말샘 북한어 extract published with [gukhanmun](https://gukhanmun.org/) (`crates/gukhanmun-opendict/data/north-korean.tsv` in [dahlia/gukhanmun](https://github.com/dahlia/gukhanmun)), dumped 2026-06-03 from the 우리말샘 snapshot of that date. gukhanmun is Hong Minhee’s library for turning mixed-script Korean into Hangul text. It is not this font.

- Source dictionary: [우리말샘](https://opendict.korean.go.kr/).
- Rights holder: 국립국어원 (National Institute of Korean Language).
- License: [CC BY-SA 2.0 KR](https://creativecommons.org/licenses/by-sa/2.0/kr/). 국립국어원 states this for text on the dictionary site: [우리말샘 저작권 정책](https://opendict.korean.go.kr/service/copyrightPolicy). Share-alike applies to the table itself.
- Intermediate project: extracted by dahlia / Hong Minhee (홍민희) in gukhanmun. gukhanmun’s code is [GPL-3.0](https://github.com/dahlia/gukhanmun/blob/main/LICENSE). Its data [NOTICE.md](https://github.com/dahlia/gukhanmun/blob/main/NOTICE.md) says this 우리말샘 extract is CC BY-SA 2.0 KR. The code license does not replace the dictionary license. This repository does not copy gukhanmun’s Rust source.
- SHA-256: `cdc67c66b3c5febf870a406188e9621dd3a72654b5e878de1e9fb25b40db6256`

A headword of two or more Hanja wins over the South Korean table. Headwords that are not in this file keep the South Korean reading with only 두음 법칙 undone, so a real alternate (音樂 음악, 十月 시월) stays and an unlisted lexical difference can be wrong. A one-character row whose reading is a single syllable replaces the Unihan fallback for that character; eleven of them differ. `require_hanja` and `require_hangul` are ignored: the font always substitutes. The first row would win if a headword were repeated; this dump has no repeats.

## `khangul.json`

Per-character Hangul readings. The syllables are the Unicode Unihan database field `kHangul`, under the [Unicode License](../LICENSES/Unicode-License.txt). The file is the extract packed by 선비 (`src/Text/Seonbi/Unihan/kHangul.json`), which pairs each syllable with a short citation: `0`/`1` for KS X 1001 / KS X 1002, and `E` / `N` for 교육용 기초 한자 / 인명용 한자. Gukhanmun-font uses those citations only to choose one underlying syllable, then applies 두음 법칙 itself. 선비’s LGPL-2.1 covers its code, not this Unihan extract.

Unihan data: Unicode, Inc. https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip
