import type { Component } from 'vue'
import type { ComponentSize } from 'element-plus'

export type RibbonLayout = 'classic' | 'simplified'
export type RibbonItemSize = 'large' | 'medium' | 'small'
export type RibbonCollectionLayout = 'row' | 'column'
export type RibbonGroupOrientation = 'row' | 'column'
export type RibbonComponentSize = ComponentSize

export type RibbonItemType =
  | 'button'
  | 'toggle'
  | 'segmented'
  | 'dropdown'
  | 'splitButton'
  | 'buttonGroup'
  | 'checkbox'
  | 'colorPicker'
  | 'comboBox'
  | 'gallery'
  | 'custom'
  | 'template'

export interface KeyTipModel {
  id: string
  key: string
  targetId: string
  sequence?: string[]
  scope?: 'tab' | 'group' | 'item' | 'global'
}

export interface FileMenuItemModel {
  id: string
  label: string
  disabled?: boolean
}

export interface RibbonLocaleTexts {
  layoutSwitcherTooltip?: string
  minimizeTooltip?: string
  keyTipsToggleText?: string
  overflowTriggerAriaLabel?: string
  groupOverflowTriggerAriaLabel?: string
  fileMenuLabel?: string
  fileMenuOpenBackstageLabel?: string
  backstageBackLabel?: string
  backstageTitle?: string
  backstageDescription?: string
  keyTipsSequencePrefix?: string
  keyTipsEmptySequence?: string
  contextualTabDefaultTitle?: string
  galleryPreviewFallback?: string
}

export interface RibbonItemModel {
  id: string
  type: RibbonItemType
  label?: string
  hideLabel?: boolean
  icon?: string | Component
  disabled?: boolean
  size?: RibbonItemSize
  keyTip?: string
  props?: Record<string, unknown>
}

export interface RibbonCustomItemBindings {
  item: RibbonItemModel
  groupId: string
  disabled: boolean
  emitItemClick: (payload?: string | number | boolean) => void
}

export interface RibbonCollectionModel {
  id: string
  items: RibbonItemModel[]
  layout?: RibbonCollectionLayout
  rows?: number
}

export interface RibbonGroupModel {
  id: string
  title: string
  icon?: string | Component
  groupIconCss?: string
  orientation?: RibbonGroupOrientation
  enableGroupOverflow?: boolean
  autoWidth?: boolean
  priority?: number
  visible?: boolean
  launcher?: boolean
  showLauncherIcon?: boolean
  footerMenuItems?: RibbonItemModel[]
  collections?: RibbonCollectionModel[]
}

export interface RibbonTabModel {
  id: string
  title: string
  visible?: boolean
  contextual?: boolean
  contextualColor?: string
  contextualTitle?: string
  groups?: RibbonGroupModel[]
}

export interface RibbonDynamicApi {
  /** Adds a new tab to the ribbon. */
  addTab: (tab: RibbonTabModel) => void
  /** Removes a tab by id. */
  removeTab: (tabId: string) => void
  /** Marks a tab as visible. */
  showTab: (tabId: string) => void
  /** Marks a tab as hidden. */
  hideTab: (tabId: string) => void
  /** Sets the active tab id. */
  selectTab: (tabId: string) => void
  /** Adds a group to a tab. */
  addGroup: (tabId: string, group: RibbonGroupModel) => void
  /** Removes a group from a tab by group id. */
  removeGroup: (tabId: string, groupId: string) => void
  /** Marks a group as visible. */
  showGroup: (tabId: string, groupId: string) => void
  /** Marks a group as hidden. */
  hideGroup: (tabId: string, groupId: string) => void
  /** Adds an item to a target collection. */
  addItem: (tabId: string, groupId: string, collectionId: string, item: RibbonItemModel) => void
  /** Removes an item from a target collection by id. */
  removeItem: (tabId: string, groupId: string, collectionId: string, itemId: string) => void
  /** Applies a partial patch to an existing item. */
  updateItem: (
    tabId: string,
    groupId: string,
    collectionId: string,
    itemId: string,
    patch: Partial<RibbonItemModel>,
  ) => void
  /** Enables a target item. */
  enableItem: (tabId: string, groupId: string, collectionId: string, itemId: string) => void
  /** Disables a target item. */
  disableItem: (tabId: string, groupId: string, collectionId: string, itemId: string) => void
  /** Requests a layout refresh pass. */
  refreshLayout: () => void
  /** Sets minimized state explicitly. */
  minimize: (value: boolean) => void
  /** Toggles between classic and simplified layouts. */
  toggleSimplified: () => void
}

export interface RibbonContextValue {
  id: string
  disabled: import('vue').Ref<boolean>
  layout: import('vue').Ref<RibbonLayout>
  minimized: import('vue').Ref<boolean>
  activeTab: import('vue').Ref<string>
  tabs: import('vue').Ref<RibbonTabModel[]>
  overflowOpen: import('vue').Ref<boolean>
  backdropOpen: import('vue').Ref<boolean>
  keyTipsOpen: import('vue').Ref<boolean>
  keyTips: import('vue').Ref<KeyTipModel[]>
  keyTipsSequence: import('vue').Ref<string>
  /** Registers a key tip for the current ribbon scope. */
  registerKeyTip: (tip: KeyTipModel) => void
  /** Unregisters a key tip by id. */
  unregisterKeyTip: (id: string) => void
  api: RibbonDynamicApi
}
