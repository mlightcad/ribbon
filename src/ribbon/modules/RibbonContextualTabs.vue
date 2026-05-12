<script setup lang="ts">
import MlRibbonTabs from '../components/RibbonTabs.vue'

/**
 * @component MlRibbonContextualTabs
 * @description
 * Composite tab strip that renders regular tabs and contextual tab blocks with
 * accent colors and contextual section labels.
 *
 * @prop tabs - Full tab list (regular and contextual tabs).
 * @prop activeTab - Currently active tab id.
 *
 * @event select - Emitted when any tab is selected.
 *
 * @example
 * ```vue
 * <MlRibbonContextualTabs :tabs="tabs" :active-tab="activeTab" @select="activeTab = $event" />
 * ```
 */
const props = defineProps<{
  tabs: {
    id: string
    title: string
    contextual?: boolean
    contextualColor?: string
    contextualTitle?: string
    visible?: boolean
  }[]
  activeTab: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', payload: { id: string; triggerEl: HTMLElement | null }): void
}>()
</script>

<template>
  <div class="ml-ribbon-contextual-tabs">
    <div class="ml-ribbon-contextual-tabs__normal">
      <MlRibbonTabs
        :tabs="props.tabs.filter((x) => !x.contextual)"
        :active-tab="activeTab"
        :disabled="props.disabled"
        @select="emit('select', $event)"
      />
    </div>
    <div class="ml-ribbon-contextual-tabs__ctx">
      <section
        v-for="ctx in props.tabs.filter((x) => x.contextual)"
        :key="ctx.id"
        class="ml-ribbon-contextual-tabs__block"
        :style="{ '--ctx-color': ctx.contextualColor || '#67c23a' }"
      >
        <small v-if="ctx.contextualTitle?.trim()">{{
          ctx.contextualTitle.trim()
        }}</small>
        <MlRibbonTabs
          :tabs="[ctx]"
          :active-tab="activeTab"
          :disabled="props.disabled"
          @select="emit('select', $event)"
        />
      </section>
    </div>
  </div>
</template>
