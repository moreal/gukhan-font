"""Keep a built family's Hanja readings and drop every other mapped character.

fontTools subsets the CFF outlines. The wasm subsetter in the font build drops
the CFF table of a font this compiler has rewritten, so this step is Python.
"""

import sys
from fontTools.ttLib import TTFont
from fontTools.subset import Options, Subsetter

def english(font: TTFont, name_id: int) -> str | None:
    for record in font['name'].names:
        if record.nameID == name_id and record.platformID == 3 and record.langID == 0x409:
            return record.toUnicode()
    return None

def replace_name(font: TTFont, name_id: int, text: str) -> None:
    table = font['name']
    # Platform 1 is Mac Roman and cannot store the Korean description.
    table.names = [record for record in table.names if not (record.nameID == name_id and record.platformID == 1)]
    found = False
    for record in table.names:
        if record.nameID == name_id and record.platformID == 3:
            record.string = text
            found = True
    if not found:
        table.setName(text, name_id, 3, 1, 0x409)

def main() -> None:
    source, dest, family, description_path, unicodes_path = sys.argv[1:]
    unicodes = [int(line, 16) for line in open(unicodes_path, encoding='utf-8') if line.strip()]
    description = open(description_path, encoding='utf-8').read()
    font = TTFont(source)
    options = Options()
    options.layout_features = ['rclt', 'ss01']
    options.notdef_outline = True
    options.name_IDs = ['*']
    options.name_languages = ['*']
    subsetter = Subsetter(options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    style = english(font, 17) or english(font, 2) or 'Regular'
    postscript = f"{family.replace(' ', '')}-{style.replace(' ', '')}"
    version = english(font, 5) or 'Version 0.200'
    replace_name(font, 1, family)
    replace_name(font, 3, f"{version.removeprefix('Version ')};{postscript}")
    replace_name(font, 4, f"{family} {style}")
    replace_name(font, 6, postscript)
    replace_name(font, 10, description)
    replace_name(font, 16, family)
    replace_name(font, 17, style)
    font.save(dest)

if __name__ == '__main__':
    main()
