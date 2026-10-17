<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import { budget, cmapPicture, draw, dueum, fontTables, layerStack, liga, pipeline, runs } from '../../shared/diagrams'

const props = defineProps<{
  name: 'fontTables' | 'cmap' | 'pipeline' | 'runs' | 'liga' | 'dueum' | 'draw' | 'budget' | 'stack'
  frozen?: boolean
}>()

const { $clicks } = useSlideContext()
const fns = { fontTables, cmap: cmapPicture, pipeline, runs, liga, dueum, draw, budget, stack: layerStack }
const html = computed(() => fns[props.name](props.frozen ? 99 : $clicks.value))
</script>

<template>
  <div class="diagram" v-html="html" />
</template>
