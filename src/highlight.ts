import { createHighlighter, type Highlighter } from 'shiki'

/** Warm paper theme. Token colors stay dark enough to read on #f3ecdf. */
const paper = {
  name: 'gukhan-paper',
  colors: {
    'editor.background': '#e7dfd0',
    'editor.foreground': '#1b1916',
  },
  tokenColors: [
    { settings: { foreground: '#1b1916' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#5c5348' } },
    { scope: ['keyword', 'storage', 'keyword.control'], settings: { foreground: '#8c2f2b' } },
    { scope: ['string', 'string.quoted'], settings: { foreground: '#1a5c45' } },
    { scope: ['constant.numeric', 'keyword.other.unit', 'constant.other'], settings: { foreground: '#6a4424' } },
    { scope: ['support.type.property-name', 'entity.other.attribute-name'], settings: { foreground: '#1e4d6b' } },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#3a342c' } },
  ],
}

const highlighter: Highlighter = await createHighlighter({
  themes: [paper],
  langs: ['css'],
})

/** Build-time CSS highlighting. The page ships the HTML, not Shiki. */
export function highlightCss(code: string): string {
  return highlighter.codeToHtml(code, { lang: 'css', theme: 'gukhan-paper' })
}
