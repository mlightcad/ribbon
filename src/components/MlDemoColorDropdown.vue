<script setup lang="ts">
import MlDemoCadDropdown from './MlDemoCadDropdown.vue'
import { MlDemoCadColorIcon } from './demoCadIcons'
import type { RibbonCustomItemBindings } from '../ribbon'
import type { MlDemoCadDropdownOption } from './demoCadDropdown'

defineOptions({
  name: 'MlDemoColorDropdown',
})

/**
 * Props accepted by {@link MlDemoColorDropdown}.
 *
 * This thin wrapper preconfigures {@link MlDemoCadDropdown} for color selection
 * while still allowing the host ribbon item to override the title, value, and
 * available option list.
 */
interface MlDemoColorDropdownProps extends RibbonCustomItemBindings {
  /**
   * Optional title shown to assistive technologies and external integrations.
   */
  title?: string

  /**
   * Currently selected color option value.
   */
  modelValue?: string

  /**
   * Optional color option list. When omitted, a default CAD-like palette is used.
   */
  options?: MlDemoCadDropdownOption[]
}

/**
 * Default color palette shown when the embedding ribbon item does not provide options.
 */
const fallbackOptions: MlDemoCadDropdownOption[] = [
  { value: 'bylayer', label: 'ByLayer', swatch: '#7b8794', command: 'entity-color-bylayer' },
  { value: 'red', label: 'Red', swatch: '#d64541', command: 'entity-color-red' },
  { value: 'yellow', label: 'Yellow', swatch: '#f2c94c', command: 'entity-color-yellow' },
  { value: 'green', label: 'Green', swatch: '#27ae60', command: 'entity-color-green' },
  { value: 'cyan', label: 'Cyan', swatch: '#00acc1', command: 'entity-color-cyan' },
  { value: 'blue', label: 'Blue', swatch: '#2f80ed', command: 'entity-color-blue' },
  { value: 'magenta', label: 'Magenta', swatch: '#bb6bd9', command: 'entity-color-magenta' },
]

defineProps<MlDemoColorDropdownProps>()
</script>

<template>
  <MlDemoCadDropdown
    :item="item"
    :group-id="groupId"
    :disabled="disabled"
    :emit-item-click="emitItemClick"
    :title="title ?? 'Color'"
    :model-value="modelValue ?? 'bylayer'"
    :options="options ?? fallbackOptions"
    :leading-icon="MlDemoCadColorIcon"
    variant="color"
  />
</template>
