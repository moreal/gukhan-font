import type { FamilyStyle } from './emit.ts'
import type { Region } from './region.ts'

export const WEIGHTS = [
  { name: 'ExtraLight', css: 250 },
  { name: 'Light', css: 300 },
  { name: 'Normal', css: 350 },
  { name: 'Regular', css: 400 },
  { name: 'Medium', css: 500 },
  { name: 'Bold', css: 700 },
  { name: 'Heavy', css: 900 },
] as const

export type WeightName = (typeof WEIGHTS)[number]['name']
export type ProductKind = 'static' | 'vf' | 'web' | 'hanja'

export interface ProductName {
  family: string
  /** File stem. A static or Hanja file appends `-${weight}`. */
  stem: string
  description: string
}

const KR_WORDS = 'Word readings: 표준국어대사전 (Standard Korean Language Dictionary), 국립국어원, CC BY-SA 2.0 KR, via 선비 (seonbi).'
const KP_WORDS = 'Word readings: 우리말샘 (Urimalsaem) 북한어, 국립국어원, CC BY-SA 2.0 KR, via gukhanmun. Headwords missing there keep the 표준국어대사전 reading (국립국어원, CC BY-SA 2.0 KR) with only 두음 법칙 undone, so unlisted words can still be wrong.'

function draw(style: FamilyStyle): string {
  return style === 'ruby'
    ? 'Hangul readings above Hanja.'
    : 'Hanja replaced by Hangul readings, each syllable at its own advance.'
}

function kindNote(kind: ProductKind): string {
  if (kind === 'web')
    return ' Web subset: every non-Hanja character of the base font, KS X 1001 Hanja, and the sample Hanja. Other Hanja are not in this file.'
  if (kind === 'hanja')
    return ' Hanja-only add-on. The cmap lists Hanja this font can read; Hangul and Latin are not mapped, so another face can draw them via unicode-range.'
  if (kind === 'vf')
    return ' Variable weight axis wght 250–900. The reading outlines follow the axis because they are drawn from the base glyphs.'
  return ''
}

/** Family and file names. `Source` is never one of them. */
export function productName(style: FamilyStyle, region: Region, kind: ProductKind): ProductName {
  const base = style === 'ruby' ? 'Gukhanmun Sans' : 'Gukhanmun Hangul'
  const file = style === 'ruby' ? 'GukhanmunSans' : 'GukhanmunHangul'
  const kp = region === 'ko-KP'
  const family = kind === 'static'
    ? (kp ? `${base} KP` : base)
    : kind === 'vf'
      ? (kp ? `${base} KP VF` : `${base} VF`)
      : kind === 'web'
        ? (kp ? `${base} KP Web` : `${base} Web`)
        : (kp ? `${base} KP Hanja` : `${base} Hanja`)
  const stem = kind === 'static'
    ? (kp ? `${file}KP` : file)
    : kind === 'vf'
      ? (kp ? `${file}KPVF` : `${file}VF`)
      : kind === 'web'
        ? (kp ? `${file}KP-Web` : `${file}-Web`)
        : (kp ? `${file}KPHanja` : `${file}Hanja`)
  const ortho = region === 'ko-KR'
    ? `South Korean readings (ko-KR), including 두음 법칙. ${KR_WORDS}`
    : `North Korean readings (ko-KP), without 두음 법칙. ${KP_WORDS}`
  const description = `${draw(style)} Outlines from Adobe Source Han Sans KR; the reserved name Source is not a name of this font. ${ortho} Character readings: Unicode Unihan kHangul.${kindNote(kind)}`
  return { family, stem, description }
}

export function fileName(style: FamilyStyle, region: Region, kind: ProductKind, weight?: WeightName): string {
  const { stem } = productName(style, region, kind)
  if (kind === 'vf')
    return stem
  if (kind === 'web')
    return stem
  if (!weight)
    throw new Error(`${kind} file needs a weight`)
  return `${stem}-${weight}`
}
