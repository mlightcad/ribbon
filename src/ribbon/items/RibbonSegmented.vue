<script setup lang="ts">
import { computed } from 'vue'
import { ElIcon, ElSegmented } from 'element-plus'
import type { Component } from 'vue'

type RibbonSegmentedValue = string | number | boolean

interface RibbonSegmentedOption {
  label?: string
  value: RibbonSegmentedValue
  disabled?: boolean
  icon?: Component | null
  iconClass?: string | null
}

/**
 * @component MlRibbonSegmented
 * @description
 * Controlled segmented selector for ribbon items. It reuses Element Plus
 * `ElSegmented` and renders options icon-first, falling back to visible text
 * only when an option has no icon.
 *
 * @prop id - Component identifier.
 * @prop label - Optional caption shown above the segmented control.
 * @prop options - Selectable options with optional icon metadata.
 * @prop modelValue - Controlled selected option value.
 * @prop direction - Layout direction passed through to `ElSegmented`.
 * @prop block - Whether the segmented control should fill the parent width.
 * @prop disabled - Disables interaction.
 * @prop hideLabel - Hides the segmented caption above the control.
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
 *     { label: 'Light', value: 'light', icon: Sunny },
 *     { label: 'Dark', value: 'dark', icon: Moon },
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
  }>(),
  {
    label: '',
    modelValue: undefined,
    direction: 'horizontal',
    block: false,
    disabled: false,
    hideLabel: false,
  },
)

const emit = defineEmits<{ (e: 'change', value: RibbonSegmentedValue): void }>()

const captionText = computed(() => props.label?.trim() ?? '')
const showCaption = computed(() => !props.hideLabel && captionText.value.length > 0)

function toOption(option: unknown): RibbonSegmentedOption {
  return option as RibbonSegmentedOption
}

function optionLabel(option: unknown): string {
  const normalized = toOption(option)
  return normalized.label?.trim() || String(normalized.value)
}

function optionIcon(option: unknown): Component | null {
  return toOption(option).icon ?? null
}

function optionIconClass(option: unknown): string | null {
  return toOption(option).iconClass ?? null
}

function showOptionLabel(option: unknown): boolean {
  return !optionIcon(option) && !optionIconClass(option)
}

function optionKey(option: unknown): string {
  return String(toOption(option).value)
}

function handleChange(value: RibbonSegmentedValue) {
  emit('change', value)
}
</script>

<template>
  <div class="ml-ribbon-segmented" :data-id="id">
    <div v-if="showCaption" class="ml-ribbon-segmented__label">{{ captionText }}</div>
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
        <span class="ml-ribbon-segmented__option" :data-option-value="optionKey(item)">
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
          <span
            v-else
            class="ml-ribbon-segmented__option-sr-label"
          >
            {{ optionLabel(item) }}
          </span>
        </span>
      </template>
    </ElSegmented>
  </div>
</template>
