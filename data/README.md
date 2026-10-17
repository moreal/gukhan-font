# Dictionary data

## `ko-kr-stdict.tsv`

Sino-Korean word list used by [seonbi](https://github.com/dahlia/seonbi) 0.2.2 (`data/ko-kr-stdict.tsv` in the crate). Each row is a Hanja headword and its Hangul reading, extracted from the **표준국어대사전 (Standard Korean Language Dictionary)** published by the **국립국어원 (National Institute of Korean Language, NIKL)**.

- Source dictionary: 표준국어대사전, 국립국어원. https://stdict.korean.go.kr/
- License of this extract: [CC BY-SA 4.0](../LICENSES/CC-BY-SA-4.0.txt). Share-alike applies to the table itself.
- Packaged by Hong Minhee in seonbi. This repository does not copy seonbi's Haskell or Rust source.

The file is the South Korean (ko-KR) reading, so 두음 법칙 is already applied inside multi-character entries (女子 여자, 男女 남녀, 六月 유월).

## `khangul.json`

Per-character Hangul readings. The syllables come from the Unicode Unihan database field `kHangul` ([Unicode License](../LICENSES/Unicode-License.txt)). The file is the extract published with seonbi (`src/Text/Seonbi/Unihan/kHangul.json`), which pairs each syllable with a short citation: `0`/`1` for KS X 1001 / KS X 1002, and `E` / `N` for 교육용 기초 한자 / 인명용 한자. Gukhan-font uses those citations only to choose one underlying syllable, then applies 두음 법칙 itself.

Unihan data: Unicode, Inc. https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip
