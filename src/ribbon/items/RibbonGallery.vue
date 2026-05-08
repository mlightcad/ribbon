<script setup lang="ts">
import { computed, markRaw, nextTick, ref, toRaw, watch } from 'vue'
import { ArrowDown, ArrowUp, Bottom } from '@element-plus/icons-vue'
import { ElIcon, ElPopover, useGlobalConfig } from 'element-plus'
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
    label?: string
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
const inlineRowIndex = ref(0)
const galleryRef = ref<HTMLElement | null>(null)
const inlineMoreButtonRef = ref<HTMLButtonElement | null>(null)
const inlinePanelRef = ref<HTMLElement | null>(null)
const inlinePanelSkid = ref(0)
const panelPadding = 6
const panelItemWidthBase = 64
const panelGridGap = 4
const panelScrollbarWidth = 16
const panelControlsGap = 4
const panelControlsWidthBase = 22
const globalSize = useGlobalConfig('size', '')
const resolvedSize = computed(() => globalSize.value || 'default')
const panelScale = computed(() => {
  if (resolvedSize.value === 'small') return 0.92
  if (resolvedSize.value === 'large') return 1.08
  return 1
})
const panelItemWidth = computed(() => Math.round(panelItemWidthBase * panelScale.value))
const panelControlsWidth = computed(() => Math.round(panelControlsWidthBase * panelScale.value))
const galleryLabel = computed(() => props.label?.trim() ?? '')
const visibleCategoryCount = computed(() => props.categories.filter((category) => category.items.length > 0).length)
const galleryItems = computed(() => props.categories.flatMap((category) => category.items))
const collapsedItem = computed(() => galleryItems.value.find((item) => item.id === selected.value) ?? galleryItems.value[0])
const normalizedInlineItemLimit = computed(() => {
  if (!Number.isFinite(props.inlineItemLimit) || props.inlineItemLimit <= 0) return 4
  return Math.floor(props.inlineItemLimit)
})
const inlineRowCount = computed(() => Math.max(1, Math.ceil(galleryItems.value.length / normalizedInlineItemLimit.value)))
const normalizedInlineRowIndex = computed(() => Math.min(inlineRowIndex.value, inlineRowCount.value - 1))
const canShowPreviousInlineRow = computed(() => hasInlineOverflow.value && normalizedInlineRowIndex.value > 0)
const canShowNextInlineRow = computed(
  () => hasInlineOverflow.value && normalizedInlineRowIndex.value < inlineRowCount.value - 1,
)
const visibleInlineItems = computed(() => {
  const start = normalizedInlineRowIndex.value * normalizedInlineItemLimit.value
  return galleryItems.value.slice(start, start + normalizedInlineItemLimit.value)
})
const visibleInlineIds = computed(() => new Set(visibleInlineItems.value.map((item) => item.id)))
const hasInlineOverflow = computed(() => galleryItems.value.length > normalizedInlineItemLimit.value)
const panelPopperClass = computed(
  () =>
    `ml-ribbon-gallery-panel ml-ribbon-gallery-panel--${props.collapsed ? 'collapsed' : 'inline'} ml-ribbon-gallery-panel--size-${resolvedSize.value}`,
)
const panelGridStyle = computed(() => ({
  '--ml-ribbon-gallery-panel-columns': String(normalizedInlineItemLimit.value),
  '--ml-ribbon-gallery-panel-item-width': `${panelItemWidth.value}px`,
}))
const panelWidth = computed(() => {
  return (
    normalizedInlineItemLimit.value * panelItemWidth.value +
    Math.max(0, normalizedInlineItemLimit.value - 1) * panelGridGap +
    panelPadding * 2 +
    (props.collapsed ? panelScrollbarWidth : panelControlsGap + panelControlsWidth.value)
  )
})
const inlinePanelPopperOptions = computed(() => ({
  modifiers: [
    {
      name: 'offset',
      options: {
        offset: [inlinePanelSkid.value, 0],
      },
    },
  ],
}))

watch(
  () => props.modelValue,
  (value) => {
    if (typeof value !== 'string') return
    selected.value = value
    syncInlineRowToSelectedItem(value)
  },
  { immediate: true },
)

watch(
  () => [galleryItems.value.map((item) => item.id).join('\u0000'), normalizedInlineItemLimit.value, selected.value] as const,
  () => {
    if (!syncInlineRowToSelectedItem()) {
      inlineRowIndex.value = Math.min(inlineRowIndex.value, inlineRowCount.value - 1)
    }
  },
)

watch(panelOpen, async (open) => {
  if (!open || props.collapsed) return
  syncInlinePanelSkid()
  await nextTick()
  await nextTick()
  scrollInlinePanelToCurrentRow()
})

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
  const label = galleryLabel.value.toLowerCase()
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
 * Moves the inline gallery viewport by one row.
 * @param direction Direction to move through inline gallery rows.
 */
function moveInlineRow(direction: -1 | 1) {
  if (props.disabled || !hasInlineOverflow.value) return
  const nextIndex = normalizedInlineRowIndex.value + direction
  inlineRowIndex.value = Math.min(Math.max(nextIndex, 0), inlineRowCount.value - 1)
}

/**
 * Resolves the row index for an item in the flattened gallery list.
 * @param item Gallery item model.
 * @returns Zero-based inline row index.
 */
function galleryItemRowIndex(item: RibbonGalleryItemModel) {
  const itemIndex = galleryItems.value.findIndex((candidate) => candidate.id === item.id)
  if (itemIndex < 0) return 0
  return Math.floor(itemIndex / normalizedInlineItemLimit.value)
}

/**
 * Moves the inline viewport to the row containing the selected gallery item.
 * @param value Optional selected item id, defaults to current selection.
 * @returns Whether a matching gallery item was found.
 */
function syncInlineRowToSelectedItem(value = selected.value) {
  const item = galleryItems.value.find((candidate) => candidate.id === value)
  if (!item) return false
  inlineRowIndex.value = galleryItemRowIndex(item)
  return true
}

/**
 * Aligns the inline gallery panel with the gallery root instead of the right-side dropdown button.
 */
function syncInlinePanelSkid() {
  const gallery = galleryRef.value
  const button = inlineMoreButtonRef.value
  if (!gallery || !button) {
    inlinePanelSkid.value = 0
    return
  }
  const firstInlineItem = gallery.querySelector<HTMLElement>('.ml-ribbon-gallery__grid .ml-ribbon-gallery__item')
  const targetLeft = firstInlineItem?.getBoundingClientRect().left ?? gallery.getBoundingClientRect().left
  inlinePanelSkid.value = Math.round(targetLeft - button.getBoundingClientRect().left - panelPadding)
}

/**
 * Scrolls the picker panel to the row currently shown inline.
 */
function scrollInlinePanelToCurrentRow() {
  const panel = inlinePanelRef.value
  if (!panel) return
  const target = panel.querySelector<HTMLElement>(`[data-gallery-row-index="${normalizedInlineRowIndex.value}"]`)
  target?.scrollIntoView?.({ block: 'start' })
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
  inlineRowIndex.value = galleryItemRowIndex(item)
  panelOpen.value = false
  emit('select', item.id)
}
</script>

<template>
  <div
    ref="galleryRef"
    class="ml-ribbon-gallery"
    :class="{ 'is-disabled': disabled, 'is-collapsed': collapsed, 'is-unlabeled': !collapsed && !galleryLabel }"
  >
    <ElPopover
      v-if="collapsed && collapsedItem"
      v-model:visible="panelOpen"
      trigger="click"
      placement="bottom-start"
      :disabled="disabled"
      :width="panelWidth"
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
        </button>
      </template>
      <div class="ml-ribbon-gallery__panel">
        <section v-for="category in categories" :key="category.id" class="ml-ribbon-gallery__panel-category">
          <h4 v-if="shouldShowCategoryTitle(category)" class="ml-ribbon-gallery__panel-category-title">
            {{ category.title }}
          </h4>
          <div class="ml-ribbon-gallery__panel-grid" :style="panelGridStyle">
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

    <div v-if="!collapsed && galleryLabel" class="ml-ribbon-gallery__title">{{ galleryLabel }}</div>
    <div v-if="!collapsed" class="ml-ribbon-gallery__categories">
      <section v-for="category in categories" :key="category.id" class="ml-ribbon-gallery__category">
        <h4 v-if="galleryLabel && shouldShowCategoryTitle(category)" class="ml-ribbon-gallery__category-title">
          {{ category.title }}
        </h4>
        <div
          class="ml-ribbon-gallery__grid"
          :style="{ '--ml-ribbon-gallery-inline-columns': String(normalizedInlineItemLimit) }"
        >
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
      <div v-if="hasInlineOverflow" class="ml-ribbon-gallery__controls" aria-label="Gallery navigation">
        <button
          type="button"
          class="ml-ribbon-gallery__control-button"
          :disabled="disabled || !canShowPreviousInlineRow"
          aria-label="Show previous gallery row"
          @click="moveInlineRow(-1)"
        >
          <ElIcon><ArrowUp /></ElIcon>
        </button>
        <button
          type="button"
          class="ml-ribbon-gallery__control-button"
          :disabled="disabled || !canShowNextInlineRow"
          aria-label="Show next gallery row"
          @click="moveInlineRow(1)"
        >
          <ElIcon><ArrowDown /></ElIcon>
        </button>
        <ElPopover
          v-model:visible="panelOpen"
          trigger="click"
          placement="bottom-start"
          :disabled="disabled"
          :width="panelWidth"
          :popper-class="panelPopperClass"
          :popper-options="inlinePanelPopperOptions"
        >
          <template #reference>
            <button
              ref="inlineMoreButtonRef"
              type="button"
              class="ml-ribbon-gallery__control-button ml-ribbon-gallery__more-button"
              :class="{ 'is-open': panelOpen }"
              :disabled="disabled"
              aria-label="Show more gallery items"
              @click="syncInlinePanelSkid"
            >
              <ElIcon><Bottom /></ElIcon>
            </button>
          </template>
          <div ref="inlinePanelRef" class="ml-ribbon-gallery__panel">
            <section v-for="category in categories" :key="category.id" class="ml-ribbon-gallery__panel-category">
              <h4 v-if="shouldShowCategoryTitle(category)" class="ml-ribbon-gallery__panel-category-title">
                {{ category.title }}
              </h4>
              <div class="ml-ribbon-gallery__panel-grid" :style="panelGridStyle">
                <button
                  v-for="item in category.items"
                  :key="item.id"
                  type="button"
                  class="ml-ribbon-gallery__item ml-ribbon-gallery__panel-item"
                  :class="{ 'is-selected': selected === item.id }"
                  :data-gallery-row-index="galleryItemRowIndex(item)"
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
  </div>
</template>
