<script setup lang="ts">
/**
 * @component MlRibbonTab
 * @description
 * Declarative tab definition component. It is primarily used as a structural marker
 * and keeps tab metadata close to authored markup.
 *
 * @prop id - Unique tab identifier.
 * @prop title - Display title in the tab strip.
 * @prop visible - Controls tab visibility. Defaults to `true`.
 * @prop contextual - Marks the tab as contextual.
 * @prop contextualColor - Accent color used by contextual tab blocks.
 * @prop contextualTitle - Group label shown above contextual tabs.
 *
 * @slot default - Optional declarative content for custom tab authoring workflows.
 *
 * @example
 * ```vue
 * <MlRibbonTab
 *   id="chart-tools"
 *   title="Chart Design"
 *   contextual
 *   contextual-title="Chart Tools"
 *   contextual-color="#eebe77"
 * />
 * ```
 */
defineProps<{
  id: string
  title: string
  visible?: boolean
  contextual?: boolean
  contextualColor?: string
  contextualTitle?: string
}>()
</script>

<template>
  <div class="ml-ribbon-tab-definition" hidden>
    <slot />
  </div>
</template>


