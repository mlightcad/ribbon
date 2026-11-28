<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  useGlobalConfig,
} from 'element-plus'
import type { DropdownInstance } from 'element-plus'

import type { FileMenuItemModel } from '../types'
import RibbonFileMenuItem from './RibbonFileMenuItem.vue'

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
const props = defineProps<{
  items: FileMenuItemModel[]
  label?: string
  openBackstageLabel?: string
  showOpenBackstage?: boolean
  disabled?: boolean
}>()
const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'open-backstage'): void
}>()
const opened = ref(false)
const dropdownRef = ref<DropdownInstance>()
const globalSize = useGlobalConfig('size', '')
const resolvedSize = computed(() => globalSize.value || 'default')
const popperClass = computed(
  () =>
    `ml-ribbon-file-menu-dropdown ml-ribbon-popper ml-ribbon-popper--size-${resolvedSize.value}`,
)

/**
 * Tracks dropdown visibility to style the File tab active state.
 * @param value Current dropdown open state.
 */
function onVisibleChange(value: boolean) {
  opened.value = value
}

function closeMenu() {
  dropdownRef.value?.handleClose()
  opened.value = false
}

/**
 * Routes dropdown command either to backstage action or standard file command.
 * Ignores non-string values (Element Plus defaults unset `command` to `{}`).
 * Closes manually because `hide-on-click` is false so submenu parents can be
 * clicked without dismissing the File menu.
 * @param value Dropdown command id.
 */
function onCommand(value: unknown) {
  if (typeof value !== 'string') return
  if (value === '__backstage') {
    emit('open-backstage')
    closeMenu()
    return
  }
  emit('select', value)
  closeMenu()
}

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) closeMenu()
  },
)
</script>

<template>
  <ElDropdown
    ref="dropdownRef"
    trigger="click"
    :disabled="props.disabled"
    :hide-on-click="false"
    :popper-class="popperClass"
    @command="onCommand"
    @visible-change="onVisibleChange"
  >
    <button
      type="button"
      class="ml-ribbon-tab ml-ribbon-tab--file"
      :class="{ 'is-active': opened }"
      :disabled="props.disabled"
    >
      {{ props.label }}
    </button>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem
          v-if="props.showOpenBackstage !== false"
          command="__backstage"
        >
          {{ props.openBackstageLabel }}
        </ElDropdownItem>
        <RibbonFileMenuItem
          v-for="(item, index) in props.items"
          :key="item.id"
          :item="item"
          :divided="
            item.divided === true ||
            (props.showOpenBackstage !== false && index === 0)
          "
          :popper-class="popperClass"
          @select="onCommand"
        />
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>
