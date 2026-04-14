<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElDropdown, ElDropdownItem, ElDropdownMenu, useGlobalConfig } from 'element-plus'

/**
 * @component MlRibbonFileMenu
 * @description
 * File menu tab entry that opens a dropdown list with quick commands and a
 * dedicated action to open the backstage view.
 *
 * @prop items - File menu command list.
 * @prop label - File tab label text.
 * @prop openBackstageLabel - Label for the backstage opener row.
 * @prop showOpenBackstage - Whether to show the backstage opener row.
 *
 * @event select - Emitted when a regular file menu command is selected.
 * @event open-backstage - Emitted when the backstage command is selected.
 *
 * @example
 * ```vue
 * <MlRibbonFileMenu
 *   :items="[{ id: 'new', label: 'New' }, { id: 'open', label: 'Open' }]"
 *   label="File"
 *   open-backstage-label="Open Backstage"
 *   @select="onFileCommand"
 *   @open-backstage="showBackstage = true"
 * />
 * ```
 */
defineProps<{
  items: { id: string; label: string; disabled?: boolean }[]
  label?: string
  openBackstageLabel?: string
  showOpenBackstage?: boolean
}>()
const emit = defineEmits<{ (e: 'select', id: string): void; (e: 'open-backstage'): void }>()
const opened = ref(false)
const globalSize = useGlobalConfig('size', '')
const resolvedSize = computed(() => globalSize.value || 'default')
const popperClass = computed(() => `ml-ribbon-file-menu-dropdown ml-ribbon-popper ml-ribbon-popper--size-${resolvedSize.value}`)

/**
 * Tracks dropdown visibility to style the File tab active state.
 * @param value Current dropdown open state.
 */
function onVisibleChange(value: boolean) {
  opened.value = value
}

/**
 * Routes dropdown command either to backstage action or standard file command.
 * @param value Dropdown command id.
 */
function onCommand(value: string) {
  if (value === '__backstage') {
    emit('open-backstage')
    return
  }
  emit('select', value)
}
</script>

<template>
  <ElDropdown
    trigger="click"
    :popper-class="popperClass"
    @command="onCommand"
    @visible-change="onVisibleChange"
  >
    <button type="button" class="ml-ribbon-tab ml-ribbon-tab--file" :class="{ 'is-active': opened }">
      {{ label }}
    </button>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem v-if="showOpenBackstage !== false" command="__backstage">
          {{ openBackstageLabel }}
        </ElDropdownItem>
        <ElDropdownItem
          v-for="(item, index) in items"
          :key="item.id"
          :divided="showOpenBackstage !== false && index === 0"
          :command="item.id"
          :disabled="item.disabled"
        >
          {{ item.label }}
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>


