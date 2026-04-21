<script setup lang="ts">
import { ElButton, ElButtonGroup, ElIcon } from 'element-plus'
import type { Component } from 'vue'

/**
 * @component MlRibbonButtonGroup
 * @description
 * Grouped command button control for ribbon items. Each button behaves like an
 * independent command and does not keep a persistent selected visual state.
 *
 * @prop id - Component identifier.
 * @prop label - Caption shown above grouped buttons.
 * @prop options - Selectable options with optional icons.
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
    options: { label: string; value: string; icon?: Component }[]
    hideLabel?: boolean
    wrap?: boolean
    equalWidth?: boolean
    buttonSize?: 'large' | 'default' | 'small'
    disabled?: boolean
  }>(),
  {
    hideLabel: false,
    wrap: true,
    equalWidth: false,
    disabled: false,
  },
)

const emit = defineEmits<{ (e: 'change', value: string): void }>()

/**
 * Emits the clicked option value without persisting a selected state.
 * @param value Option value to emit.
 */
function trigger(value: string) {
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
    <div v-if="!hideLabel && label" class="ml-ribbon-button-group__label">{{ label }}</div>
    <ElButtonGroup>
      <ElButton
        v-for="option in options"
        :key="option.value"
        :size="buttonSize"
        :disabled="disabled"
        type="default"
        @click="trigger(option.value)"
      >
        <ElIcon
          v-if="option.icon"
          class="ml-ribbon-item-host__icon"
          :class="hasTextLabel(option.label) ? 'ml-ribbon-item-host__icon--with-label' : 'ml-ribbon-item-host__icon--icon-only'"
        >
          <component :is="option.icon" />
        </ElIcon>
        <span v-if="hasTextLabel(option.label)" class="ml-ribbon-button-group__text">{{ option.label }}</span>
      </ElButton>
    </ElButtonGroup>
  </div>
</template>
