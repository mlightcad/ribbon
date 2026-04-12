<script setup lang="ts">
import { ElButton, ElDrawer, ElMenu, ElMenuItem } from 'element-plus'

/**
 * @component MlRibbonBackstage
 * @description
 * Full-screen backstage panel used for document-level tasks such as open, save,
 * export, and app settings.
 *
 * @prop open - Controls drawer visibility.
 * @prop items - Navigation entries shown on the left side.
 * @prop backLabel - Label for the back/close button.
 * @prop title - Optional content title.
 * @prop description - Optional content description.
 *
 * @event close - Emitted when user closes the backstage panel.
 *
 * @example
 * ```vue
 * <MlRibbonBackstage
 *   :open="backstageOpen"
 *   :items="backstageItems"
 *   back-label="Back"
 *   title="Backstage"
 *   description="Manage document-level actions."
 *   @close="backstageOpen = false"
 * />
 * ```
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    items: { id: string; label: string; description?: string }[]
    backLabel?: string
    title?: string
    description?: string
  }>(),
  { items: () => [] },
)

const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <ElDrawer
    :model-value="props.open"
    size="100%"
    :with-header="false"
    direction="ltr"
    @close="emit('close')"
  >
    <div class="ml-ribbon-backstage">
      <aside class="ml-ribbon-backstage__nav">
        <ElButton type="primary" @click="emit('close')">{{ props.backLabel }}</ElButton>
        <ElMenu default-active="" class="ml-ribbon-backstage__menu">
          <ElMenuItem v-for="item in props.items" :key="item.id" :index="item.id">
            {{ item.label }}
          </ElMenuItem>
        </ElMenu>
      </aside>
      <section class="ml-ribbon-backstage__content">
        <h2 v-if="props.title">{{ props.title }}</h2>
        <p v-if="props.description">{{ props.description }}</p>
      </section>
    </div>
  </ElDrawer>
</template>


