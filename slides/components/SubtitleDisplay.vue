<script setup lang="ts">
import { useNav, useSlideContext } from '@slidev/client'
import { defaultOptions, parseNoteToSubtitleTimeline, type SubtitleEntry } from 'slidev-addon-subtitle'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

/**
 * Slidev 53's production payload keeps the speaker note in `noteHTML` and
 * leaves `note` empty. The addon reads `note`, so a built deck would show
 * no subtitles and would not register clicks. This display reads `note` when
 * it is present and otherwise rebuilds the note text from `noteHTML`,
 * turning Slidev's click marks back into `[click:n]`.
 */
const { $clicks, $clicksContext: clicks, $renderContext, $route } = useSlideContext()
const { currentSlideNo } = useNav()
const showing = computed(() => $route?.no === currentSlideNo.value)

const registrationId = `gukhan-subtitle-${Math.random().toString(36).slice(2, 10)}`
const baseOffset = ref(0)
let stopWatch: (() => void) | undefined

function noteHtmlToSource(html: string): string {
  const withClicks = html.replace(/<span\b[^>]*slidev-note-click-mark[^>]*>\s*<\/span>/g, (tag) => {
    const index = /data-clicks="(\d+)"/.exec(tag)?.[1]
    return index ? `\n[click:${index}]\n` : '\n[click]\n'
  })
  return withClicks
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

const note = computed(() => {
  const slide = $route?.meta.slide
  const raw = slide?.note?.trim()
  if (raw)
    return raw
  return noteHtmlToSource(slide?.noteHTML ?? '')
})

const timeline = computed<SubtitleEntry[]>(() => parseNoteToSubtitleTimeline(note.value, defaultOptions))

function registerTimeline() {
  clicks.unregister(registrationId)
  baseOffset.value = clicks.currentOffset
  const items = timeline.value
  const lastStart = items.length > 0 ? items[items.length - 1]!.start : -1
  if (lastStart > 0)
    clicks.register(registrationId, { max: baseOffset.value + lastStart, delta: 0 })
}

onMounted(() => {
  registerTimeline()
  stopWatch = watch(timeline, () => registerTimeline(), { deep: true })
})

onUnmounted(() => {
  stopWatch?.()
  clicks.unregister(registrationId)
})

const localClicks = computed(() => $clicks.value - baseOffset.value)

const activeSubtitle = computed(() => {
  const items = timeline.value
  if (items.length === 0)
    return ''
  const click = localClicks.value
  for (let i = 0; i < items.length; i++) {
    const current = items[i]!
    const next = items[i + 1]
    const endExclusive = next ? next.start : current.start + 1
    if (click >= current.start && click < endExclusive)
      return current.text
  }
  return ''
})

const shouldRender = computed(() => Boolean(activeSubtitle.value) && showing.value && $renderContext.value === 'slide')
</script>

<template>
  <div v-if="shouldRender" class="pdf-subtitle" data-gukhan-subtitle>
    {{ activeSubtitle }}
  </div>
</template>
