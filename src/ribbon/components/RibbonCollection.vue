<script setup lang="ts">
import { computed } from 'vue'
import type { RibbonCollectionLayout } from '../types'

/**
 * @component MlRibbonCollection
 * @description
 * Layout container for a group-level item collection. It controls row/column flow
 * and exposes a CSS variable for row-based packing.
 *
 * @prop id - Unique collection identifier.
 * @prop layout - Collection flow direction (`row` or `column`).
 * @prop rows - Desired row count when the collection is rendered in grid-like modes.
 *
 * @slot default - Collection items, typically `MlRibbonItemHost` components.
 *
 * @example
 * ```vue
 * <MlRibbonCollection id="clipboard-right" layout="column" :rows="3">
 *   <MlRibbonItemHost ... />
 * </MlRibbonCollection>
 * ```
 */
const props = withDefaults(
  defineProps<{
    id: string
    layout?: RibbonCollectionLayout
    rows?: number
  }>(),
  {
    layout: 'row',
    rows: 3,
  },
)

const collectionStyle = computed(() => ({
  '--ml-ribbon-collection-rows': String(props.rows),
}))
</script>

<template>
  <div
    class="ml-ribbon-collection"
    :class="[`ml-ribbon-collection--${props.layout}`]"
    :style="collectionStyle"
  >
    <slot />
  </div>
</template>


