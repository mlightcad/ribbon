<script setup lang="ts">
import MlDemoCadDropdown from './MlDemoCadDropdown.vue'
import { MlDemoCadLineTypeIcon } from './demoCadIcons'
import type { RibbonCustomItemBindings } from '../ribbon'
import type { MlDemoCadDropdownOption } from './demoCadDropdown'

const fallbackOptions: MlDemoCadDropdownOption[] = [
  { value: 'bylayer', label: 'ByLayer', pattern: 'solid', command: 'entity-line-type-bylayer' },
  { value: 'continuous', label: 'Continuous', pattern: 'solid', command: 'entity-line-type-continuous' },
  { value: 'dashed', label: 'Dashed', pattern: 'dashed', command: 'entity-line-type-dashed' },
  { value: 'hidden', label: 'Hidden', pattern: 'hidden', command: 'entity-line-type-hidden' },
  { value: 'center', label: 'Center', pattern: 'center', command: 'entity-line-type-center' },
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
    :title="title ?? 'Line Type'"
    :model-value="modelValue ?? 'continuous'"
    :options="options ?? fallbackOptions"
    :leading-icon="MlDemoCadLineTypeIcon"
    variant="line-type"
  />
</template>
