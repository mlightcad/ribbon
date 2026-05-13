<script setup lang="ts">
import { computed } from 'vue'
import { ElIcon, ElSegmented, ElTooltip } from 'element-plus'
import type { Component } from 'vue'
import type { RibbonSegmentedOption } from '../types'

type RibbonSegmentedValue = string | number | boolean

/**
 * @component MlRibbonSegmented
 * @description
 * Controlled segmented selector for ribbon items. It reuses Element Plus
 * `ElSegmented` and renders options icon-first, falling back to visible text
 * only when an option has no icon. Each segment can have its own tooltip
 * (`option.tooltip`), with the same fallback chain as ribbon button groups.
 *
 * @prop id - Component identifier.
 * @prop label - Optional caption shown above the segmented control.
 * @prop options - Selectable options with optional icon metadata and per-segment tooltips.
 * @prop modelValue - Controlled selected option value.
 * @prop direction - Layout direction passed through to `ElSegmented`.
 * @prop block - Whether the segmented control should fill the parent width.
 * @prop disabled - Disables interaction.
 * @prop hideLabel - Hides the segmented caption above the control.
 * @prop tooltipShowAfter - Delay before showing segment tooltips (ms).
 * @prop tooltipHideAfter - Delay before hiding segment tooltips (ms).
 *
 * @event change - Emitted with the selected option value.
 *
 * @example
 * ```vue
 * <MlRibbonSegmented
 *   id="theme"
 *   label="Theme"
 *   :model-value="theme"
 *   :options="[
 *     { label: 'Light', value: 'light', icon: Sunny, tooltip: 'Use light theme' },
 *     { label: 'Dark', value: 'dark', icon: Moon, tooltip: 'Use dark theme' },
 *   ]"
 *   @change="setTheme"
 * />
 * ```
 */
const props = withDefaults(
  defineProps<{
    id: string
    label?: string
    options: RibbonSegmentedOption[]
    modelValue?: RibbonSegmentedValue
    direction?: 'vertical' | 'horizontal'
    block?: boolean
    disabled?: boolean
    hideLabel?: boolean
    tooltipShowAfter?: number
    tooltipHideAfter?: number
  }>(),
  {
    label: '',
    modelValue: undefined,
    direction: 'horizontal',
    block: false,
    disabled: false,
    hideLabel: false,
    tooltipShowAfter: 1000,
    tooltipHideAfter: 0,
  },
)

const emit = defineEmits<{ (e: 'change', value: RibbonSegmentedValue): void }>()

const captionText = computed(() => props.label?.trim() ?? '')
const showCaption = computed(
  () => !props.hideLabel && captionText.value.length > 0,
)

function toOption(option: unknown): RibbonSegmentedOption {
  return option as RibbonSegmentedOption
}

function optionText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

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

function optionLabel(option: unknown): string {
  const normalized = toOption(option)
  return normalized.label?.trim() || String(normalized.value)
}

function resolveOptionTooltip(option: unknown): string | undefined {
  const normalized = toOption(option)
  return (
    optionText(normalized.tooltip) ??
    optionText(normalized.label) ??
    humanizeOptionValue(normalized.value)
  )
}

function optionIcon(option: unknown): Component | null {
  const raw = toOption(option).icon
  if (raw && typeof raw !== 'string') return raw as Component
  return null
}

function optionIconClass(option: unknown): string | null {
  const raw = toOption(option).iconClass
  if (typeof raw === 'string' && raw.trim()) return raw
  const icon = toOption(option).icon
  if (typeof icon === 'string' && icon.trim()) return icon.trim()
  return null
}

function showOptionLabel(option: unknown): boolean {
  return !optionIcon(option) && !optionIconClass(option)
}

function optionKey(option: unknown): string {
  return String(toOption(option).value)
}

function segmentAriaLabel(option: unknown): string {
  return resolveOptionTooltip(option) ?? optionKey(option)
}

function handleChange(value: RibbonSegmentedValue) {
  emit('change', value)
}
</script>

<template>
  <div class="ml-ribbon-segmented" :data-id="id">
    <div v-if="showCaption" class="ml-ribbon-segmented__label">
      {{ captionText }}
    </div>
    <ElSegmented
      class="ml-ribbon-segmented__control"
      :options="options"
      :model-value="modelValue"
      :direction="direction"
      :block="block"
      :disabled="disabled"
      :aria-label="captionText || id"
      @change="handleChange"
    >
      <template #default="{ item }">
        <ElTooltip
          :content="resolveOptionTooltip(item)"
          :disabled="!resolveOptionTooltip(item)"
          :show-after="tooltipShowAfter"
          :hide-after="tooltipHideAfter"
          placement="top"
          effect="dark"
        >
          <span
            class="ml-ribbon-segmented__option"
            :data-option-value="optionKey(item)"
            :aria-label="segmentAriaLabel(item)"
          >
            <ElIcon
              v-if="optionIcon(item)"
              class="ml-ribbon-segmented__option-icon"
              aria-hidden="true"
            >
              <component :is="optionIcon(item)" />
            </ElIcon>
            <i
              v-else-if="optionIconClass(item)"
              class="ml-ribbon-segmented__option-icon ml-ribbon-item-host__icon--class"
              :class="optionIconClass(item)"
              aria-hidden="true"
            />
            <span
              v-if="showOptionLabel(item)"
              class="ml-ribbon-segmented__option-label"
            >
              {{ optionLabel(item) }}
            </span>
            <span v-else class="ml-ribbon-segmented__option-sr-label">
              {{ optionLabel(item) }}
            </span>
          </span>
        </ElTooltip>
      </template>
    </ElSegmented>
  </div>
</template>
