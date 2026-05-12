<script setup lang="ts">
import { ElButtonGroup, ElTooltip } from 'element-plus'
import type { Component } from 'vue'
import MlRibbonButton from './RibbonButton.vue'

/**
 * @component MlRibbonButtonGroup
 * @description
 * Grouped command button control for ribbon items. Each button behaves like an
 * independent command and does not keep a persistent selected visual state.
 *
 * @prop id - Component identifier.
 * @prop label - Caption shown above grouped buttons.
 * @prop options - Selectable options with optional icons and per-button tooltips.
 * @prop equalWidth - Forces equal button widths when `wrap` is disabled.
 * @prop disabled - Disables interaction.
 *
 * @event change - Emitted with the clicked option value.
 *
 * @example
 * ```vue
 * <MlRibbonButtonGroup
 *   id="find-replace"
 *   label="Find / Replace"
 *   :options="[
 *     { label: 'Find', value: 'find' },
 *     { label: 'Replace', value: 'replace' }
 *   ]"
 *   @change="onCommand"
 * />
 * ```
 */
const props = withDefaults(
  defineProps<{
    id: string
    label: string
    options: {
      label?: string
      value: string | number | boolean
      icon?: string | Component
      tooltip?: string
    }[]
    hideLabel?: boolean
    wrap?: boolean
    equalWidth?: boolean
    buttonSize?: 'large' | 'default' | 'small'
    iconSize?: string
    tooltipShowAfter?: number
    tooltipHideAfter?: number
    disabled?: boolean
  }>(),
  {
    hideLabel: false,
    wrap: true,
    equalWidth: false,
    tooltipShowAfter: 1000,
    tooltipHideAfter: 0,
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'change', value: string | number | boolean): void
}>()

/**
 * Emits the clicked option value without persisting a selected state.
 * @param value Option value to emit.
 */
function trigger(value: string | number | boolean) {
  if (props.disabled) return
  emit('change', value)
}

/**
 * Returns whether an option label contains visible text.
 * @param value Option label string.
 */
function hasTextLabel(value?: string) {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Normalizes schema text values so blank strings do not render as tooltips.
 * @param value Candidate tooltip/label text.
 */
function optionText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/**
 * Converts option values like `layer-off` into readable fallback tooltip text.
 * @param value Option value.
 */
function humanizeOptionValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const normalized = value
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .trim()
    if (!normalized) return undefined
    return normalized.replace(/\b\w/g, (char) => char.toUpperCase())
  }
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  return undefined
}

/**
 * Resolves per-button tooltip text with label/value fallbacks.
 * @param option Group button option.
 */
function resolveOptionTooltip(option: {
  label?: string
  value: string | number | boolean
  tooltip?: string
}): string | undefined {
  return (
    optionText(option.tooltip) ??
    optionText(option.label) ??
    humanizeOptionValue(option.value)
  )
}
</script>

<template>
  <div
    class="ml-ribbon-button-group"
    :class="{
      'ml-ribbon-button-group--nowrap': !wrap,
      'ml-ribbon-button-group--equal-width': !wrap && equalWidth,
    }"
    :data-id="id"
  >
    <div v-if="!hideLabel && label" class="ml-ribbon-button-group__label">
      {{ label }}
    </div>
    <ElButtonGroup>
      <ElTooltip
        v-for="option in options"
        :key="String(option.value)"
        :content="resolveOptionTooltip(option)"
        :disabled="!resolveOptionTooltip(option)"
        :show-after="tooltipShowAfter"
        :hide-after="tooltipHideAfter"
        placement="top"
        effect="dark"
      >
        <MlRibbonButton
          :id="String(option.value)"
          class="ml-ribbon-button-group__button"
          :label="option.label"
          :icon="option.icon"
          :icon-size="iconSize"
          :size="buttonSize"
          :disabled="disabled"
          :hide-label="!hasTextLabel(option.label)"
          :aria-label="resolveOptionTooltip(option) ?? String(option.value)"
          @click="trigger(option.value)"
        >
          <template v-if="hasTextLabel(option.label)" #label>
            <span class="ml-ribbon-button-group__text">{{ option.label }}</span>
          </template>
        </MlRibbonButton>
      </ElTooltip>
    </ElButtonGroup>
  </div>
</template>
