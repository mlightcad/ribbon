<script setup lang="ts">
import { ref } from 'vue'
import { ElButton, ElButtonGroup, ElIcon } from 'element-plus'
import type { Component } from 'vue'

/**
 * @component MlRibbonGroupButton
 * @description
 * Segmented button control for ribbon items. Supports single-select and
 * multi-select modes and emits selected values.
 *
 * @prop id - Component identifier.
 * @prop label - Caption shown above segmented buttons.
 * @prop options - Selectable options with optional icons.
 * @prop multiple - Enables multi-select behavior.
 * @prop disabled - Disables interaction.
 *
 * @event change - Emitted with `string` in single mode or `string[]` in multiple mode.
 *
 * @example
 * ```vue
 * <MlRibbonGroupButton
 *   id="find-replace"
 *   label="Find / Replace"
 *   :options="[
 *     { label: 'Find', value: 'find' },
 *     { label: 'Replace', value: 'replace' }
 *   ]"
 *   @change="onModeChange"
 * />
 * ```
 */
const props = withDefaults(
  defineProps<{
    id: string
    label: string
    options: { label: string; value: string; icon?: Component }[]
    multiple?: boolean
    disabled?: boolean
  }>(),
  { multiple: false, disabled: false },
)

const emit = defineEmits<{ (e: 'change', value: string | string[]): void }>()
const selected = ref<string[]>([])

/**
 * Toggles option selection state and emits normalized payload by selection mode.
 * @param value Option value to toggle.
 */
function toggle(value: string) {
  if (props.disabled) return
  if (props.multiple) {
    if (selected.value.includes(value)) {
      selected.value = selected.value.filter((x) => x !== value)
    } else {
      selected.value = [...selected.value, value]
    }
    emit('change', selected.value)
    return
  }
  selected.value = [value]
  emit('change', value)
}
</script>

<template>
  <div class="ml-ribbon-group-button" :data-id="id">
    <div class="ml-ribbon-group-button__label">{{ label }}</div>
    <ElButtonGroup>
      <ElButton
        v-for="option in options"
        :key="option.value"
        :disabled="disabled"
        :type="selected.includes(option.value) ? 'primary' : 'default'"
        @click="toggle(option.value)"
      >
        <ElIcon v-if="option.icon" class="ml-ribbon-item-host__icon"><component :is="option.icon" /></ElIcon>
        {{ option.label }}
      </ElButton>
    </ElButtonGroup>
  </div>
</template>


