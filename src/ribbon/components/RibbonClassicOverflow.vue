<script setup lang="ts">
import { ElPopover } from 'element-plus'
import { ref } from 'vue'
import type { RibbonGroupModel } from '../types'
import MlRibbonGroupContent from './RibbonGroupContent.vue'

const props = defineProps<{
  groups: RibbonGroupModel[]
  popoverClass: string
  popoverWidth: number
  triggerAriaLabel: string
  galleryPreviewFallback: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  open: []
  close: []
  itemClick: [payload: { groupId: string; itemId: string }]
}>()

const isOpen = ref(false)

/**
 * Toggles the classic overflow popover from the trigger button.
 */
function toggleOpen() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

/**
 * Forwards item activation from a classic overflow flyout and closes the popover.
 * @param payload Bubbled item activation payload.
 * @param hide Optional popover hide helper from ElPopover default slot.
 */
function onItemClick(
  payload: { groupId: string; itemId: string },
  hide?: () => void,
) {
  hide?.()
  isOpen.value = false
  emit('itemClick', payload)
}
</script>

<template>
  <ElPopover
    v-model:visible="isOpen"
    :trigger="[]"
    placement="bottom-end"
    :width="popoverWidth"
    :disabled="disabled"
    :show-arrow="false"
    :teleported="true"
    :popper-options="{ strategy: 'fixed' }"
    :popper-class="popoverClass"
    @show="emit('open')"
    @hide="emit('close')"
  >
    <template #reference>
      <button
        type="button"
        class="ml-ribbon-overflow-trigger"
        :aria-label="triggerAriaLabel"
        :disabled="disabled"
        @click="toggleOpen"
      >
        <span class="ml-ribbon-overflow-trigger__dots">...</span>
      </button>
    </template>

    <!--
      Office / AutoCAD: each overflowed group is shown as its largest classic
      variant (horizontal panel + footer title), stacked so every control stays
      fully visible instead of being reflowed into a clipped card.
    -->
    <template #default="{ hide }">
      <div class="ml-ribbon-overflow-list">
        <section
          v-for="group in groups"
          :key="group.id"
          class="ml-ribbon-overflow-group-flyout"
        >
          <MlRibbonGroupContent
            :group="group"
            :gallery-preview-fallback="galleryPreviewFallback"
            :disabled="disabled"
            @item-click="onItemClick($event, hide)"
          />
          <footer class="ml-ribbon-overflow-group-flyout__footer">
            {{ group.title }}
          </footer>
        </section>
      </div>
    </template>
  </ElPopover>
</template>
