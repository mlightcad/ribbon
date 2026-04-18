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
    disabled?: boolean
  }>(),
  { disabled: false },
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
</script>

<template>
  <div class="ml-ribbon-button-group" :data-id="id">
    <div class="ml-ribbon-button-group__label">{{ label }}</div>
    <ElButtonGroup>
      <ElButton
        v-for="option in options"
        :key="option.value"
        :disabled="disabled"
        type="default"
        @click="trigger(option.value)"
      >
        <ElIcon v-if="option.icon" class="ml-ribbon-item-host__icon"><component :is="option.icon" /></ElIcon>
        {{ option.label }}
      </ElButton>
    </ElButtonGroup>
  </div>
</template>
