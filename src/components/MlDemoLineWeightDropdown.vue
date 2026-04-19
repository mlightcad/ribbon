<script setup lang="ts">
import MlDemoCadDropdown from './MlDemoCadDropdown.vue'
import { MlDemoCadLineWeightIcon } from './demoCadIcons'
import type { RibbonCustomItemBindings } from '../ribbon'
import type { MlDemoCadDropdownOption } from './demoCadDropdown'

defineOptions({
  name: 'MlDemoLineWeightDropdown',
})

/**
 * Props accepted by {@link MlDemoLineWeightDropdown}.
 *
 * This wrapper configures the shared CAD dropdown for line-weight previews and
 * provides convenient override points for consumers that need custom values.
 */
interface MlDemoLineWeightDropdownProps extends RibbonCustomItemBindings {
  /**
   * Optional title exposed to assistive technologies and documentation tooling.
   */
  title?: string

  /**
   * Currently selected line-weight value.
   */
  modelValue?: string

  /**
   * Optional line-weight options. Uses a default engineering-style scale when omitted.
   */
  options?: MlDemoCadDropdownOption[]
}

/**
 * Default line-weight presets shown when the host ribbon item does not provide its own list.
 */
const fallbackOptions: MlDemoCadDropdownOption[] = [
  { value: 'default', label: 'Default', weight: 2, command: 'entity-line-weight-default' },
  { value: '0.13', label: '0.13 mm', weight: 1, command: 'entity-line-weight-0.13' },
  { value: '0.25', label: '0.25 mm', weight: 2, command: 'entity-line-weight-0.25' },
  { value: '0.35', label: '0.35 mm', weight: 3, command: 'entity-line-weight-0.35' },
  { value: '0.50', label: '0.50 mm', weight: 4, command: 'entity-line-weight-0.50' },
  { value: '0.70', label: '0.70 mm', weight: 5, command: 'entity-line-weight-0.70' },
]

defineProps<MlDemoLineWeightDropdownProps>()
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
