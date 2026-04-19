<script setup lang="ts">
import MlDemoCadDropdown from './MlDemoCadDropdown.vue'
import { MlDemoCadLineWeightIcon } from './demoCadIcons'
import type { RibbonCustomItemBindings } from '../ribbon'
import type { MlDemoCadDropdownOption } from './demoCadDropdown'

const fallbackOptions: MlDemoCadDropdownOption[] = [
  { value: 'default', label: 'Default', weight: 2, command: 'entity-line-weight-default' },
  { value: '0.13', label: '0.13 mm', weight: 1, command: 'entity-line-weight-0.13' },
  { value: '0.25', label: '0.25 mm', weight: 2, command: 'entity-line-weight-0.25' },
  { value: '0.35', label: '0.35 mm', weight: 3, command: 'entity-line-weight-0.35' },
  { value: '0.50', label: '0.50 mm', weight: 4, command: 'entity-line-weight-0.50' },
  { value: '0.70', label: '0.70 mm', weight: 5, command: 'entity-line-weight-0.70' },
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
    :title="title ?? 'Line Weight'"
    :model-value="modelValue ?? '0.25'"
    :options="options ?? fallbackOptions"
    :leading-icon="MlDemoCadLineWeightIcon"
    variant="line-weight"
  />
</template>
