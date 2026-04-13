import { computed, markRaw, ref, toRaw } from 'vue'
import type { ComputedRef } from 'vue'
import type {
  KeyTipModel,
  RibbonContextValue,
  RibbonDynamicApi,
  RibbonGroupModel,
  RibbonItemModel,
  RibbonLayout,
  RibbonTabModel,
} from '../types'

interface UseRibbonStateResult {
  context: RibbonContextValue
  visibleTabs: ComputedRef<RibbonTabModel[]>
}

/**
 * Normalizes potential component definitions to non-reactive objects.
 * @param value Unknown schema value that may contain a component.
 * @returns Normalized value safe for reactive storage.
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
    collections: group.collections?.map((collection) => ({
      ...collection,
      items: collection.items.map(cloneItem),
    })),
  }
}

/**
 * Clones a ribbon tab recursively.
 * @param tab Source tab model.
 * @returns Cloned tab model.
 */
function cloneTab(tab: RibbonTabModel): RibbonTabModel {
  return {
    ...tab,
    groups: tab.groups?.map(cloneGroup),
  }
}

/**
 * Clones a tab array for mutable runtime state.
 * @param tabs Source tab list.
 * @returns Cloned tab list.
 */
function cloneTabs(tabs: RibbonTabModel[]): RibbonTabModel[] {
  return tabs.map(cloneTab)
}

/**
 * Ensures group has at least one collection for item insertion.
 * @param group Group model that may miss collections.
 */
function ensureCollections(group: RibbonGroupModel) {
  if (!group.collections || group.collections.length === 0) {
    group.collections = [{ id: `${group.id}-collection-1`, items: [] }]
  }
}

/**
 * Locates a target item list and applies a mutation callback.
 * @param tabs Current mutable tabs tree.
 * @param tabId Target tab id.
 * @param groupId Target group id.
 * @param collectionId Target collection id.
 * @param fn Mutation callback for collection items.
 */
function mutateItem(
  tabs: RibbonTabModel[],
  tabId: string,
  groupId: string,
  collectionId: string,
  fn: (items: RibbonItemModel[]) => void,
) {
  const tab = tabs.find((x) => x.id === tabId)
  if (!tab?.groups) return
  const group = tab.groups.find((x) => x.id === groupId)
  if (!group?.collections) return
  const collection = group.collections.find((x) => x.id === collectionId)
  if (!collection) return
  fn(collection.items)
}

/**
 * Creates the ribbon runtime state container and dynamic mutation API.
 * @param ribbonId Ribbon instance id.
 * @param initialTabs Initial tab schema.
 * @param initialLayout Initial layout mode.
 * @param initialMinimized Initial minimized state.
 * @param initialActiveTab Initial active tab id.
 * @returns Ribbon context plus computed visible tabs.
 */
export function useRibbonState(
  ribbonId: string,
  initialTabs: RibbonTabModel[],
  initialLayout: RibbonLayout,
  initialMinimized: boolean,
  initialActiveTab: string,
): UseRibbonStateResult {
  const layout = ref<RibbonLayout>(initialLayout)
  const minimized = ref(initialMinimized)
  const activeTab = ref(initialActiveTab)
  const tabs = ref<RibbonTabModel[]>(cloneTabs(initialTabs))
  const overflowOpen = ref(false)
  const backdropOpen = ref(false)
  const keyTipsOpen = ref(false)
  const keyTips = ref<KeyTipModel[]>([])
  const keyTipsSequence = ref('')

  const visibleTabs = computed(() => tabs.value.filter((tab) => tab.visible !== false))

  const api: RibbonDynamicApi = {
    addTab(tab) {
      tabs.value.push(cloneTab(tab))
      if (!activeTab.value) activeTab.value = tab.id
    },
    removeTab(tabId) {
      tabs.value = tabs.value.filter((tab) => tab.id !== tabId)
      if (activeTab.value === tabId) {
        activeTab.value = visibleTabs.value[0]?.id ?? ''
      }
    },
    showTab(tabId) {
      const tab = tabs.value.find((x) => x.id === tabId)
      if (tab) tab.visible = true
    },
    hideTab(tabId) {
      const tab = tabs.value.find((x) => x.id === tabId)
      if (tab) tab.visible = false
    },
    selectTab(tabId) {
      activeTab.value = tabId
    },
    addGroup(tabId, group) {
      const tab = tabs.value.find((x) => x.id === tabId)
      if (!tab) return
      tab.groups ??= []
      ensureCollections(group)
      tab.groups.push(cloneGroup(group))
    },
    removeGroup(tabId, groupId) {
      const tab = tabs.value.find((x) => x.id === tabId)
      if (!tab?.groups) return
      tab.groups = tab.groups.filter((group) => group.id !== groupId)
    },
    showGroup(tabId, groupId) {
      const tab = tabs.value.find((x) => x.id === tabId)
      const group = tab?.groups?.find((x) => x.id === groupId)
      if (group) group.visible = true
    },
    hideGroup(tabId, groupId) {
      const tab = tabs.value.find((x) => x.id === tabId)
      const group = tab?.groups?.find((x) => x.id === groupId)
      if (group) group.visible = false
    },
    addItem(tabId, groupId, collectionId, item) {
      mutateItem(tabs.value, tabId, groupId, collectionId, (items) => items.push(cloneItem(item)))
    },
    removeItem(tabId, groupId, collectionId, itemId) {
      mutateItem(tabs.value, tabId, groupId, collectionId, (items) => {
        const index = items.findIndex((x) => x.id === itemId)
        if (index >= 0) items.splice(index, 1)
      })
    },
    updateItem(tabId, groupId, collectionId, itemId, patch) {
      mutateItem(tabs.value, tabId, groupId, collectionId, (items) => {
        const item = items.find((x) => x.id === itemId)
        if (item) Object.assign(item, patch)
      })
    },
    enableItem(tabId, groupId, collectionId, itemId) {
      api.updateItem(tabId, groupId, collectionId, itemId, { disabled: false })
    },
    disableItem(tabId, groupId, collectionId, itemId) {
      api.updateItem(tabId, groupId, collectionId, itemId, { disabled: true })
    },
    refreshLayout() {
      overflowOpen.value = false
    },
    minimize(value) {
      minimized.value = value
    },
    toggleSimplified() {
      layout.value = layout.value === 'classic' ? 'simplified' : 'classic'
    },
  }

  /**
   * Registers a key tip if it is not already present.
   * @param tip Key tip model.
   */
  const registerKeyTip = (tip: KeyTipModel) => {
    if (keyTips.value.some((x) => x.id === tip.id)) return
    keyTips.value.push(tip)
  }

  /**
   * Unregisters a key tip by id.
   * @param id Key tip id.
   */
  const unregisterKeyTip = (id: string) => {
    keyTips.value = keyTips.value.filter((x) => x.id !== id)
  }

  const context: RibbonContextValue = {
    id: ribbonId,
    layout,
    minimized,
    activeTab,
    tabs,
    overflowOpen,
    backdropOpen,
    keyTipsOpen,
    keyTips,
    keyTipsSequence,
    registerKeyTip,
    unregisterKeyTip,
    api,
  }

  return { context, visibleTabs }
}
