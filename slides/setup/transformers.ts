import { defineTransformersSetup } from '@slidev/types'

/**
 * slidev-addon-subtitle injects SubtitleDisplay only while exporting.
 * The Pages deck is a normal build, so the same component is inserted here
 * for dev and build. Export stays on the addon's own path.
 */
export default defineTransformersSetup(() => ({
  pre: [
    (ctx) => {
      if (ctx.options.mode === 'export')
        return
      const note = ctx.slide.note?.trim()
      if (!note)
        return
      const source = ctx.s.toString()
      if (source.includes('<SubtitleDisplay'))
        return
      ctx.s.prepend('<SubtitleDisplay />\n\n')
    },
  ],
}))
