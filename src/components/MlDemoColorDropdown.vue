<script setup lang="ts">
import MlDemoCadDropdown from './MlDemoCadDropdown.vue'
import { MlDemoCadColorIcon } from './demoCadIcons'
import type { RibbonCustomItemBindings } from '../ribbon'
import type { MlDemoCadDropdownOption } from './demoCadDropdown'

const fallbackOptions: MlDemoCadDropdownOption[] = [
  { value: 'bylayer', label: 'ByLayer', swatch: '#7b8794', command: 'entity-color-bylayer' },
  { value: 'red', label: 'Red', swatch: '#d64541', command: 'entity-color-red' },
  { value: 'yellow', label: 'Yellow', swatch: '#f2c94c', command: 'entity-color-yellow' },
  { value: 'green', label: 'Green', swatch: '#27ae60', command: 'entity-color-green' },
  { value: 'cyan', label: 'Cyan', swatch: '#00acc1', command: 'entity-color-cyan' },
  { value: 'blue', label: 'Blue', swatch: '#2f80ed', command: 'entity-color-blue' },
  { value: 'magenta', label: 'Magenta', swatch: '#bb6bd9', command: 'entity-color-magenta' },
]

defineProps<
  RibbonCustomItemBindings & {
    title?: string
    modelValue?: string
    options?: MlDemoCadDropdownOption[]
  }
>()
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
