<script setup lang="ts">
import { ElButton, ElIcon, ElPopover } from 'element-plus'
import { ArrowDown, ArrowUp, Promotion } from '@element-plus/icons-vue'
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Component } from 'vue'
import { useGlobalConfig } from 'element-plus'
import { ribbonKey } from '../context'
import type { RibbonGroupModel } from '../types'
import MlRibbonGroupContent from './RibbonGroupContent.vue'

/**
 * @component MlRibbonGroup
 * @description
 * Visual wrapper for a ribbon group. It renders the group frame/title area and
 * automatically moves clipped items into an overflow popover when space is limited.
 *
 * @prop id - Group identifier.
 * @prop title - Group title shown in the footer.
 * @prop icon - Optional Vue icon component for the group title area.
 * @prop groupIconCss - Optional CSS marker used by host logic to map string icons.
 * @prop orientation - Primary group layout direction.
 * @prop autoWidth - Whether group width is auto-sized.
 * @prop priority - Overflow priority hint (higher values overflow first).
 * @prop launcher - Enables launcher affordance.
 * @prop showLauncherIcon - Explicit launcher icon visibility override.
 * @prop groupModel - Full group model used to construct overflow content.
 * @prop overflowTriggerAriaLabel - Accessible label for overflow trigger button.
 * @prop galleryPreviewFallback - Fallback text passed to nested gallery items.
 *
 * @event item-click - Emitted when an item click bubbles from group content.
 * Payload includes `{ groupId, itemId }`.
 *
 * @slot default - Group body content, usually `MlRibbonGroupContent`.
 *
 * @example
 * ```vue
 * <MlRibbonGroup
 *   id="clipboard"
 *   title="Clipboard"
 *   :group-model="group"
 *   :priority="10"
 *   overflow-trigger-aria-label="Show hidden commands"
 *   @item-click="onItemClick"
 * >
 *   <MlRibbonGroupContent :group="group" />
 * </MlRibbonGroup>
 * ```
 */
const props = defineProps<{
  id: string
  title: string
  icon?: string | Component
  groupIconCss?: string
  orientation?: 'row' | 'column'
  autoWidth?: boolean
  priority?: number
  launcher?: boolean
  showLauncherIcon?: boolean
  groupModel?: RibbonGroupModel
  overflowTriggerAriaLabel?: string
  galleryPreviewFallback?: string
}>()

const emit = defineEmits<{ (e: 'item-click', payload: { groupId: string; itemId: string }): void }>()
const ribbon = inject(ribbonKey, null)

const isAutoWidth = computed(() => props.autoWidth !== false)
const isRibbonDisabled = computed(() => ribbon?.disabled.value === true)
const groupSectionRef = ref<HTMLElement | null>(null)
const overflowItemIds = ref<string[]>([])
const overflowTriggerRef = ref<HTMLElement | null>(null)
const footerTriggerRef = ref<HTMLElement | null>(null)
const overflowSkidOffset = ref(0)
const footerSkidOffset = ref(0)
const globalSize = useGlobalConfig('size', '')
const resolvedSize = computed(() => globalSize.value || 'default')
const overflowPopperClass = computed(
  () => `ml-ribbon-group__overflow-popover ml-ribbon-group__overflow-popover--size-${resolvedSize.value}`,
)
const overflowPopperOptions = computed(() => ({
  modifiers: [
    {
      name: 'offset',
      options: {
        offset: [overflowSkidOffset.value, 8],
      },
    },
  ],
}))
const footerPopperOptions = computed(() => ({
  modifiers: [
    {
      name: 'offset',
      options: {
        offset: [footerSkidOffset.value, 8],
      },
    },
  ],
}))

const iconComponent = computed<Component | null>(() => {
  if (!props.icon || typeof props.icon === 'string') return null
  return props.icon
})

const hasOverflowItems = computed(() => overflowItemIds.value.length > 0)
const hasFooterMenuItems = computed(() => (props.groupModel?.footerMenuItems?.length ?? 0) > 0)
const isFooterMenuOpen = ref(false)
const isOverflowMenuOpen = ref(false)

const overflowGroupModel = computed<RibbonGroupModel | null>(() => {
  if (!props.groupModel || !overflowItemIds.value.length) return null
  const overflowSet = new Set(overflowItemIds.value)
  const collections =
    props.groupModel.collections
      ?.map((collection) => ({
        ...collection,
        items: collection.items.filter((item) => overflowSet.has(item.id)),
      }))
      .filter((collection) => collection.items.length > 0) ?? []
  if (!collections.length) return null

  return {
    ...props.groupModel,
    collections,
  }
})

const footerMenuGroupModel = computed<RibbonGroupModel | null>(() => {
  if (!props.groupModel?.footerMenuItems?.length) return null
  return {
    id: `${props.groupModel.id}-footer-menu`,
    title: '',
    orientation: 'row',
    collections: [
      {
        id: `${props.groupModel.id}-footer-menu-collection`,
        layout: 'row',
        items: props.groupModel.footerMenuItems,
      },
    ],
  }
})

/**
 * Recomputes which items are visually clipped and should appear in group overflow.
 */
function recomputeOverflowItems() {
  const section = groupSectionRef.value
  const content = section?.querySelector<HTMLElement>('.ml-ribbon-group__content')
  if (!content) {
    if (overflowItemIds.value.length > 0) overflowItemIds.value = []
    return
  }
  const contentRect = content.getBoundingClientRect()
  if (contentRect.width <= 0 || contentRect.height <= 0) {
    if (overflowItemIds.value.length > 0) overflowItemIds.value = []
    return
  }

  const hiddenIds: string[] = []
  const itemHosts = content.querySelectorAll<HTMLElement>('.ml-ribbon-item-host[data-item-id]')
  itemHosts.forEach((host) => {
    const itemId = host.dataset.itemId
    if (!itemId) return
    const rect = host.getBoundingClientRect()
    const isOutOfBounds =
      rect.right - contentRect.right > 0.5 ||
      rect.bottom - contentRect.bottom > 0.5 ||
      contentRect.left - rect.left > 0.5 ||
      contentRect.top - rect.top > 0.5
    if (isOutOfBounds) hiddenIds.push(itemId)
  })

  const same =
    overflowItemIds.value.length === hiddenIds.length &&
    overflowItemIds.value.every((id, index) => id === hiddenIds[index])
  if (!same) overflowItemIds.value = hiddenIds
}

/**
 * Schedules overflow-related recalculation after next DOM update.
 */
function scheduleOverflowRecompute() {
  nextTick(() => {
    syncObservedContent()
    recomputeOverflowOffset()
    recomputeFooterOffset()
    recomputeOverflowItems()
  })
}

/**
 * Recomputes popover horizontal offset for the group overflow trigger.
 */
function recomputeOverflowOffset() {
  const sectionRect = groupSectionRef.value?.getBoundingClientRect()
  const triggerRect = overflowTriggerRef.value?.getBoundingClientRect()
  if (!sectionRect || !triggerRect) {
    if (overflowSkidOffset.value !== 0) overflowSkidOffset.value = 0
    return
  }
  const nextOffset = Math.round(sectionRect.left - triggerRect.left)
  if (overflowSkidOffset.value !== nextOffset) overflowSkidOffset.value = nextOffset
}

/**
 * Recomputes popover horizontal offset for the footer trigger.
 */
function recomputeFooterOffset() {
  const sectionRect = groupSectionRef.value?.getBoundingClientRect()
  const triggerRect = footerTriggerRef.value?.getBoundingClientRect()
  if (!sectionRect || !triggerRect) {
    if (footerSkidOffset.value !== 0) footerSkidOffset.value = 0
    return
  }
  const nextOffset = Math.round(sectionRect.left - triggerRect.left)
  if (footerSkidOffset.value !== nextOffset) footerSkidOffset.value = nextOffset
}

/**
 * Syncs footer menu open state from popover lifecycle.
 * @param value Next open state.
 */
function setFooterMenuOpen(value: boolean) {
  isFooterMenuOpen.value = value
}

/**
 * Syncs overflow menu open state from popover lifecycle.
 * @param value Next open state.
 */
function setOverflowMenuOpen(value: boolean) {
  isOverflowMenuOpen.value = value
}

/**
 * Toggles footer menu open state on trigger click.
 */
function toggleFooterMenuOpen() {
  if (isRibbonDisabled.value) return
  isFooterMenuOpen.value = !isFooterMenuOpen.value
}

/**
 * Toggles overflow menu open state on trigger click.
 */
function toggleOverflowMenuOpen() {
  if (isRibbonDisabled.value) return
  isOverflowMenuOpen.value = !isOverflowMenuOpen.value
}

let resizeObserver: ResizeObserver | null = null
let observedContent: HTMLElement | null = null

/**
 * Keeps ResizeObserver subscription aligned to the current content node.
 */
function syncObservedContent() {
  if (!resizeObserver) return
  const content = groupSectionRef.value?.querySelector<HTMLElement>('.ml-ribbon-group__content') ?? null
  if (observedContent === content) return
  if (observedContent) resizeObserver.unobserve(observedContent)
  if (content) resizeObserver.observe(content)
  observedContent = content
}

watch(
  () => props.groupModel,
  () => {
    scheduleOverflowRecompute()
  },
  { deep: true },
)
watch(
  isRibbonDisabled,
  (disabled) => {
    if (!disabled) return
    isFooterMenuOpen.value = false
    isOverflowMenuOpen.value = false
  },
)

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      recomputeOverflowOffset()
      recomputeFooterOffset()
      recomputeOverflowItems()
    })
    if (groupSectionRef.value) resizeObserver.observe(groupSectionRef.value)
    syncObservedContent()
  }
  scheduleOverflowRecompute()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <section
    ref="groupSectionRef"
    class="ml-ribbon-group"
    :class="{ 'ml-ribbon-group--auto-width': isAutoWidth }"
    :data-priority="priority ?? 100"
  >
    <div class="ml-ribbon-group__body">
      <slot />
    </div>
    <footer class="ml-ribbon-group__footer">
      <ElIcon v-if="iconComponent" class="ml-ribbon-group__icon"><component :is="iconComponent" /></ElIcon>
      <span class="ml-ribbon-group__title">{{ title }}</span>
      <ElPopover
        v-if="hasFooterMenuItems && footerMenuGroupModel"
        trigger="click"
        placement="bottom-start"
        :disabled="isRibbonDisabled"
        :popper-class="overflowPopperClass"
        :popper-options="footerPopperOptions"
        @show="setFooterMenuOpen(true)"
        @hide="setFooterMenuOpen(false)"
      >
        <template #reference>
          <button
            ref="footerTriggerRef"
            type="button"
            class="ml-ribbon-group__footer-trigger"
            :class="{ 'is-open': isFooterMenuOpen }"
            :aria-label="overflowTriggerAriaLabel"
            :aria-expanded="isFooterMenuOpen"
            :disabled="isRibbonDisabled"
            @click="toggleFooterMenuOpen"
          >
            <ElIcon><component :is="isFooterMenuOpen ? ArrowUp : ArrowDown" /></ElIcon>
          </button>
        </template>
        <div class="ml-ribbon-group__overflow-content">
          <MlRibbonGroupContent
            :group="footerMenuGroupModel"
            :gallery-preview-fallback="galleryPreviewFallback"
            @item-click="emit('item-click', $event)"
          />
        </div>
      </ElPopover>
      <ElPopover
        v-if="hasOverflowItems && overflowGroupModel"
        trigger="click"
        placement="bottom-start"
        :disabled="isRibbonDisabled"
        :popper-class="overflowPopperClass"
        :popper-options="overflowPopperOptions"
        @show="setOverflowMenuOpen(true)"
        @hide="setOverflowMenuOpen(false)"
      >
        <template #reference>
          <button
            ref="overflowTriggerRef"
            type="button"
            class="ml-ribbon-group__overflow-trigger"
            :class="{ 'is-open': isOverflowMenuOpen }"
            :aria-label="overflowTriggerAriaLabel"
            :aria-expanded="isOverflowMenuOpen"
            :disabled="isRibbonDisabled"
            @click="toggleOverflowMenuOpen"
          >
            <ElIcon><component :is="isOverflowMenuOpen ? ArrowUp : ArrowDown" /></ElIcon>
          </button>
        </template>
        <div class="ml-ribbon-group__overflow-content">
          <MlRibbonGroupContent
            :group="overflowGroupModel"
            :gallery-preview-fallback="galleryPreviewFallback"
            @item-click="emit('item-click', $event)"
          />
        </div>
      </ElPopover>
      <ElButton v-if="showLauncherIcon ?? launcher" link class="ml-ribbon-group__launcher" :disabled="isRibbonDisabled">
        <ElIcon><Promotion /></ElIcon>
      </ElButton>
    </footer>
  </section>
</template>

