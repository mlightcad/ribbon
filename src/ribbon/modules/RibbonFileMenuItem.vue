<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'
import {
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElIcon,
} from 'element-plus'

import type { FileMenuItemModel } from '../types'

const props = defineProps<{
  item: FileMenuItemModel
  divided?: boolean
  popperClass: string
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const hasChildren = (item: FileMenuItemModel) =>
  Array.isArray(item.children) && item.children.length > 0

/**
 * Forwards leaf command ids only. Element Plus defaults `command` to `{}`
 * when unset; parent submenu rows must never emit that.
 */
function onCommand(value: unknown) {
  if (typeof value !== 'string') return
  emit('select', value)
}

/**
 * Parent submenu rows must not run ElDropdownItem's default click path:
 * without an explicit `command`, Element Plus emits `{}`. Combined with
 * `hide-on-click=false` on nested (and root) dropdowns, this keeps the
 * File menu open so the teleported hover submenu is not orphaned.
 * Note: Element Plus still runs its command path on keyboard activation
 * even after preventDefault; the string-only `onCommand` guard covers that.
 */
function onSubmenuParentClick(event: MouseEvent) {
  event.preventDefault()
}
</script>

<template>
  <ElDropdownItem
    v-if="hasChildren(props.item)"
    :divided="props.divided"
    :disabled="props.item.disabled"
    class="ml-ribbon-file-menu-submenu"
    @click="onSubmenuParentClick"
  >
    <ElDropdown
      trigger="hover"
      placement="right-start"
      :teleported="true"
      :show-timeout="0"
      :hide-timeout="100"
      :hide-on-click="false"
      :popper-class="props.popperClass"
      @command="onCommand"
    >
      <span class="ml-ribbon-file-menu-submenu__trigger">
        {{ props.item.label }}
        <ElIcon class="ml-ribbon-file-menu-submenu__arrow">
          <ArrowRight />
        </ElIcon>
      </span>
      <template #dropdown>
        <ElDropdownMenu>
          <RibbonFileMenuItem
            v-for="child in props.item.children"
            :key="child.id"
            :item="child"
            :divided="child.divided === true"
            :popper-class="props.popperClass"
            @select="onCommand"
          />
        </ElDropdownMenu>
      </template>
    </ElDropdown>
  </ElDropdownItem>
  <ElDropdownItem
    v-else
    :divided="props.divided"
    :command="props.item.id"
    :disabled="props.item.disabled"
  >
    {{ props.item.label }}
  </ElDropdownItem>
</template>
