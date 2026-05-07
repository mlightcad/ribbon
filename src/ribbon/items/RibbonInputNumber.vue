<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElIcon, ElInputNumber } from 'element-plus'
import type { Component } from 'vue'

defineOptions({
  name: 'MlRibbonInputNumber',
})

/**
 * @component MlRibbonInputNumber
 * @description
 * Ribbon-styled numeric input built on Element Plus `ElInputNumber`.
 * It supports an optional compact prefix label and icon while preserving
 * native input-number props through `controlProps`.
 *
 * @prop id - Stable item identifier.
 * @prop modelValue - Controlled numeric value.
 * @prop width - CSS width for the input area. Supports number, CSS string, and `full`.
 * @prop prefixLabel - Optional text shown before the numeric input.
 * @prop prefixIcon - Optional Vue icon component shown before the numeric input.
 * @prop prefixIconClass - Optional CSS icon class shown before the numeric input.
 * @prop controlProps - Element Plus Input Number props forwarded to `ElInputNumber`.
 * @prop disabled - Disables interaction.
 *
 * @event change - Emitted with the changed numeric value.
 */
const props = withDefaults(
  defineProps<{
    id: string
    modelValue?: number
    width?: number | string
    prefixLabel?: string
    prefixIcon?: Component | string
    prefixIconClass?: string
    controlProps?: Record<string, unknown>
    disabled?: boolean
  }>(),
  {
    modelValue: undefined,
    width: '96px',
    prefixLabel: undefined,
    prefixIcon: undefined,
    prefixIconClass: undefined,
    controlProps: () => ({}),
    disabled: false,
  },
)

const emit = defineEmits<{ (e: 'change', value: number | undefined): void }>()

const inputWidth = computed(() => normalizeCssSize(props.width, '96px'))
const isFullWidth = computed(() => inputWidth.value === '100%')
const rootStyle = computed((): Record<string, string> => (isFullWidth.value ? { width: '100%' } : {}))
const inputStyle = computed((): Record<string, string> => (isFullWidth.value ? {} : { width: inputWidth.value }))
const captionText = computed(() => itemText(props.prefixLabel))
const iconComponent = computed<Component | null>(() => {
  if (!props.prefixIcon || typeof props.prefixIcon === 'string') return null
  return props.prefixIcon
})
const iconClass = computed<string | null>(() => {
  const candidate = props.prefixIconClass ?? (typeof props.prefixIcon === 'string' ? props.prefixIcon : undefined)
  return itemText(candidate) ?? null
})
const hasPrefix = computed(() => Boolean(captionText.value || iconComponent.value || iconClass.value))
const ariaLabel = computed(() => captionText.value ?? props.id)
const lastEmittedValue = ref<number | undefined>(undefined)

function handleChange(value: number | undefined) {
  emitCommittedChange(value)
}

function handleEnterCommit(event: KeyboardEvent) {
  event.preventDefault()
  event.stopPropagation()
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  const value = parseInputValue(target.value)
  if (value === undefined && target.value.trim().length > 0) return
  emitCommittedChange(value)
}

function emitCommittedChange(value: number | undefined) {
  if (Object.is(lastEmittedValue.value, value)) return
  lastEmittedValue.value = value
  emit('change', value)
}

function parseInputValue(value: string): number | undefined {
  const normalized = value.trim()
  if (!normalized) return undefined
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

function itemText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeCssSize(value: unknown, fallback: string): string {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return `${value}px`
  if (typeof value === 'string') {
    const normalized = value.trim()
    if (!normalized) return fallback
    if (normalized.toLowerCase() === 'full') return '100%'
    return normalized
  }
  return fallback
}
</script>

<template>
  <div
    class="ml-ribbon-input-number"
    :class="{ 'has-prefix': hasPrefix, 'is-full': isFullWidth }"
    :style="rootStyle"
    :data-id="id"
    @keydown.enter.stop.prevent="handleEnterCommit"
  >
    <span v-if="hasPrefix" class="ml-ribbon-input-number__prefix">
      <ElIcon v-if="iconComponent" class="ml-ribbon-input-number__prefix-icon" aria-hidden="true">
        <component :is="iconComponent" />
      </ElIcon>
      <i
        v-else-if="iconClass"
        class="ml-ribbon-input-number__prefix-icon ml-ribbon-input-number__prefix-icon--class"
        :class="iconClass"
        aria-hidden="true"
      />
      <span v-if="captionText" class="ml-ribbon-input-number__prefix-label">{{ captionText }}</span>
    </span>
    <ElInputNumber
      v-bind="controlProps"
      :model-value="modelValue"
      :disabled="disabled"
      :style="inputStyle"
      :aria-label="ariaLabel"
      @change="handleChange"
    />
  </div>
</template>
