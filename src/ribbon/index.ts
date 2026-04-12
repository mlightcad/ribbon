/**
 * @component MlRibbon
 * @description Root ribbon orchestrator component.
 * @example
 * ```vue
 * <MlRibbon :tabs="tabs" v-model:active-tab="activeTab" />
 * ```
 */
export { default as MlRibbon } from './components/Ribbon.vue'

/**
 * @component MlRibbonTabs
 * @description Basic tab strip renderer for ribbon headers.
 */
export { default as MlRibbonTabs } from './components/RibbonTabs.vue'

/**
 * @component MlRibbonTab
 * @description Declarative tab metadata component.
 */
export { default as MlRibbonTab } from './components/RibbonTab.vue'

/**
 * @component MlRibbonGroup
 * @description Group container with optional overflow handling.
 */
export { default as MlRibbonGroup } from './components/RibbonGroup.vue'

/**
 * @component MlRibbonCollection
 * @description Collection layout container inside a ribbon group.
 */
export { default as MlRibbonCollection } from './components/RibbonCollection.vue'

/**
 * @component MlRibbonItemHost
 * @description Type-driven ribbon item renderer.
 */
export { default as MlRibbonItemHost } from './components/RibbonItemHost.vue'

/**
 * @component MlRibbonGroupButton
 * @description Segmented group button ribbon item.
 */
export { default as MlRibbonGroupButton } from './items/RibbonGroupButton.vue'

/**
 * @component MlRibbonGallery
 * @description Categorized gallery selector ribbon item.
 */
export { default as MlRibbonGallery } from './items/RibbonGallery.vue'

/**
 * @component MlRibbonTemplateItem
 * @description Custom-template ribbon item wrapper.
 */
export { default as MlRibbonTemplateItem } from './items/RibbonTemplateItem.vue'

/**
 * @component MlRibbonFileMenu
 * @description File tab dropdown module.
 */
export { default as MlRibbonFileMenu } from './modules/RibbonFileMenu.vue'

/**
 * @component MlRibbonBackstage
 * @description Full-screen backstage drawer module.
 */
export { default as MlRibbonBackstage } from './modules/RibbonBackstage.vue'

/**
 * @component MlRibbonKeyTips
 * @description Keyboard key tips overlay module.
 */
export { default as MlRibbonKeyTips } from './modules/RibbonKeyTips.vue'

/**
 * @component MlRibbonContextualTabs
 * @description Context-aware tab strip module.
 */
export { default as MlRibbonContextualTabs } from './modules/RibbonContextualTabs.vue'

export type {
  RibbonLayout,
  RibbonItemSize,
  RibbonItemType,
  RibbonCollectionLayout,
  RibbonGroupOrientation,
  RibbonComponentSize,
  RibbonTabModel,
  RibbonGroupModel,
  RibbonCollectionModel,
  RibbonItemModel,
  RibbonDynamicApi,
  KeyTipModel,
  FileMenuItemModel,
  BackstageItemModel,
  RibbonLocaleTexts,
} from './types'
