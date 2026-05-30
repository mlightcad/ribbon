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

function onCommand(value: string) {
  emit('select', value)
}
</script>

<template>
  <ElDropdownItem
    v-if="hasChildren(props.item)"
    :divided="props.divided"
    :disabled="props.item.disabled"
    class="ml-ribbon-file-menu-submenu"
  >
    <ElDropdown
      trigger="hover"
      placement="right-start"
      :teleported="true"
      :show-timeout="0"
      :hide-timeout="100"
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
