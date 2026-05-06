<script setup lang="ts">
import { computed, ref } from 'vue'

type RibbonGalleryCategory = { id: string; title: string; items: { id: string; label: string; preview?: string }[] }

/**
 * @component MlRibbonGallery
 * @description
 * Categorized gallery selector for previewable ribbon commands.
 *
 * @prop id - Gallery identifier.
 * @prop label - Optional gallery title.
 * @prop categories - Gallery categories and their selectable items.
 * @prop disabled - Disables selection.
 * @prop previewFallback - Fallback preview text when an item has no preview.
 *
 * @event select - Emitted with selected gallery item id.
 *
 * @example
 * ```vue
 * <MlRibbonGallery
 *   id="styles"
 *   label="Styles"
 *   :categories="styleCategories"
 *   preview-fallback="Preview"
 *   @select="onStylePick"
 * />
 * ```
 */
const props = withDefaults(
  defineProps<{
    id: string
    label: string
    categories: RibbonGalleryCategory[]
    disabled?: boolean
    previewFallback?: string
  }>(),
  { disabled: false },
)

const emit = defineEmits<{ (e: 'select', id: string): void }>()
const selected = ref<string>('')
const visibleCategoryCount = computed(() => props.categories.filter((category) => category.items.length > 0).length)

/**
 * Avoids repeating the same visible title twice in compact ribbon galleries.
 * @param category Gallery category candidate.
 * @returns Whether the category title should be shown.
 */
function shouldShowCategoryTitle(category: RibbonGalleryCategory) {
  const label = props.label.trim().toLowerCase()
  const title = category.title.trim().toLowerCase()
  return visibleCategoryCount.value > 1 || !label || title !== label
}

/**
 * Selects a gallery item and emits its id.
 * @param id Target gallery item id.
 */
function selectItem(id: string) {
  if (props.disabled) return
  selected.value = id
  emit('select', id)
}
</script>

<template>
  <div class="ml-ribbon-gallery" :class="{ 'is-disabled': disabled }">
    <div v-if="label" class="ml-ribbon-gallery__title">{{ label }}</div>
    <div class="ml-ribbon-gallery__categories">
      <section v-for="category in categories" :key="category.id" class="ml-ribbon-gallery__category">
        <h4 v-if="shouldShowCategoryTitle(category)" class="ml-ribbon-gallery__category-title">
          {{ category.title }}
        </h4>
        <div class="ml-ribbon-gallery__grid">
          <button
            v-for="item in category.items"
            :key="item.id"
            type="button"
            class="ml-ribbon-gallery__item"
            :class="{ 'is-selected': selected === item.id }"
            :disabled="disabled"
            @click="selectItem(item.id)"
          >
            <div class="ml-ribbon-gallery__preview">{{ item.preview ?? props.previewFallback }}</div>
            <div class="ml-ribbon-gallery__label">{{ item.label }}</div>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

