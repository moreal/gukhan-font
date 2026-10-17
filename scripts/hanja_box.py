"""A demo face that draws an empty box for Hanja Gothic A1 does not contain.

Without it, a browser that has a system CJK font paints those characters from
that font, and the layering sample no longer shows a gap. Mapping the Hanja
blocks onto one box glyph keeps the Hangul on Gothic A1 and the Hanja visible
as tofu.
"""

import sys
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

BLOCKS = ((0x3400, 0x4DBF), (0x4E00, 0x9FFF), (0xF900, 0xFAFF))

def contour(pen: TTGlyphPen, points: list[tuple[int, int]]) -> None:
    pen.moveTo(points[0])
    for point in points[1:]:
        pen.lineTo(point)
    pen.closePath()

def glyph(outer: list[tuple[int, int]], inner: list[tuple[int, int]] | None = None):
    pen = TTGlyphPen(None)
    contour(pen, outer)
    if inner:
        contour(pen, inner)
    return pen.glyph()

def main() -> None:
    dest = sys.argv[1]
    box = glyph(
        [(80, 40), (80, 760), (920, 760), (920, 40)],
        [(180, 140), (820, 140), (820, 660), (180, 660)],
    )
    missing = glyph([(0, 0), (0, 700), (500, 700), (500, 0)])
    cmap = {}
    for start, end in BLOCKS:
        for code in range(start, end + 1):
            cmap[code] = 'box'
    builder = FontBuilder(1000, isTTF=True)
    builder.setupGlyphOrder(['.notdef', 'box'])
    builder.setupCharacterMap(cmap)
    builder.setupGlyf({'.notdef': missing, 'box': box})
    builder.setupHorizontalMetrics({'.notdef': (500, 0), 'box': (1000, 0)})
    builder.setupHorizontalHeader(ascent=880, descent=-120)
    builder.setupOS2()
    builder.setupPost()
    builder.setupNameTable({
        'familyName': 'Hanja Box',
        'styleName': 'Regular',
        'uniqueFontIdentifier': 'HanjaBox-Regular',
        'fullName': 'Hanja Box Regular',
        'psName': 'HanjaBox-Regular',
        'version': 'Version 1.000',
    })
    # Chrome rejects the WOFF2 of this cmap (the Hanja blocks are one glyph). WOFF loads.
    if dest.endswith('.woff'):
        builder.font.flavor = 'woff'
    builder.save(dest)

if __name__ == '__main__':
    main()
