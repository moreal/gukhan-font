/** Modern Hangul syllable, U+AC00..U+D7A3. */
export const HANGUL_BASE = 0xAC00
export const HANGUL_LAST = 0xD7A3

export const CHOSEONG = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ']
export const JUNGSEONG = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ']
export const JONGSEONG = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ']

const CHO = new Map(CHOSEONG.map((j, i) => [j, i]))
const JUNG = new Map(JUNGSEONG.map((j, i) => [j, i]))
const JONG = new Map(JONGSEONG.map((j, i) => [j, i]))

export interface SyllableParts {
  cho: number
  jung: number
  jong: number
}

export function isHangulSyllable(text: string): boolean {
  if ([...text].length !== 1)
    return false
  const cp = text.codePointAt(0)!
  return cp >= HANGUL_BASE && cp <= HANGUL_LAST
}

export function decompose(syllable: string): SyllableParts | undefined {
  if (!isHangulSyllable(syllable))
    return undefined
  const index = syllable.codePointAt(0)! - HANGUL_BASE
  return { cho: Math.floor(index / 588), jung: Math.floor((index % 588) / 28), jong: index % 28 }
}

export function compose(cho: number, jung: number, jong: number): string {
  return String.fromCodePoint(HANGUL_BASE + (cho * 21 + jung) * 28 + jong)
}

/**
 * 한글 맞춤법 두음 법칙, applied to one syllable.
 * 녀·뇨·뉴·니 and 랴·려·례·료·류·리 lose their initial ㄴ/ㄹ (they start with ㅇ).
 * 라·래·로·뢰·루·르 change ㄹ to ㄴ. Batchim is kept, so 륙 → 육 and 률 → 율.
 */
const INITIAL_LAW: ReadonlyMap<string, number> = new Map(
  [
    ['녀', '여'], ['뇨', '요'], ['뉴', '유'], ['니', '이'],
    ['랴', '야'], ['려', '여'], ['례', '예'], ['료', '요'], ['류', '유'], ['리', '이'],
    ['라', '나'], ['래', '내'], ['로', '노'], ['뢰', '뇌'], ['루', '누'], ['르', '느'],
  ].map(([from, to]) => {
    const a = decompose(from)!
    const b = decompose(to)!
    return [`${a.cho}:${a.jung}`, b.cho] as const
  }),
)

const REVERT_LAW: ReadonlyMap<string, number[]> = (() => {
  const map = new Map<string, number[]>()
  for (const [key, cho] of INITIAL_LAW) {
    const jung = Number(key.split(':')[1])
    const id = `${cho}:${jung}`
    const fromCho = Number(key.split(':')[0])
    map.set(id, [...(map.get(id) ?? []), fromCho])
  }
  return map
})()

export function applyInitialSoundLaw(syllable: string): string {
  const parts = decompose(syllable)
  if (!parts)
    return syllable
  const cho = INITIAL_LAW.get(`${parts.cho}:${parts.jung}`)
  if (cho === undefined)
    return syllable
  return compose(cho, parts.jung, parts.jong)
}

/** Syllables that the initial-sound law could have produced this one from, batchim preserved. */
export function revertInitialSoundLaw(syllable: string): string[] {
  const parts = decompose(syllable)
  if (!parts)
    return []
  const chos = REVERT_LAW.get(`${parts.cho}:${parts.jung}`) ?? []
  return chos.map(cho => compose(cho, parts.jung, parts.jong))
}

/** 렬 or 률: the medial half of 두음 법칙 (모음이나 ㄴ 받침 뒤에서 열·율). */
export function isRyeolRyul(syllable: string): boolean {
  const parts = decompose(syllable)
  if (!parts)
    return false
  const rieul = CHO.get('ㄹ')!
  const yeo = JUNG.get('ㅕ')!
  const yu = JUNG.get('ㅠ')!
  const batchim = JONG.get('ㄹ')!
  return parts.cho === rieul && (parts.jung === yeo || parts.jung === yu) && parts.jong === batchim
}

/** No batchim, or batchim ㄴ. The syllable before 렬/률 when it becomes 열/율. */
export function allowsRyeolSoftening(syllable: string): boolean {
  const parts = decompose(syllable)
  if (!parts)
    return false
  return parts.jong === 0 || parts.jong === JONG.get('ㄴ')
}
