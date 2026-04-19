<script setup lang="ts">
import MlDemoCadDropdown from './MlDemoCadDropdown.vue'
import { MlDemoCadLineTypeIcon } from './demoCadIcons'
import type { RibbonCustomItemBindings } from '../ribbon'
import type { MlDemoCadDropdownOption } from './demoCadDropdown'

defineOptions({
  name: 'MlDemoLineTypeDropdown',
})

/**
 * Props accepted by {@link MlDemoLineTypeDropdown}.
 *
 * This wrapper configures the shared CAD dropdown for line-type previews while
 * exposing overrides for the displayed title, selected value, and option set.
 */
interface MlDemoLineTypeDropdownProps extends RibbonCustomItemBindings {
  /**
   * Optional title used for accessibility and external documentation.
   */
  title?: string

  /**
   * Currently selected line-type value.
   */
  modelValue?: string

  /**
   * Optional line-type options. Falls back to a built-in CAD-oriented preset list.
   */
  options?: MlDemoCadDropdownOption[]
}

/**
 * Default line-type choices shown when no custom options are supplied.
 */
const fallbackOptions: MlDemoCadDropdownOption[] = [
  { value: 'bylayer', label: 'ByLayer', pattern: 'solid', command: 'entity-line-type-bylayer' },
  { value: 'continuous', label: 'Continuous', pattern: 'solid', command: 'entity-line-type-continuous' },
  { value: 'dashed', label: 'Dashed', pattern: 'dashed', command: 'entity-line-type-dashed' },
  { value: 'hidden', label: 'Hidden', pattern: 'hidden', command: 'entity-line-type-hidden' },
  { value: 'center', label: 'Center', pattern: 'center', command: 'entity-line-type-center' },
]

defineProps<MlDemoLineTypeDropdownProps>()
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
