<script setup lang="ts">
import { ElButton, ElIcon, ElPopover } from 'element-plus'
import { ArrowDown, ArrowUp, Promotion } from '@element-plus/icons-vue'
import {
  computed,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
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
 * @prop width - Fixed group width in pixels; omitted width auto-sizes the group.
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
  width?: number
  priority?: number
  launcher?: boolean
  showLauncherIcon?: boolean
  groupModel?: RibbonGroupModel
  overflowTriggerAriaLabel?: string
  galleryPreviewFallback?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'item-click', payload: { groupId: string; itemId: string }): void
}>()
const ribbon = inject(ribbonKey, null)

const isAutoWidth = computed(() => props.width == null)
const fixedWidthStyle = computed(() => {
  if (
    typeof props.width !== 'number' ||
    Number.isNaN(props.width) ||
    props.width <= 0
  )
    return undefined
  const value = `${props.width}px`
  return {
    width: value,
    minWidth: value,
    maxWidth: value,
    flex: `0 0 ${value}`,
  }
})
const isRibbonDisabled = computed(
  () => props.disabled === true || ribbon?.disabled.value === true,
)
const groupSectionRef = ref<HTMLElement | null>(null)
const overflowItemIds = ref<string[]>([])
const overflowTriggerRef = ref<HTMLElement | null>(null)
const footerTriggerRef = ref<HTMLElement | null>(null)
const overflowSkidOffset = ref(0)
const footerSkidOffset = ref(0)
const globalSize = useGlobalConfig('size', '')
const resolvedSize = computed(() => globalSize.value || 'default')
const overflowPopoverToken = computed(
  () => `ml-ribbon-group__popover--${props.id}-overflow`,
)
const footerPopoverToken = computed(
  () => `ml-ribbon-group__popover--${props.id}-footer`,
)
const overflowPopperClass = computed(
  () =>
    [
      'ml-ribbon-group__overflow-popover',
      `ml-ribbon-group__overflow-popover--size-${resolvedSize.value}`,
      overflowPopoverToken.value,
    ].join(' '),
)
const footerPopperClass = computed(
  () =>
    [
      'ml-ribbon-group__overflow-popover',
      `ml-ribbon-group__overflow-popover--size-${resolvedSize.value}`,
      footerPopoverToken.value,
    ].join(' '),
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
const hasFooterMenuItems = computed(
  () => (props.groupModel?.footerMenuItems?.length ?? 0) > 0,
)
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
  const layout = props.groupModel.footerMenuLayout ?? 'row'
  return {
    id: `${props.groupModel.id}-footer-menu`,
    title: '',
    orientation: layout === 'column' ? 'column' : 'row',
    collections: [
      {
        id: `${props.groupModel.id}-footer-menu-collection`,
        layout,
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
  const content = section?.querySelector<HTMLElement>(
    '.ml-ribbon-group__content',
  )
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
  const itemHosts = content.querySelectorAll<HTMLElement>(
    '.ml-ribbon-item-host[data-item-id]',
  )
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
  if (overflowSkidOffset.value !== nextOffset)
    overflowSkidOffset.value = nextOffset
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
 * Toggles footer menu open state on trigger click.
 * Opening the footer closes the group-overflow popover so only one surface is active.
 */
function toggleFooterMenuOpen() {
  if (isRibbonDisabled.value) return
  const nextOpen = !isFooterMenuOpen.value
  if (nextOpen) isOverflowMenuOpen.value = false
  isFooterMenuOpen.value = nextOpen
}

/**
 * Toggles overflow menu open state on trigger click.
 * Opening overflow closes the footer popover so only one surface is active.
 */
function toggleOverflowMenuOpen() {
  if (isRibbonDisabled.value) return
  const nextOpen = !isOverflowMenuOpen.value
  if (nextOpen) isFooterMenuOpen.value = false
  isOverflowMenuOpen.value = nextOpen
}

/**
 * True when a pointer event landed inside a teleported ribbon menu that
 * belongs to a control hosted in a group footer/overflow popover. Those
 * menus mount under `body`, so Element Plus would otherwise treat them as
 * outside clicks and dismiss the host popover before the option activates.
 */
function isNestedRibbonMenuTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      [
        '.ml-ribbon-dropdown-menu',
        '.ml-ribbon-select-dropdown',
        '.ml-ribbon-gallery-panel',
        '.el-color-picker__panel',
        '.el-picker__popper',
      ].join(', '),
    ),
  )
}

/**
 * Walks ancestors for an instance-scoped popover class token.
 * Prefer classList over CSS selectors so ids with special characters still match
 * in environments without `CSS.escape` (for example jsdom).
 */
function isInsidePopoverToken(target: Element, token: string): boolean {
  let node: Element | null = target
  while (node) {
    if (node.classList?.contains(token)) return true
    node = node.parentElement
  }
  return false
}

/**
 * True when a pointer event is still interacting with the open footer surface
 * (trigger, this group's footer popover body, or nested teleported menus).
 */
function isFooterSurfaceTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (footerTriggerRef.value?.contains(target)) return true
  if (isInsidePopoverToken(target, footerPopoverToken.value)) return true
  return isNestedRibbonMenuTarget(target)
}

/**
 * True when a pointer event is still interacting with the open group-overflow
 * surface (trigger, this group's overflow popover body, or nested teleported menus).
 */
function isOverflowSurfaceTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (overflowTriggerRef.value?.contains(target)) return true
  if (isInsidePopoverToken(target, overflowPopoverToken.value)) return true
  return isNestedRibbonMenuTarget(target)
}

/**
 * Dismisses the footer popover on true outside clicks while keeping nested
 * teleported dropdown/select menus usable.
 */
function onFooterOutsidePointerDown(event: PointerEvent) {
  if (!isFooterMenuOpen.value) return
  if (isFooterSurfaceTarget(event.target)) return
  isFooterMenuOpen.value = false
}

/**
 * Dismisses the group-overflow popover on true outside clicks while keeping
 * nested teleported dropdown/select menus usable.
 */
function onOverflowOutsidePointerDown(event: PointerEvent) {
  if (!isOverflowMenuOpen.value) return
  if (isOverflowSurfaceTarget(event.target)) return
  isOverflowMenuOpen.value = false
}

/**
 * Handles an item click from the footer menu popover and closes it.
 * @param payload Bubbled item activation payload.
 * @param hide Optional popover hide helper from ElPopover default slot.
 */
function onFooterMenuItemClick(
  payload: { groupId: string; itemId: string },
  hide?: () => void,
) {
  hide?.()
  isFooterMenuOpen.value = false
  emit('item-click', payload)
}

/**
 * Handles an item click from the group overflow popover and closes it.
 * @param payload Bubbled item activation payload.
 * @param hide Optional popover hide helper from ElPopover default slot.
 */
function onOverflowMenuItemClick(
  payload: { groupId: string; itemId: string },
  hide?: () => void,
) {
  hide?.()
  isOverflowMenuOpen.value = false
  emit('item-click', payload)
}

let resizeObserver: ResizeObserver | null = null
let observedContent: HTMLElement | null = null

/**
 * Keeps ResizeObserver subscription aligned to the current content node.
 */
function syncObservedContent() {
  if (!resizeObserver) return
  const content =
    groupSectionRef.value?.querySelector<HTMLElement>(
      '.ml-ribbon-group__content',
    ) ?? null
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
watch(isRibbonDisabled, (disabled) => {
  if (!disabled) return
  isFooterMenuOpen.value = false
  isOverflowMenuOpen.value = false
})
watch(isFooterMenuOpen, (open) => {
  if (typeof document === 'undefined') return
  if (open) {
    document.addEventListener('pointerdown', onFooterOutsidePointerDown, true)
    return
  }
  document.removeEventListener('pointerdown', onFooterOutsidePointerDown, true)
})
watch(isOverflowMenuOpen, (open) => {
  if (typeof document === 'undefined') return
  if (open) {
    document.addEventListener(
      'pointerdown',
      onOverflowOutsidePointerDown,
      true,
    )
    return
  }
  document.removeEventListener(
    'pointerdown',
    onOverflowOutsidePointerDown,
    true,
  )
})

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
  if (typeof document !== 'undefined') {
    document.removeEventListener(
      'pointerdown',
      onFooterOutsidePointerDown,
      true,
    )
    document.removeEventListener(
      'pointerdown',
      onOverflowOutsidePointerDown,
      true,
    )
  }
})
</script>

<template>
  <section
    ref="groupSectionRef"
    class="ml-ribbon-group"
    :class="{ 'ml-ribbon-group--auto-width': isAutoWidth }"
    :data-priority="priority ?? 100"
    :style="fixedWidthStyle"
  >
    <div class="ml-ribbon-group__body">
      <slot />
    </div>
    <footer class="ml-ribbon-group__footer">
      <ElIcon v-if="iconComponent" class="ml-ribbon-group__icon"
        ><component :is="iconComponent"
      /></ElIcon>
      <span class="ml-ribbon-group__title">{{ title }}</span>
      <ElPopover
        v-if="hasFooterMenuItems && footerMenuGroupModel"
        v-model:visible="isFooterMenuOpen"
        :trigger="[]"
        placement="bottom-start"
        width="auto"
        :disabled="isRibbonDisabled"
        :persistent="true"
        :popper-class="footerPopperClass"
        :popper-options="footerPopperOptions"
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
            <ElIcon
              ><component :is="isFooterMenuOpen ? ArrowUp : ArrowDown"
            /></ElIcon>
          </button>
        </template>
        <template #default="{ hide }">
          <div class="ml-ribbon-group__overflow-content">
            <MlRibbonGroupContent
              :group="footerMenuGroupModel"
              :gallery-preview-fallback="galleryPreviewFallback"
              :disabled="isRibbonDisabled"
              @item-click="onFooterMenuItemClick($event, hide)"
            />
          </div>
        </template>
      </ElPopover>
      <ElPopover
        v-if="hasOverflowItems && overflowGroupModel"
        v-model:visible="isOverflowMenuOpen"
        :trigger="[]"
        placement="bottom-start"
        width="auto"
        :disabled="isRibbonDisabled"
        :persistent="true"
        :popper-class="overflowPopperClass"
        :popper-options="overflowPopperOptions"
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
            <ElIcon
              ><component :is="isOverflowMenuOpen ? ArrowUp : ArrowDown"
            /></ElIcon>
          </button>
        </template>
        <template #default="{ hide }">
          <div class="ml-ribbon-group__overflow-content">
            <MlRibbonGroupContent
              :group="overflowGroupModel"
              :gallery-preview-fallback="galleryPreviewFallback"
              :disabled="isRibbonDisabled"
              @item-click="onOverflowMenuItemClick($event, hide)"
            />
          </div>
        </template>
      </ElPopover>
      <ElButton
        v-if="showLauncherIcon ?? launcher"
        link
        class="ml-ribbon-group__launcher"
        :disabled="isRibbonDisabled"
      >
        <ElIcon><Promotion /></ElIcon>
      </ElButton>
    </footer>
  </section>
</template>
