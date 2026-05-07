<script setup lang="ts">
import { computed, markRaw, ref, toRaw, watch } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { ElIcon, ElPopover } from 'element-plus'
import type { Component } from 'vue'
import type { RibbonGalleryCategoryModel, RibbonGalleryItemModel } from '../types'

defineOptions({
  name: 'MlRibbonGallery',
})

/**
 * @component MlRibbonGallery
 * @description
 * Categorized gallery selector for previewable ribbon commands.
 *
 * @prop id - Gallery identifier.
 * @prop label - Optional gallery title.
 * @prop categories - Gallery categories and their selectable items. Items can use
 * text previews, icon/component previews, SVG references, or a custom component.
 * @prop disabled - Disables selection.
 * @prop modelValue - Selected item id used for controlled gallery display.
 * @prop collapsed - Renders the selected item as a large preview button.
 * @prop inlineItemLimit - Maximum number of items shown inline before the rest moves to the panel.
 * @prop previewFallback - Fallback preview text when an item has no preview.
 *
 * @event select - Emitted with selected gallery item id.
 *
 * @slot item - Custom per-item renderer. Slot props:
 * `{ item, category, selected, disabled, select }`.
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
    categories: RibbonGalleryCategoryModel[]
    disabled?: boolean
    modelValue?: string
    collapsed?: boolean
    inlineItemLimit?: number
    previewFallback?: string
  }>(),
  { disabled: false, collapsed: false, inlineItemLimit: 4 },
)

const emit = defineEmits<{ (e: 'select', id: string): void }>()
const selected = ref<string>('')
const panelOpen = ref(false)
const visibleCategoryCount = computed(() => props.categories.filter((category) => category.items.length > 0).length)
const galleryItems = computed(() => props.categories.flatMap((category) => category.items))
const collapsedItem = computed(() => galleryItems.value.find((item) => item.id === selected.value) ?? galleryItems.value[0])
const normalizedInlineItemLimit = computed(() => {
  if (!Number.isFinite(props.inlineItemLimit) || props.inlineItemLimit <= 0) return 4
  return Math.floor(props.inlineItemLimit)
})
const visibleInlineIds = computed(() => new Set(galleryItems.value.slice(0, normalizedInlineItemLimit.value).map((item) => item.id)))
const hasInlineOverflow = computed(() => galleryItems.value.length > normalizedInlineItemLimit.value)
const panelPopperClass = computed(() => `ml-ribbon-gallery-panel ml-ribbon-gallery-panel--${props.collapsed ? 'collapsed' : 'inline'}`)

watch(
  () => props.modelValue,
  (value) => {
    if (typeof value === 'string') selected.value = value
  },
  { immediate: true },
)

/**
 * Normalizes potential component definitions to non-reactive objects.
 * @param value Unknown schema value that may contain a component.
 * @returns Normalized value safe for dynamic component rendering.
 */
function normalizeComponentCandidate<T>(value: T): T {
  if (value == null || typeof value === 'string') return value
  if (typeof value === 'object' || typeof value === 'function') {
    return markRaw(toRaw(value as object)) as T
  }
  return value
}

/**
 * Avoids repeating the same visible title twice in compact ribbon galleries.
 * @param category Gallery category candidate.
 * @returns Whether the category title should be shown.
 */
function shouldShowCategoryTitle(category: RibbonGalleryCategoryModel) {
  const label = props.label.trim().toLowerCase()
  const title = category.title.trim().toLowerCase()
  return visibleCategoryCount.value > 1 || !label || title !== label
}

/**
 * Resolves inline category items, leaving overflow items available in the panel.
 * @param category Gallery category candidate.
 * @returns Items visible in the ribbon surface.
 */
function inlineCategoryItems(category: RibbonGalleryCategoryModel) {
  if (!hasInlineOverflow.value) return category.items
  return category.items.filter((item) => visibleInlineIds.value.has(item.id))
}

/**
 * Resolves component-based previews supplied via `preview` or `icon`.
 * @param item Gallery item model.
 * @returns Vue component preview, or `null` when no component preview exists.
 */
function previewComponent(item: RibbonGalleryItemModel): Component | null {
  if (item.preview && typeof item.preview !== 'string') return normalizeComponentCandidate(item.preview)
  if (item.icon && typeof item.icon !== 'string') return normalizeComponentCandidate(item.icon)
  return null
}

/**
 * Resolves a custom component for the whole gallery item body.
 * @param item Gallery item model.
 * @returns Vue component, or `null` when the item uses standard rendering.
 */
function customComponent(item: RibbonGalleryItemModel): Component | null {
  return item.component ? normalizeComponentCandidate(item.component) : null
}

/**
 * Resolves effective disabled state for a gallery item.
 * @param item Gallery item model.
 * @returns Whether the item should be disabled.
 */
function isItemDisabled(item: RibbonGalleryItemModel) {
  return props.disabled || item.disabled === true
}

/**
 * Resolves CSS-class icon previews.
 * @param item Gallery item model.
 * @returns CSS class name, or `null` when no class icon exists.
 */
function previewIconClass(item: RibbonGalleryItemModel): string | null {
  if (typeof item.icon !== 'string') return null
  const normalized = item.icon.trim()
  return normalized.length > 0 ? normalized : null
}

/**
 * Resolves SVG references for preview rendering.
 * @param item Gallery item model.
 * @returns SVG reference, or `null` when the item has no SVG preview.
 */
function previewSvg(item: RibbonGalleryItemModel): string | null {
  const value = item.previewSvg ?? item.svg
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

/**
 * Detects standalone SVG image URLs, which need `<img>` instead of `<use>`.
 * @param value SVG reference candidate.
 * @returns Whether the value should be rendered as an image source.
 */
function isSvgImageSource(value: string) {
  return value.startsWith('data:image/svg+xml') || value.endsWith('.svg')
}

/**
 * Resolves whether an item SVG preview should render as an image.
 * @param item Gallery item model.
 * @returns Whether the SVG reference is an image URL.
 */
function isSvgImagePreview(item: RibbonGalleryItemModel) {
  const value = previewSvg(item)
  return value ? isSvgImageSource(value) : false
}

/**
 * Resolves text fallback previews after richer preview types have been checked.
 * @param item Gallery item model.
 * @returns Preview text.
 */
function previewText(item: RibbonGalleryItemModel) {
  return typeof item.preview === 'string' ? item.preview : props.previewFallback
}

/**
 * Selects a gallery item and emits its id.
 * @param item Target gallery item.
 */
function selectItem(item: RibbonGalleryItemModel) {
  if (isItemDisabled(item)) return
  selected.value = item.id
  panelOpen.value = false
  emit('select', item.id)
}
</script>

<template>
  <div class="ml-ribbon-gallery" :class="{ 'is-disabled': disabled, 'is-collapsed': collapsed }">
    <ElPopover
      v-if="collapsed && collapsedItem"
      v-model:visible="panelOpen"
      trigger="click"
      placement="bottom-start"
      :disabled="disabled"
      :width="320"
      :popper-class="panelPopperClass"
    >
      <template #reference>
        <button
          type="button"
          class="ml-ribbon-gallery__collapsed-button"
          :class="{ 'is-selected': selected === collapsedItem.id, 'is-open': panelOpen }"
          :disabled="isItemDisabled(collapsedItem)"
        >
          <component
            :is="customComponent(collapsedItem)"
            v-if="customComponent(collapsedItem)"
            v-bind="collapsedItem.componentProps"
            :item="collapsedItem"
            :selected="selected === collapsedItem.id"
            :disabled="isItemDisabled(collapsedItem)"
          />
          <template v-else>
            <div
              class="ml-ribbon-gallery__preview ml-ribbon-gallery__collapsed-preview"
              :class="{
                'ml-ribbon-gallery__preview--icon': previewComponent(collapsedItem) || previewIconClass(collapsedItem),
                'ml-ribbon-gallery__preview--svg': previewSvg(collapsedItem),
              }"
            >
              <ElIcon v-if="previewComponent(collapsedItem)" class="ml-ribbon-gallery__preview-icon">
                <component :is="previewComponent(collapsedItem)" />
              </ElIcon>
              <i
                v-else-if="previewIconClass(collapsedItem)"
                class="ml-ribbon-gallery__preview-icon ml-ribbon-gallery__preview-icon--class"
                :class="previewIconClass(collapsedItem)"
                aria-hidden="true"
              />
              <img
                v-else-if="previewSvg(collapsedItem) && isSvgImagePreview(collapsedItem)"
                class="ml-ribbon-gallery__preview-svg"
                :src="previewSvg(collapsedItem) ?? ''"
                alt=""
              />
              <svg
                v-else-if="previewSvg(collapsedItem)"
                class="ml-ribbon-gallery__preview-svg"
                role="presentation"
                aria-hidden="true"
              >
                <use :href="previewSvg(collapsedItem) ?? ''" />
              </svg>
              <template v-else>{{ previewText(collapsedItem) }}</template>
            </div>
            <div class="ml-ribbon-gallery__label ml-ribbon-gallery__collapsed-label">{{ collapsedItem.label }}</div>
          </template>
          <ElIcon class="ml-ribbon-gallery__collapsed-arrow"><ArrowDown /></ElIcon>
        </button>
      </template>
      <div class="ml-ribbon-gallery__panel">
        <section v-for="category in categories" :key="category.id" class="ml-ribbon-gallery__panel-category">
          <h4 v-if="shouldShowCategoryTitle(category)" class="ml-ribbon-gallery__panel-category-title">
            {{ category.title }}
          </h4>
          <div class="ml-ribbon-gallery__panel-grid">
            <button
              v-for="item in category.items"
              :key="item.id"
              type="button"
              class="ml-ribbon-gallery__item ml-ribbon-gallery__panel-item"
              :class="{ 'is-selected': selected === item.id }"
              :disabled="isItemDisabled(item)"
              @click="selectItem(item)"
            >
              <slot
                name="item"
                :item="item"
                :category="category"
                :selected="selected === item.id"
                :disabled="isItemDisabled(item)"
                :select="() => selectItem(item)"
              >
                <component
                  :is="customComponent(item)"
                  v-if="customComponent(item)"
                  v-bind="item.componentProps"
                  :item="item"
                  :category="category"
                  :selected="selected === item.id"
                  :disabled="isItemDisabled(item)"
                />
                <template v-else>
                  <div
                    class="ml-ribbon-gallery__preview"
                    :class="{
                      'ml-ribbon-gallery__preview--icon': previewComponent(item) || previewIconClass(item),
                      'ml-ribbon-gallery__preview--svg': previewSvg(item),
                    }"
                  >
                    <ElIcon v-if="previewComponent(item)" class="ml-ribbon-gallery__preview-icon">
                      <component :is="previewComponent(item)" />
                    </ElIcon>
                    <i
                      v-else-if="previewIconClass(item)"
                      class="ml-ribbon-gallery__preview-icon ml-ribbon-gallery__preview-icon--class"
                      :class="previewIconClass(item)"
                      aria-hidden="true"
                    />
                    <img
                      v-else-if="previewSvg(item) && isSvgImagePreview(item)"
                      class="ml-ribbon-gallery__preview-svg"
                      :src="previewSvg(item) ?? ''"
                      alt=""
                    />
                    <svg
                      v-else-if="previewSvg(item)"
                      class="ml-ribbon-gallery__preview-svg"
                      role="presentation"
                      aria-hidden="true"
                    >
                      <use :href="previewSvg(item) ?? ''" />
                    </svg>
                    <template v-else>{{ previewText(item) }}</template>
                  </div>
                  <div class="ml-ribbon-gallery__label">{{ item.label }}</div>
                </template>
              </slot>
            </button>
          </div>
        </section>
      </div>
    </ElPopover>

    <div v-if="!collapsed && label" class="ml-ribbon-gallery__title">{{ label }}</div>
    <div v-if="!collapsed" class="ml-ribbon-gallery__categories">
      <section v-for="category in categories" :key="category.id" class="ml-ribbon-gallery__category">
        <h4 v-if="shouldShowCategoryTitle(category)" class="ml-ribbon-gallery__category-title">
          {{ category.title }}
        </h4>
        <div class="ml-ribbon-gallery__grid">
          <button
            v-for="item in inlineCategoryItems(category)"
            :key="item.id"
            type="button"
            class="ml-ribbon-gallery__item"
            :class="{ 'is-selected': selected === item.id }"
            :disabled="isItemDisabled(item)"
            @click="selectItem(item)"
          >
            <slot
              name="item"
              :item="item"
              :category="category"
              :selected="selected === item.id"
              :disabled="isItemDisabled(item)"
              :select="() => selectItem(item)"
            >
              <component
                :is="customComponent(item)"
                v-if="customComponent(item)"
                v-bind="item.componentProps"
                :item="item"
                :category="category"
                :selected="selected === item.id"
                :disabled="isItemDisabled(item)"
              />
              <template v-else>
                <div
                  class="ml-ribbon-gallery__preview"
                  :class="{
                    'ml-ribbon-gallery__preview--icon': previewComponent(item) || previewIconClass(item),
                    'ml-ribbon-gallery__preview--svg': previewSvg(item),
                  }"
                >
                  <ElIcon v-if="previewComponent(item)" class="ml-ribbon-gallery__preview-icon">
                    <component :is="previewComponent(item)" />
                  </ElIcon>
                  <i
                    v-else-if="previewIconClass(item)"
                    class="ml-ribbon-gallery__preview-icon ml-ribbon-gallery__preview-icon--class"
                    :class="previewIconClass(item)"
                    aria-hidden="true"
                  />
                  <img
                    v-else-if="previewSvg(item) && isSvgImagePreview(item)"
                    class="ml-ribbon-gallery__preview-svg"
                    :src="previewSvg(item) ?? ''"
                    alt=""
                  />
                  <svg
                    v-else-if="previewSvg(item)"
                    class="ml-ribbon-gallery__preview-svg"
                    role="presentation"
                    aria-hidden="true"
                  >
                    <use :href="previewSvg(item) ?? ''" />
                  </svg>
                  <template v-else>{{ previewText(item) }}</template>
                </div>
                <div class="ml-ribbon-gallery__label">{{ item.label }}</div>
              </template>
            </slot>
          </button>
        </div>
      </section>
      <ElPopover
        v-if="hasInlineOverflow"
        v-model:visible="panelOpen"
        trigger="click"
        placement="bottom-start"
        :disabled="disabled"
        :width="320"
        :popper-class="panelPopperClass"
      >
        <template #reference>
          <button
            type="button"
            class="ml-ribbon-gallery__more-button"
            :class="{ 'is-open': panelOpen }"
            :disabled="disabled"
            aria-label="Show more gallery items"
          >
            <ElIcon><ArrowDown /></ElIcon>
          </button>
        </template>
        <div class="ml-ribbon-gallery__panel">
          <section v-for="category in categories" :key="category.id" class="ml-ribbon-gallery__panel-category">
            <h4 v-if="shouldShowCategoryTitle(category)" class="ml-ribbon-gallery__panel-category-title">
              {{ category.title }}
            </h4>
            <div class="ml-ribbon-gallery__panel-grid">
              <button
                v-for="item in category.items"
                :key="item.id"
                type="button"
                class="ml-ribbon-gallery__item ml-ribbon-gallery__panel-item"
                :class="{ 'is-selected': selected === item.id }"
                :disabled="isItemDisabled(item)"
                @click="selectItem(item)"
              >
                <slot
                  name="item"
                  :item="item"
                  :category="category"
                  :selected="selected === item.id"
                  :disabled="isItemDisabled(item)"
                  :select="() => selectItem(item)"
                >
                  <component
                    :is="customComponent(item)"
                    v-if="customComponent(item)"
                    v-bind="item.componentProps"
                    :item="item"
                    :category="category"
                    :selected="selected === item.id"
                    :disabled="isItemDisabled(item)"
                  />
                  <template v-else>
                    <div
                      class="ml-ribbon-gallery__preview"
                      :class="{
                        'ml-ribbon-gallery__preview--icon': previewComponent(item) || previewIconClass(item),
                        'ml-ribbon-gallery__preview--svg': previewSvg(item),
                      }"
                    >
                      <ElIcon v-if="previewComponent(item)" class="ml-ribbon-gallery__preview-icon">
                        <component :is="previewComponent(item)" />
                      </ElIcon>
                      <i
                        v-else-if="previewIconClass(item)"
                        class="ml-ribbon-gallery__preview-icon ml-ribbon-gallery__preview-icon--class"
                        :class="previewIconClass(item)"
                        aria-hidden="true"
                      />
                      <img
                        v-else-if="previewSvg(item) && isSvgImagePreview(item)"
                        class="ml-ribbon-gallery__preview-svg"
                        :src="previewSvg(item) ?? ''"
                        alt=""
                      />
                      <svg
                        v-else-if="previewSvg(item)"
                        class="ml-ribbon-gallery__preview-svg"
                        role="presentation"
                        aria-hidden="true"
                      >
                        <use :href="previewSvg(item) ?? ''" />
                      </svg>
                      <template v-else>{{ previewText(item) }}</template>
                    </div>
                    <div class="ml-ribbon-gallery__label">{{ item.label }}</div>
                  </template>
                </slot>
              </button>
            </div>
          </section>
        </div>
      </ElPopover>
    </div>
  </div>
</template>
