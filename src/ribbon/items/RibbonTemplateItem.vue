<script setup lang="ts">
import type { RibbonItemModel } from '../types'

/**
 * @component MlRibbonTemplateItem
 * @description
 * Wrapper for fully custom ribbon item rendering while preserving ribbon layout
 * and item metadata context.
 *
 * @prop id - Template item identifier.
 * @prop item - Original ribbon item model passed to slot consumers.
 *
 * @slot default - Custom template content with `{ item }` slot prop.
 *
 * @example
 * ```vue
 * <MlRibbonTemplateItem :id="item.id" :item="item">
 *   <template #default="{ item }">
 *     <MyCustomCommand :label="item.label" />
 *   </template>
 * </MlRibbonTemplateItem>
 * ```
 */
defineProps<{
  id: string
  item: RibbonItemModel
}>()
</script>

<template>
  <div class="ml-ribbon-template-item" :data-template-id="id">
    <slot :item="item">
      <span>{{ item.label ?? item.id }}</span>
    </slot>
  </div>
</template>


