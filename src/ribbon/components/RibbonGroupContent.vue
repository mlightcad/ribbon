<script setup lang="ts">
import type { RibbonGroupModel } from '../types'
import MlRibbonCollection from './RibbonCollection.vue'
import MlRibbonItemHost from './RibbonItemHost.vue'

/**
 * @component MlRibbonGroupContent
 * @description
 * Internal renderer that expands a `RibbonGroupModel` into collections and concrete
 * interactive items.
 *
 * @prop group - Group model with collections and items to render.
 * @prop galleryPreviewFallback - Fallback text for gallery item previews.
 *
 * @event item-click - Emitted when any nested item is activated.
 * Payload includes `{ groupId, itemId }`.
 *
 * @example
 * ```vue
 * <MlRibbonGroupContent
 *   :group="groupModel"
 *   gallery-preview-fallback="Preview"
 *   @item-click="onGroupItemClick"
 * />
 * ```
 */
const props = withDefaults(
  defineProps<{
    group: RibbonGroupModel
    galleryPreviewFallback?: string
  }>(),
  {},
)

const emit = defineEmits<{ (e: 'item-click', payload: { groupId: string; itemId: string }): void }>()
</script>

<template>
  <div
    class="ml-ribbon-group__content"
    :class="[`ml-ribbon-group__content--${props.group.orientation ?? 'column'}`]"
  >
    <MlRibbonCollection
      v-for="collection in props.group.collections ?? []"
      :id="collection.id"
      :key="collection.id"
      :layout="collection.layout ?? (props.group.orientation === 'row' ? 'row' : 'column')"
      :rows="collection.rows"
    >
      <MlRibbonItemHost
        v-for="item in collection.items"
        :id="item.id"
        :key="item.id"
        :item="item"
        :group-id="props.group.id"
        :gallery-preview-fallback="props.galleryPreviewFallback"
        @item-click="emit('item-click', { groupId: props.group.id, itemId: $event })"
      />
    </MlRibbonCollection>
  </div>
</template>
