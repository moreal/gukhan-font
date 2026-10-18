import { highlightCss } from './highlight.ts'

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!)
}

const icon = (className: string, path: string) => `<svg class="${className}" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">${path}</svg>`

const clipboard = icon('clip', '<path d="M9 4.5h6v2h2.2a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H6.8a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1H9v-2z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 4.2h6v2.2H9z" fill="none" stroke="currentColor" stroke-width="1.6"/>')
const check = icon('check', '<path d="M5 12.5 9.2 16.7 19 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>')

/** Highlighted CSS with a corner copy button. The plain source is what gets copied. */
export function cssBlock(id: string, source: string): string {
  const highlighted = highlightCss(source)
  return `<div class="codeblock">
    <button class="copy" type="button" data-copy="${id}" aria-label="코드 복사">
      ${clipboard}
      ${check}
      <span class="copy-msg" aria-live="polite"></span>
    </button>
    <script type="text/plain" id="${id}">${escapeHtml(source)}</script>
    ${highlighted}
  </div>`
}

/** Shared by the landing and the local catalog. */
export function codeBlockCss(): string {
  return `
    .codeblock { position: relative; margin-top: 0.75rem; }
    .codeblock pre {
      margin: 0;
      padding: 0.95rem 2.8rem 0.95rem 1rem;
      background: #e7dfd0 !important;
      color: #1b1916;
      border: 1px solid rgba(27, 25, 22, 0.14);
      overflow-x: auto;
      font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
      font-size: 0.78rem;
      line-height: 1.55;
      white-space: pre;
      word-break: normal;
      text-wrap: nowrap;
    }
    .codeblock pre code { background: transparent; color: inherit; padding: 0; font-size: 1em; }
    .codeblock .line { display: block; }
    .codeblock .copy {
      position: absolute;
      top: 0.4rem;
      right: 0.4rem;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      min-width: 1.9rem;
      min-height: 1.9rem;
      padding: 0.28rem 0.38rem;
      color: #1b1916;
      background: #f7f3ea;
      border: 1px solid rgba(27, 25, 22, 0.16);
      cursor: pointer;
      opacity: 0;
    }
    .codeblock:hover .copy,
    .codeblock:focus-within .copy,
    .codeblock .copy.copied { opacity: 1; }
    .codeblock .copy .check,
    .codeblock .copy .copy-msg { display: none; }
    .codeblock .copy.copied .clip { display: none; }
    .codeblock .copy.copied .check { display: block; }
    .codeblock .copy.copied .copy-msg {
      display: inline;
      font-family: "Gothic A1", sans-serif;
      font-size: 0.75rem;
      letter-spacing: 0;
      color: #8c2f2b;
      white-space: nowrap;
    }
    @media (hover: none) {
      .codeblock .copy { opacity: 1; }
    }
    :not(pre) > code {
      font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
      font-size: 0.84em;
      background: #e7dfd0;
      color: #1b1916;
      padding: 0.1em 0.35em;
      border: 1px solid rgba(27, 25, 22, 0.12);
    }
  `
}

/** Click handler. Copies the plain source and shows a check plus 복사했습니다. */
export function copyScript(): string {
  return `document.querySelectorAll('[data-copy]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var node = document.getElementById(btn.getAttribute('data-copy'))
          var text = node ? node.textContent : ''
          var msg = btn.querySelector('.copy-msg')
          var done = function () {
            btn.classList.add('copied')
            btn.setAttribute('aria-label', '복사했습니다')
            if (msg) msg.textContent = '복사했습니다'
            setTimeout(function () {
              btn.classList.remove('copied')
              btn.setAttribute('aria-label', '코드 복사')
              if (msg) msg.textContent = ''
            }, 1400)
          }
          if (navigator.clipboard && navigator.clipboard.writeText)
            navigator.clipboard.writeText(text).then(done).catch(function () {})
        })
      })`
}
