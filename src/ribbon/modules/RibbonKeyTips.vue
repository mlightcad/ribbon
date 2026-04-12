<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { KeyTipModel } from '../types'

/**
 * @component MlRibbonKeyTips
 * @description
 * Keyboard hint overlay that displays available key tips and supports incremental
 * key-sequence input while the overlay is open.
 *
 * @prop open - Controls key tips overlay visibility.
 * @prop tips - Registered key tip models for the current ribbon scope.
 * @prop sequencePrefix - Optional prefix label rendered before current sequence.
 * @prop emptySequenceText - Placeholder text when no key sequence is entered.
 *
 * @example
 * ```vue
 * <MlRibbonKeyTips
 *   :open="keyTipsOpen"
 *   :tips="registeredTips"
 *   sequence-prefix="Key sequence: "
 *   empty-sequence-text="(none)"
 * />
 * ```
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    tips: KeyTipModel[]
    sequencePrefix?: string
    emptySequenceText?: string
  }>(),
  { tips: () => [] },
)
const emit = defineEmits<{
  (e: 'activate', tip: KeyTipModel): void
  (e: 'close'): void
}>()

const input = ref('')
const matched = computed(() => {
  if (!input.value) return props.tips
  return props.tips.filter((tip) => tip.key.toLowerCase().startsWith(input.value.toLowerCase()))
})
const displaySequence = computed(() => input.value || props.emptySequenceText || '')
const hintText = computed(() => {
  if (!props.sequencePrefix) return displaySequence.value
  return `${props.sequencePrefix}${displaySequence.value}`
})
const normalizedInput = computed(() => input.value.toLowerCase())
const exactMatches = computed(() =>
  props.tips.filter((tip) => tip.key.toLowerCase() === normalizedInput.value),
)
const hasPrefixMatches = computed(() =>
  props.tips.some((tip) => tip.key.toLowerCase().startsWith(normalizedInput.value)),
)

/**
 * Resets currently entered key-tip input sequence.
 */
function resetInput() {
  input.value = ''
}

/**
 * Handles incremental key-tip sequence input while overlay is open.
 * @param event Keyboard event from window listener.
 */
function onKeydown(event: KeyboardEvent) {
  if (!props.open) return
  if (event.altKey || event.ctrlKey || event.metaKey) return
  if (event.key === 'Escape') {
    event.preventDefault()
    resetInput()
    emit('close')
    return
  }
  if (event.key === 'Backspace') {
    event.preventDefault()
    input.value = input.value.slice(0, -1)
    return
  }
  if (/^[a-z0-9]$/i.test(event.key)) {
    event.preventDefault()
    input.value += event.key.toUpperCase()
    if (exactMatches.value.length > 0) {
      emit('activate', exactMatches.value[0])
      resetInput()
      return
    }
    if (!hasPrefixMatches.value) {
      resetInput()
    }
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
watch(
  () => props.open,
  (open) => {
    if (!open) resetInput()
  },
)
</script>

<template>
  <div v-if="open" class="ml-ribbon-keytips" aria-live="polite">
    <div class="ml-ribbon-keytips__hint">{{ hintText }}</div>
    <span v-for="tip in matched" :key="tip.id" class="ml-ribbon-keytip">{{ tip.key }}</span>
  </div>
</template>


