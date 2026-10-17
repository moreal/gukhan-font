export interface FaceMetrics {
  unitsPerEm: number
  typoAscender: number
  typoDescender: number
  hheaAscender: number
  hheaDescender: number
  hheaLineGap: number
}

function table(font: Uint8Array, tag: string): DataView | undefined {
  const view = new DataView(font.buffer, font.byteOffset, font.byteLength)
  if (font.length < 12)
    return undefined
  const count = view.getUint16(4)
  for (let i = 0; i < count; i++) {
    const at = 12 + i * 16
    const name = String.fromCharCode(font[at]!, font[at + 1]!, font[at + 2]!, font[at + 3]!)
    if (name !== tag)
      continue
    const offset = view.getUint32(at + 8)
    const length = view.getUint32(at + 12)
    return new DataView(font.buffer, font.byteOffset + offset, length)
  }
  return undefined
}

/** Horizontal metrics the CSS overrides are written from. */
export function faceMetrics(font: Uint8Array, unitsPerEm: number): FaceMetrics {
  const os2 = table(font, 'OS/2')
  const hhea = table(font, 'hhea')
  if (!os2 || !hhea)
    throw new Error('font is missing OS/2 or hhea')
  return {
    unitsPerEm,
    typoAscender: os2.getInt16(68),
    typoDescender: os2.getInt16(70),
    hheaAscender: hhea.getInt16(4),
    hheaDescender: hhea.getInt16(6),
    hheaLineGap: hhea.getInt16(8),
  }
}

/**
 * Ascender after the ruby raise: the ideographic em top, plus ruby gap and scale.
 * Matches `raiseAscender` in the compiler, then the larger of that and the base hhea.
 */
export function rubyAscender(metrics: FaceMetrics, scale: number, gap: number): number {
  const top = metrics.typoAscender - metrics.typoDescender === metrics.unitsPerEm
    ? metrics.typoAscender
    : Math.round(0.88 * metrics.unitsPerEm)
  return Math.max(metrics.hheaAscender, Math.ceil(top + (gap + scale) * metrics.unitsPerEm))
}

export function cssPercent(value: number, unitsPerEm: number): string {
  return `${Number(((value / unitsPerEm) * 100).toFixed(2))}%`
}
