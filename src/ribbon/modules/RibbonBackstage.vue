<script setup lang="ts">
import { ElButton, ElDrawer } from 'element-plus'
import type { ComponentSize } from 'element-plus'

/**
 * @component MlRibbonBackstage
 * @description
 * Full-screen backstage panel used for document-level tasks such as open, save,
 * export, and app settings.
 *
 * @prop open - Controls drawer visibility.
 * @prop backLabel - Label for the back/close button.
 * @prop title - Optional content title.
 * @prop description - Optional content description.
 *
 * @slot default - Optional fully custom backstage content. Receives
 * `{ close, backLabel, title, description, size }`.
 *
 * @event close - Emitted when user closes the backstage panel.
 *
 * @example
 * ```vue
 * <MlRibbonBackstage
 *   :open="backstageOpen"
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
    backLabel?: string
    title?: string
    description?: string
    size?: ComponentSize
  }>(),
  { size: 'default' },
)

const emit = defineEmits<{ (e: 'close'): void }>()

function closeBackstage() {
  emit('close')
}
</script>

<template>
  <ElDrawer
    :model-value="props.open"
    size="100%"
    :with-header="false"
    direction="ltr"
    @close="closeBackstage"
  >
    <div class="ml-ribbon-backstage" :class="`ml-ribbon-backstage--size-${props.size || 'default'}`">
      <slot
        v-if="$slots.default"
        :close="closeBackstage"
        :back-label="props.backLabel"
        :title="props.title"
        :description="props.description"
        :size="props.size"
      />
      <template v-else>
        <aside class="ml-ribbon-backstage__nav">
          <ElButton type="primary" @click="closeBackstage">{{ props.backLabel }}</ElButton>
        </aside>
        <section class="ml-ribbon-backstage__content">
          <h2 v-if="props.title">{{ props.title }}</h2>
          <p v-if="props.description">{{ props.description }}</p>
        </section>
      </template>
    </div>
  </ElDrawer>
</template>


