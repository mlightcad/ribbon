<script setup lang="ts">
import { computed, markRaw, nextTick, onMounted, onUnmounted, provide, ref, toRaw, watch } from 'vue'
import { ElButton, ElConfigProvider, ElIcon, ElPopover, ElSwitch, ElTooltip, useGlobalConfig } from 'element-plus'
import { ArrowDownBold, ArrowUpBold, Grid, Menu } from '@element-plus/icons-vue'
import type { Component } from 'vue'
import type { ComponentSize } from 'element-plus'
import { ribbonKey } from '../context'
import { useRibbonState } from '../composables/useRibbonState'
import type {
  RibbonDynamicApi,
  RibbonGroupModel,
  RibbonItemModel,
  RibbonLayout,
  RibbonLocaleTexts,
  RibbonTabModel,
} from '../types'
import MlRibbonBackstage from '../modules/RibbonBackstage.vue'
import MlRibbonContextualTabs from '../modules/RibbonContextualTabs.vue'
import MlRibbonFileMenu from '../modules/RibbonFileMenu.vue'
import MlRibbonGroupContent from './RibbonGroupContent.vue'
import MlRibbonGroup from './RibbonGroup.vue'

/**
 * @component MlRibbon
 * @description
 * Root orchestrator for the ribbon system. It owns tab/layout/minimize state,
 * provides dynamic API exposure, and coordinates overflow, backstage, key tips,
 * contextual tabs, and item interaction events.
 *
 * @prop id - DOM/id namespace root for this ribbon instance.
 * @prop tabs - Ribbon tab tree with groups, collections, and items.
 * @prop activeTab - Controlled active tab id (`v-model:activeTab`).
 * @prop activeLayout - Legacy-friendly layout alias (`classic`/`simplified`).
 * @prop layout - Controlled layout (`v-model:layout`).
 * @prop size - Ribbon size delegated to Element Plus config provider.
 * @prop minimized - Controlled minimize state (`v-model:minimized`).
 * @prop disabled - Disables the entire ribbon interaction surface.
 * @prop hideLayoutSwitcher - Controls whether layout switcher is hidden.
 * @prop hideMinimizeButton - Controls whether minimize button is hidden.
 * @prop hideKeyTipsToggle - Controls whether key tips toggle is hidden.
 * @prop showFileMenu - Enables/disables File menu tab.
 * @prop showOpenBackstage - Controls whether "Open backstage" entry is shown in File menu.
 * @prop fileMenuItems - File menu command list.
 * @prop texts - Localized UI text bundle for labels/tooltips.
 *
 * @slot tabs-extra - Custom content rendered on the right side of the tab area.
 * Slot props: `{ activeTab, layout, minimized, disabled }`.
 * @slot backstage - Fully custom backstage content.
 * Slot props: `{ close, open, size, backLabel, title, description, disabled }`.
 *
 * @event update:activeTab - Fired when active tab changes.
 * @event update:layout - Fired when layout changes.
 * @event update:minimized - Fired when minimized changes.
 * @event tabChange - Fired after tab selection changes.
 * @event layoutChange - Fired after layout mode changes.
 * @event itemClick - Fired when a ribbon item is activated with `{ tabId, groupId, itemId }`.
 * @event overflowOpen - Fired when main overflow popover opens.
 * @event overflowClose - Fired when main overflow popover closes.
 * @event backstageOpen - Fired when backstage drawer opens.
 * @event backstageClose - Fired when backstage drawer closes.
 * @event fileMenuSelect - Fired when a file menu command is chosen.
 *
 * @example
 * ```vue
 * <MlRibbon
 *   v-model:active-tab="activeTab"
 *   v-model:layout="layout"
 *   v-model:minimized="minimized"
 *   :tabs="tabs"
 *   :file-menu-items="fileMenuItems"
 *   :texts="ribbonTexts"
 *   @item-click="onRibbonItemClick"
 * />
 * ```
 */
/**
 * Normalizes potential component definitions to non-reactive objects.
 * @param value Unknown schema value that may contain a component.
 * @returns Normalized value safe for reactive tab trees.
 */
function normalizeComponentCandidate<T>(value: T): T {
  if (value == null || typeof value === 'string') return value
  if (typeof value === 'object' || typeof value === 'function') {
    return markRaw(toRaw(value as object)) as T
  }
  return value
}

/**
 * Clones and normalizes item props, including icon-like fields.
 * @param props Raw item props from schema.
 * @returns Normalized props clone.
 */
function normalizeItemProps(props?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!props) return undefined
  const nextProps: Record<string, unknown> = { ...props }
  if ('icon' in nextProps) {
    nextProps.icon = normalizeComponentCandidate(nextProps.icon)
  }
  if ('activeIcon' in nextProps) {
    nextProps.activeIcon = normalizeComponentCandidate(nextProps.activeIcon)
  }
  if ('inactiveIcon' in nextProps) {
    nextProps.inactiveIcon = normalizeComponentCandidate(nextProps.inactiveIcon)
  }
  if (Array.isArray(nextProps.options)) {
    nextProps.options = nextProps.options.map((option) => {
      if (!option || typeof option !== 'object') return option
      const optionRecord = option as Record<string, unknown>
      if (!('icon' in optionRecord)) return optionRecord
      return {
        ...optionRecord,
        icon: normalizeComponentCandidate(optionRecord.icon),
      }
    })
  }
  return nextProps
}

/**
 * Clones a ribbon item and normalizes component-like fields.
 * @param item Source item model.
 * @returns Cloned item model.
 */
function cloneItem(item: RibbonItemModel): RibbonItemModel {
  return {
    ...item,
    icon: normalizeComponentCandidate(item.icon),
    props: normalizeItemProps(item.props),
  }
}

/**
 * Clones a ribbon group recursively.
 * @param group Source group model.
 * @returns Cloned group model.
 */
function cloneGroup(group: RibbonGroupModel): RibbonGroupModel {
  return {
    ...group,
    icon: normalizeComponentCandidate(group.icon),
    footerMenuItems: group.footerMenuItems?.map(cloneItem),
    collections: group.collections?.map((collection) => ({
      ...collection,
      items: collection.items?.map(cloneItem),
    })),
  }
}

/**
 * Clones tab schema before storing it in mutable runtime state.
 * @param value Source tabs array.
 * @returns Deep-cloned tabs array for runtime mutation.
 */
function cloneTabs(value: RibbonTabModel[]): RibbonTabModel[] {
  return value.map((tab) => ({
    ...tab,
    groups: tab.groups?.map(cloneGroup),
  }))
}

const defaultRibbonTexts: Required<RibbonLocaleTexts> = {
  layoutSwitcherTooltip: 'Switch ribbon layout',
  minimizeTooltip: 'Minimize ribbon',
  keyTipsToggleText: 'Key Tips',
  overflowTriggerAriaLabel: 'Open overflow groups',
  groupOverflowTriggerAriaLabel: 'Open group menu',
  fileMenuLabel: 'File',
  fileMenuOpenBackstageLabel: 'Open backstage',
  backstageBackLabel: 'Back',
  backstageTitle: 'Backstage',
  backstageDescription: 'Manage your document and settings here.',
  keyTipsSequencePrefix: 'Sequence:',
  keyTipsEmptySequence: 'No key sequence',
  contextualTabDefaultTitle: 'Contextual',
  galleryPreviewFallback: 'Preview unavailable',
}

const props = withDefaults(
  defineProps<{
    id?: string
    tabs: RibbonTabModel[]
    activeTab?: string
    activeLayout?: RibbonLayout | 'Classic' | 'Simplified'
    layout?: RibbonLayout
    size?: ComponentSize
    minimized?: boolean
    disabled?: boolean
    hideLayoutSwitcher?: boolean
    hideMinimizeButton?: boolean
    hideKeyTipsToggle?: boolean
    showFileMenu?: boolean
    showOpenBackstage?: boolean
    fileMenuItems?: { id: string; label: string; disabled?: boolean }[]
    texts?: RibbonLocaleTexts
  }>(),
  {
    id: 'ml-ribbon-root',
    activeTab: '',
    activeLayout: undefined,
    layout: 'classic',
    size: undefined,
    minimized: false,
    disabled: false,
    hideLayoutSwitcher: false,
    hideMinimizeButton: false,
    hideKeyTipsToggle: false,
    showFileMenu: true,
    showOpenBackstage: true,
    fileMenuItems: () => [],
    texts: () => ({}),
  },
)

const emit = defineEmits<{
  (e: 'update:activeTab', value: string): void
  (e: 'update:layout', value: RibbonLayout): void
  (e: 'update:minimized', value: boolean): void
  (e: 'tabChange', value: string): void
  (e: 'layoutChange', value: RibbonLayout): void
  (e: 'itemClick', payload: { tabId: string; groupId: string; itemId: string }): void
  (e: 'overflowOpen'): void
  (e: 'overflowClose'): void
  (e: 'backstageOpen'): void
  (e: 'backstageClose'): void
  (e: 'fileMenuSelect', value: string): void
}>()

const { context, visibleTabs } = useRibbonState(
  props.id,
  props.tabs,
  props.disabled,
  props.activeLayout
    ? String(props.activeLayout).toLowerCase() === 'simplified'
      ? 'simplified'
      : 'classic'
    : props.layout,
  props.minimized,
  props.activeTab || props.tabs[0]?.id || '',
)

provide(ribbonKey, context)

watch(
  () => props.tabs,
  (tabs) => {
    // Keep internal mutable state in sync with controlled tabs prop.
    context.tabs.value = cloneTabs(tabs)
    if (!context.tabs.value.some((x) => x.id === context.activeTab.value)) {
      context.activeTab.value = context.tabs.value[0]?.id || ''
    }
  },
  { deep: true },
)

watch(() => props.layout, (value) => {
  if (value !== context.layout.value) context.layout.value = value
})
watch(() => props.activeLayout, (value) => {
  if (!value) return
  const normalized: RibbonLayout = String(value).toLowerCase() === 'simplified' ? 'simplified' : 'classic'
  if (normalized !== context.layout.value) context.layout.value = normalized
})
watch(() => props.minimized, (value) => {
  if (value !== context.minimized.value) context.minimized.value = value
})
watch(() => props.disabled, (value) => {
  if (value !== context.disabled.value) context.disabled.value = value
})
watch(() => props.activeTab, (value) => {
  if (value && value !== context.activeTab.value) context.activeTab.value = value
})

watch(context.activeTab, (value) => {
  emit('update:activeTab', value)
  emit('tabChange', value)
})
watch(context.layout, (value) => {
  emit('update:layout', value)
  emit('layoutChange', value)
})
watch(context.minimized, (value) => {
  emit('update:minimized', value)
})
watch(context.overflowOpen, (value) => {
  if (value) emit('overflowOpen')
  else emit('overflowClose')
})
watch(context.backdropOpen, (value) => {
  if (value) emit('backstageOpen')
  else emit('backstageClose')
})

const activeTabModel = computed(() => visibleTabs.value.find((x) => x.id === context.activeTab.value))
const visibleGroups = computed(() => activeTabModel.value?.groups?.filter((x) => x.visible !== false) ?? [])
const classicPanelRef = ref<HTMLElement | null>(null)
// Group ids hidden in classic mode and shown in the overflow popover.
const hiddenGroupIds = ref<Set<string>>(new Set())
// Cache measured widths by group id to reduce fallback width estimates on recalculation.
const measuredGroupWidths = ref<Record<string, number>>({})
const globalSize = useGlobalConfig('size', '')
const resolvedRibbonSize = computed(() => props.size || globalSize.value || 'default')
const simplifiedGroupPopoverClass = computed(
  () => `ml-ribbon-group-popover ml-ribbon-group-popover--size-${resolvedRibbonSize.value}`,
)
const classicOverflowPopoverClass = computed(
  () => `ml-ribbon-overflow-popover ml-ribbon-overflow-popover--size-${resolvedRibbonSize.value}`,
)
const ribbonTexts = computed<RibbonLocaleTexts>(() => ({
  layoutSwitcherTooltip: props.texts.layoutSwitcherTooltip || defaultRibbonTexts.layoutSwitcherTooltip,
  minimizeTooltip: props.texts.minimizeTooltip || defaultRibbonTexts.minimizeTooltip,
  keyTipsToggleText: props.texts.keyTipsToggleText || defaultRibbonTexts.keyTipsToggleText,
  overflowTriggerAriaLabel: props.texts.overflowTriggerAriaLabel || defaultRibbonTexts.overflowTriggerAriaLabel,
  groupOverflowTriggerAriaLabel:
    props.texts.groupOverflowTriggerAriaLabel || defaultRibbonTexts.groupOverflowTriggerAriaLabel,
  fileMenuLabel: props.texts.fileMenuLabel || defaultRibbonTexts.fileMenuLabel,
  fileMenuOpenBackstageLabel:
    props.texts.fileMenuOpenBackstageLabel || defaultRibbonTexts.fileMenuOpenBackstageLabel,
  backstageBackLabel: props.texts.backstageBackLabel || defaultRibbonTexts.backstageBackLabel,
  backstageTitle: props.texts.backstageTitle || defaultRibbonTexts.backstageTitle,
  backstageDescription: props.texts.backstageDescription || defaultRibbonTexts.backstageDescription,
  keyTipsSequencePrefix: props.texts.keyTipsSequencePrefix || defaultRibbonTexts.keyTipsSequencePrefix,
  keyTipsEmptySequence: props.texts.keyTipsEmptySequence || defaultRibbonTexts.keyTipsEmptySequence,
  contextualTabDefaultTitle: props.texts.contextualTabDefaultTitle || defaultRibbonTexts.contextualTabDefaultTitle,
  galleryPreviewFallback: props.texts.galleryPreviewFallback || defaultRibbonTexts.galleryPreviewFallback,
}))
const minimizeButtonIcon = computed(() => (context.minimized.value ? ArrowUpBold : ArrowDownBold))

const classicInlineGroups = computed(() =>
  visibleGroups.value.filter((group) => !hiddenGroupIds.value.has(group.id)),
)
const classicOverflowGroups = computed(() =>
  visibleGroups.value.filter((group) => hiddenGroupIds.value.has(group.id)),
)
const classicOverflowPopoverWidth = computed(() => {
  if (!classicOverflowGroups.value.length) return 220

  const widestGroupWidth = classicOverflowGroups.value.reduce((max, group) => {
    const width = measuredGroupWidths.value[group.id] ?? estimateGroupWidth(group)
    return Math.max(max, width)
  }, 0)

  // Account for popover/container paddings so group content is not clipped.
  const calculated = Math.ceil(widestGroupWidth + 40)
  return Math.max(220, Math.min(720, calculated))
})

/**
 * Builds simplified-mode popup content from a group.
 * @param group Source group model.
 * @returns Flattened group with medium-sized row items.
 */
function toSimplifiedPanelGroup(group: RibbonGroupModel): RibbonGroupModel {
  const items = (group.collections ?? []).flatMap((collection) =>
    (collection.items ?? []).map((item) => ({
      ...cloneItem(item),
      size: 'medium' as const,
    })),
  )

  return {
    ...group,
    orientation: 'row',
    collections: [
      {
        id: `${group.id}-simplified`,
        layout: 'row',
        items,
      },
    ],
  }
}

/**
 * Returns overflow priority for a group.
 * @param group Group model.
 * @returns Priority where larger values are removed earlier.
 */
function getGroupPriority(group: RibbonGroupModel): number {
  return group.priority ?? 100
}

/**
 * Estimates fallback width for a group when runtime measurement is unavailable.
 * @param group Group model.
 * @returns Estimated width in pixels.
 */
function estimateGroupWidth(group: RibbonGroupModel): number {
  if (group.autoWidth !== false) return 140
  return 190
}

/**
 * Measures rendered group widths from current classic panel DOM.
 * @param panel Classic ribbon panel element.
 * @returns Width map keyed by group id.
 */
function collectRenderedGroupWidths(panel: HTMLElement): Record<string, number> {
  const widths: Record<string, number> = {}
  const nodes = panel.querySelectorAll<HTMLElement>('.ml-ribbon-group')
  nodes.forEach((node) => {
    const groupId = node.dataset.groupId
    if (!groupId) return
    const measured = node.getBoundingClientRect().width
    if (measured > 0) widths[groupId] = measured
  })
  return widths
}

const DEFAULT_CLASSIC_OVERFLOW_SLOT_WIDTH = 40

/**
 * Reads classic overflow slot width from CSS custom property.
 * @param panel Classic ribbon panel element.
 * @returns Overflow slot width in pixels.
 */
function resolveClassicOverflowSlotWidth(panel: HTMLElement): number {
  const cssWidth = Number.parseFloat(getComputedStyle(panel).getPropertyValue('--ml-rb-overflow-slot-width'))
  if (Number.isFinite(cssWidth) && cssWidth > 0) return cssWidth
  return DEFAULT_CLASSIC_OVERFLOW_SLOT_WIDTH
}

/**
 * Recomputes which groups should move into classic overflow.
 */
function recomputeClassicOverflow() {
  if (context.layout.value !== 'classic') {
    hiddenGroupIds.value = new Set()
    return
  }
  const panel = classicPanelRef.value
  if (!panel) return

  const groups = visibleGroups.value
  if (!groups.length) {
    hiddenGroupIds.value = new Set()
    return
  }

  const panelWidth = Math.round(panel.getBoundingClientRect().width)
  const overflowWidth = resolveClassicOverflowSlotWidth(panel)
  const renderedWidths = collectRenderedGroupWidths(panel)
  measuredGroupWidths.value = {
    ...measuredGroupWidths.value,
    ...renderedWidths,
  }

  const fixedGroups = groups.filter((group) => group.enableGroupOverflow === false)
  const overflowableGroups = groups
    .filter((group) => group.enableGroupOverflow !== false)
    .map((group, index) => ({ group, index }))

  const hidden = new Set<string>()
  const removableOrder = [...overflowableGroups].sort((a, b) => {
    const p = getGroupPriority(b.group) - getGroupPriority(a.group)
    if (p !== 0) return p
    return b.index - a.index
  })

  const resolveGroupWidth = (group: RibbonGroupModel): number => renderedWidths[group.id] ?? estimateGroupWidth(group)

  const fixedWidth = fixedGroups.reduce((sum, group) => sum + resolveGroupWidth(group), 0)
  const visibleOverflowableWidth = (hidden: Set<string>) =>
    overflowableGroups
      .filter(({ group }) => !hidden.has(group.id))
      .reduce((sum, { group }) => sum + resolveGroupWidth(group), 0)

  const requiredWidth = (hidden: Set<string>) =>
    fixedWidth + visibleOverflowableWidth(hidden) + (hidden.size > 0 ? overflowWidth : 0)

  let hiddenCount = 0
  while (requiredWidth(hidden) > panelWidth && hiddenCount < removableOrder.length) {
    const nextGroup = removableOrder[hiddenCount].group
    hidden.add(nextGroup.id)
    hiddenCount += 1
  }

  hiddenGroupIds.value = hidden
}

/**
 * Schedules classic overflow recomputation after DOM/layout settles.
 */
function scheduleClassicOverflowRecompute() {
  nextTick(() => {
    if (context.layout.value !== 'classic' || context.minimized.value) {
      recomputeClassicOverflow()
      return
    }
    if (hiddenGroupIds.value.size === 0) {
      recomputeClassicOverflow()
      return
    }
    hiddenGroupIds.value = new Set()
    nextTick(() => {
      recomputeClassicOverflow()
    })
  })
}

/**
 * Selects active tab.
 * @param tabId Tab id to activate.
 */
function onTabClick(tabId: string) {
  if (context.disabled.value) return
  context.activeTab.value = tabId
}

/**
 * Toggles ribbon layout between classic and simplified.
 */
function toggleLayout() {
  if (context.disabled.value) return
  context.api.toggleSimplified()
}

/**
 * Toggles ribbon minimize state.
 */
function toggleMinimize() {
  if (context.disabled.value) return
  context.minimized.value = !context.minimized.value
}

/**
 * Forwards file menu selection event.
 * @param id Selected file menu command id.
 */
function onFileMenuSelect(id: string) {
  if (context.disabled.value) return
  emit('fileMenuSelect', id)
}

/**
 * Opens backstage panel when the ribbon is interactive.
 */
function openBackstage() {
  if (context.disabled.value) return
  context.backdropOpen.value = true
}

/**
 * Closes backstage panel.
 */
function closeBackstage() {
  if (context.disabled.value) return
  context.backdropOpen.value = false
}

/**
 * Emits normalized item click payload with active tab context.
 * @param groupId Source group id.
 * @param itemId Source item id.
 */
function onItemClick(groupId: string, itemId: string) {
  if (context.disabled.value) return
  emit('itemClick', { tabId: context.activeTab.value, groupId, itemId })
}

/**
 * Returns true when keyboard event target is an editable text context.
 * @param target Event target.
 * @returns Whether keyboard shortcuts should be ignored.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tagName = target.tagName
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT'
}

/**
 * Builds key-tip models for the active tab from visible, enabled items.
 */
function syncActiveTabKeyTips() {
  if (context.disabled.value) {
    context.keyTips.value = []
    return
  }
  const tab = activeTabModel.value
  if (!tab?.groups?.length) {
    context.keyTips.value = []
    return
  }

  const tips = tab.groups
    .filter((group) => group.visible !== false)
    .flatMap((group) =>
      (group.collections ?? []).flatMap((collection) =>
        collection.items
          .filter((item) => item.keyTip && item.disabled !== true)
          .map((item) => {
            const key = item.keyTip?.trim().toUpperCase()
            if (!key) return null
            return {
              id: `${tab.id}:${group.id}:${item.id}`,
              key,
              targetId: item.id,
              sequence: key.split(''),
              scope: 'item' as const,
            }
          })
          .filter((tip): tip is NonNullable<typeof tip> => Boolean(tip)),
      ),
    )

  context.keyTips.value = tips
}

/**
 * Resolves and emits the item click for a key-tip target id.
 * @param tip Matched key-tip model.
 */
function onKeyTipActivate(tip: { targetId: string }) {
  if (context.disabled.value) return
  const tab = activeTabModel.value
  if (!tab?.groups?.length) return
  for (const group of tab.groups) {
    if (group.visible === false) continue
    for (const collection of group.collections ?? []) {
      const item = collection.items.find((x) => x.id === tip.targetId && x.disabled !== true)
      if (!item) continue
      onItemClick(group.id, item.id)
      context.keyTipsOpen.value = false
      context.keyTipsSequence.value = ''
      return
    }
  }
}

/**
 * Resets key tip matching input sequence.
 */
function resetKeyTipsSequence() {
  context.keyTipsSequence.value = ''
}

/**
 * Handles global key-tip toggle behavior (Alt to open/close).
 * @param event Window keyboard event.
 */
function onWindowKeydown(event: KeyboardEvent) {
  if (context.disabled.value) return
  if (isEditableTarget(event.target)) return
  if (event.altKey && !event.ctrlKey && !event.metaKey && event.key === 'Alt') {
    event.preventDefault()
    context.keyTipsOpen.value = !context.keyTipsOpen.value
    if (!context.keyTipsOpen.value) resetKeyTipsSequence()
    return
  }
  if (!context.keyTipsOpen.value) return
  if (event.altKey || event.ctrlKey || event.metaKey) return

  if (event.key === 'Escape') {
    event.preventDefault()
    context.keyTipsOpen.value = false
    resetKeyTipsSequence()
    return
  }
  if (event.key === 'Backspace') {
    event.preventDefault()
    context.keyTipsSequence.value = context.keyTipsSequence.value.slice(0, -1)
    return
  }
  if (/^[a-z0-9]$/i.test(event.key)) {
    event.preventDefault()
    const nextSequence = `${context.keyTipsSequence.value}${event.key.toUpperCase()}`
    context.keyTipsSequence.value = nextSequence

    const normalizedSequence = nextSequence.toLowerCase()
    const exactMatch = context.keyTips.value.find((tip) => tip.key.toLowerCase() === normalizedSequence)
    if (exactMatch) {
      onKeyTipActivate(exactMatch)
      return
    }

    const hasPrefixMatches = context.keyTips.value.some((tip) => tip.key.toLowerCase().startsWith(normalizedSequence))
    if (!hasPrefixMatches) resetKeyTipsSequence()
  }
}

/**
 * Resolves display icon for simplified group trigger.
 * @param group Group model.
 * @returns Vue icon component or `null`.
 */
function resolveGroupIcon(group: RibbonGroupModel): Component | null {
  if (group.icon && typeof group.icon !== 'string') return group.icon
  if (group.groupIconCss) return Grid
  return null
}

watch([visibleGroups, () => context.layout.value, () => context.minimized.value], () => {
  scheduleClassicOverflowRecompute()
})
watch(
  [activeTabModel, () => context.tabs.value, () => context.disabled.value],
  () => {
    syncActiveTabKeyTips()
    resetKeyTipsSequence()
  },
  { deep: true, immediate: true },
)

watch(
  () => context.keyTipsOpen.value,
  (open) => {
    if (!open) resetKeyTipsSequence()
  },
)
watch(
  () => context.disabled.value,
  (disabled) => {
    if (!disabled) return
    context.overflowOpen.value = false
    context.backdropOpen.value = false
    context.keyTipsOpen.value = false
    resetKeyTipsSequence()
  },
)
watch(
  classicPanelRef,
  (panel, previous) => {
    if (previous && resizeObserver) resizeObserver.unobserve(previous)
    if (panel && resizeObserver) resizeObserver.observe(panel)
  },
  { flush: 'post' },
)

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  window.addEventListener('keydown', onWindowKeydown)
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      scheduleClassicOverflowRecompute()
    })
    if (classicPanelRef.value) resizeObserver.observe(classicPanelRef.value)
  }
  scheduleClassicOverflowRecompute()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onWindowKeydown)
  resizeObserver?.disconnect()
})

defineExpose<RibbonDynamicApi>(context.api)
</script>

<template>
  <ElConfigProvider :size="props.size">
    <section
      :key="context.disabled.value ? 'ml-ribbon-disabled' : 'ml-ribbon-enabled'"
      class="ml-ribbon"
      :inert="context.disabled.value"
      :aria-disabled="context.disabled.value"
      :class="[
        `ml-ribbon--${context.layout.value}`,
        `ml-ribbon--size-${resolvedRibbonSize}`,
        {
          'ml-ribbon--disabled': context.disabled.value,
          'ml-ribbon--minimized': context.minimized.value,
          'ml-ribbon--keytips-open': context.keyTipsOpen.value,
        },
      ]"
    >
      <header class="ml-ribbon__header">
        <div class="ml-ribbon__head-left">
          <MlRibbonFileMenu
            v-if="showFileMenu"
            :items="fileMenuItems"
            :disabled="context.disabled.value"
            :label="ribbonTexts.fileMenuLabel"
            :open-backstage-label="ribbonTexts.fileMenuOpenBackstageLabel"
            :show-open-backstage="showOpenBackstage"
            @select="onFileMenuSelect"
            @open-backstage="openBackstage"
          />
          <MlRibbonContextualTabs
            :tabs="visibleTabs"
            :active-tab="context.activeTab.value"
            :disabled="context.disabled.value"
            :default-contextual-title="ribbonTexts.contextualTabDefaultTitle"
            @select="onTabClick"
          />
          <ElTooltip v-if="!props.hideMinimizeButton" :content="ribbonTexts.minimizeTooltip">
            <ElButton
              :class="[
                'ml-ribbon__control',
                'ml-ribbon__control--minimize',
                context.minimized.value ? 'ml-ribbon__control--minimize-up' : 'ml-ribbon__control--minimize-down',
              ]"
              :icon="minimizeButtonIcon"
              :disabled="context.disabled.value"
              @click="toggleMinimize"
            />
          </ElTooltip>
        </div>
        <div class="ml-ribbon__head-right">
          <ElTooltip v-if="!props.hideLayoutSwitcher" :content="ribbonTexts.layoutSwitcherTooltip">
            <ElButton
              circle
              class="ml-ribbon__control ml-ribbon__control--layout"
              :icon="Menu"
              :disabled="context.disabled.value"
              @click="toggleLayout"
            />
          </ElTooltip>
          <ElSwitch
            v-if="!props.hideKeyTipsToggle"
            inline-prompt
            class="ml-ribbon__control ml-ribbon__control--keytips"
            :active-text="ribbonTexts.keyTipsToggleText"
            :inactive-text="ribbonTexts.keyTipsToggleText"
            :model-value="context.keyTipsOpen.value"
            :disabled="context.disabled.value"
            @change="context.keyTipsOpen.value = !context.keyTipsOpen.value"
          />
          <div v-if="$slots['tabs-extra']" class="ml-ribbon__tabs-extra">
            <slot
              name="tabs-extra"
              :active-tab="context.activeTab.value"
              :layout="context.layout.value"
              :minimized="context.minimized.value"
              :disabled="context.disabled.value"
            />
          </div>
        </div>
      </header>

      <main
        v-if="!context.minimized.value && activeTabModel && context.layout.value === 'classic'"
        class="ml-ribbon__panel"
        :data-active-tab="activeTabModel.id"
        ref="classicPanelRef"
      >
        <MlRibbonGroup
          v-for="group in classicInlineGroups"
          :id="group.id"
          :key="group.id"
          :data-group-id="group.id"
          :title="group.title"
          :icon="group.icon"
          :group-icon-css="group.groupIconCss"
          :orientation="group.orientation"
          :auto-width="group.autoWidth"
          :priority="group.priority ?? 100"
          :launcher="group.launcher"
          :show-launcher-icon="group.showLauncherIcon"
          :group-model="group"
          :overflow-trigger-aria-label="ribbonTexts.groupOverflowTriggerAriaLabel"
          :gallery-preview-fallback="ribbonTexts.galleryPreviewFallback"
          @item-click="onItemClick($event.groupId, $event.itemId)"
        >
          <MlRibbonGroupContent
            :group="group"
            :gallery-preview-fallback="ribbonTexts.galleryPreviewFallback"
            @item-click="onItemClick($event.groupId, $event.itemId)"
          />
        </MlRibbonGroup>

        <section v-if="classicOverflowGroups.length" class="ml-ribbon-group ml-ribbon-group--overflow">
          <div class="ml-ribbon-group__body ml-ribbon-group__body--overflow">
            <ElPopover
              trigger="click"
              placement="bottom-end"
              :width="classicOverflowPopoverWidth"
              :disabled="context.disabled.value"
              :popper-class="classicOverflowPopoverClass"
              @show="context.overflowOpen.value = true"
              @hide="context.overflowOpen.value = false"
            >
              <template #reference>
                <button
                  type="button"
                  class="ml-ribbon-overflow-trigger"
                  :aria-label="ribbonTexts.overflowTriggerAriaLabel"
                  :disabled="context.disabled.value"
                >
                  <span class="ml-ribbon-overflow-trigger__dots">...</span>
                </button>
              </template>
              <div class="ml-ribbon-overflow-list">
                <section v-for="group in classicOverflowGroups" :key="group.id" class="ml-ribbon-overflow-group">
                  <header class="ml-ribbon-overflow-group__header">{{ group.title }}</header>
                  <MlRibbonGroupContent
                    :group="group"
                    :gallery-preview-fallback="ribbonTexts.galleryPreviewFallback"
                    @item-click="onItemClick($event.groupId, $event.itemId)"
                  />
                </section>
              </div>
            </ElPopover>
          </div>
          <footer class="ml-ribbon-group__footer ml-ribbon-group__footer--overflow" />
        </section>
      </main>

      <main
        v-if="!context.minimized.value && activeTabModel && context.layout.value === 'simplified'"
        class="ml-ribbon__panel ml-ribbon__panel--simplified"
        :data-active-tab="activeTabModel.id"
      >
        <ElPopover
          v-for="group in visibleGroups"
          :key="group.id"
          trigger="click"
          placement="bottom-start"
          :width="340"
          :disabled="context.disabled.value"
          :popper-class="simplifiedGroupPopoverClass"
        >
          <template #reference>
            <button class="ml-ribbon-simplified-group" type="button" :disabled="context.disabled.value">
              <ElIcon v-if="resolveGroupIcon(group)" class="ml-ribbon-simplified-group__icon">
                <component :is="resolveGroupIcon(group)" />
              </ElIcon>
              <span>{{ group.title }}</span>
            </button>
          </template>
          <div class="ml-ribbon-simplified-group__panel">
            <MlRibbonGroupContent
              :group="toSimplifiedPanelGroup(group)"
              :gallery-preview-fallback="ribbonTexts.galleryPreviewFallback"
              @item-click="onItemClick($event.groupId, $event.itemId)"
            />
          </div>
        </ElPopover>
      </main>

      <MlRibbonBackstage
        :open="context.backdropOpen.value"
        :size="resolvedRibbonSize"
        :back-label="ribbonTexts.backstageBackLabel"
        :title="ribbonTexts.backstageTitle"
        :description="ribbonTexts.backstageDescription"
        @close="closeBackstage"
      >
        <template v-if="$slots.backstage" #default>
          <slot
            name="backstage"
            :close="closeBackstage"
            :open="context.backdropOpen.value"
            :size="resolvedRibbonSize"
            :back-label="ribbonTexts.backstageBackLabel"
            :title="ribbonTexts.backstageTitle"
            :description="ribbonTexts.backstageDescription"
            :disabled="context.disabled.value"
          />
        </template>
      </MlRibbonBackstage>
    </section>
  </ElConfigProvider>
</template>
