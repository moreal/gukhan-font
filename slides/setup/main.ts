import { defineAppSetup } from '@slidev/types'
import SubtitleDisplay from '../components/SubtitleDisplay.vue'

export default defineAppSetup(({ app }) => {
  // Replace the addon's display. Its parser never sees a note in a Slidev 53 build.
  app.component('SubtitleDisplay', SubtitleDisplay)
})
