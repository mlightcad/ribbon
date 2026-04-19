<script setup lang="ts">
import { computed } from 'vue'

/**
 * @component MlRibbonTabs
 * @description
 * Renders the tab strip used by the ribbon header and emits selection changes.
 *
 * @prop tabs - Tab definitions to render. Tabs with `visible: false` are hidden.
 * @prop activeTab - Currently active tab id.
 *
 * @event select - Emitted when a tab is clicked. Payload is the selected tab id.
 *
 * @example
 * ```vue
 * <MlRibbonTabs
 *   :tabs="[{ id: 'home', title: 'Home' }, { id: 'insert', title: 'Insert' }]"
 *   active-tab="home"
 *   @select="onTabSelect"
 * />
 * ```
 */
const props = defineProps<{
  tabs: { id: string; title: string; visible?: boolean }[]
  activeTab: string
  disabled?: boolean
}>()

const emit = defineEmits<{ (e: 'select', payload: { id: string; triggerEl: HTMLElement | null }): void }>()
const visibleTabs = computed(() => props.tabs.filter((x) => x.visible !== false))

function onTabClick(id: string, event: MouseEvent) {
  emit('select', {
    id,
    triggerEl: event.currentTarget instanceof HTMLElement ? event.currentTarget : null,
  })
}
</script>

<template>
  <div class="ml-ribbon-tabs" role="tablist">
    <button
      v-for="tab in visibleTabs"
      :key="tab.id"
      type="button"
      class="ml-ribbon-tab"
      :class="{ 'is-active': activeTab === tab.id }"
      role="tab"
      :aria-selected="activeTab === tab.id"
      :disabled="props.disabled"
      @click="onTabClick(tab.id, $event)"
    >
      {{ tab.title }}
    </button>
  </div>
</template>
