<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import { ArrowUp } from '@element-plus/icons-vue'
import { computed, inject, ref } from 'vue'
import {
  ElButton,
  ElCheckbox,
  ElColorPicker,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElIcon,
  ElOption,
  ElSelect,
  useGlobalConfig,
} from 'element-plus'
import type { Component } from 'vue'
import { ribbonKey } from '../context'
import type { RibbonItemModel } from '../types'
import MlRibbonGallery from '../items/RibbonGallery.vue'
import MlRibbonGroupButton from '../items/RibbonGroupButton.vue'
import MlRibbonTemplateItem from '../items/RibbonTemplateItem.vue'

/**
 * @component MlRibbonItemHost
 * @description
 * Type-aware item renderer. It maps `RibbonItemModel.type` to Element Plus controls
 * or ribbon-specific item components and normalizes click/change emissions.
 *
 * @prop id - Item identifier.
 * @prop item - Full item model, including type and item-specific props.
 * @prop groupId - Parent group id used for telemetry and callbacks.
 * @prop galleryPreviewFallback - Fallback label passed to `MlRibbonGallery`.
 *
 * @event item-click - Emitted when the hosted item is activated. Payload is item id.
 *
 * @slot template - Custom renderer slot for `template` item type.
 *
 * @example
 * ```vue
 * <MlRibbonItemHost
 *   id="font-family"
 *   :item="itemModel"
 *   group-id="font"
 *   gallery-preview-fallback="Preview"
 *   @item-click="onItemClick"
 * />
 * ```
 */
const props = defineProps<{
  id: string
  item: RibbonItemModel
  groupId: string
  galleryPreviewFallback?: string
}>()

const emit = defineEmits<{ (e: 'item-click', payload: string): void }>()
const ribbon = inject(ribbonKey, null)
// Dropdown/combobox options are normalized to a stable array to simplify template rendering.
const options = computed(() => (Array.isArray(props.item.props?.options) ? props.item.props.options : []))
// Read Element Plus global size so popup menus inherit the same visual scale as ribbon controls.
const globalSize = useGlobalConfig('size', '')
const resolvedSize = computed(() => globalSize.value || 'default')
// Shared popper class names keep dropdown/select overlays on the same ribbon size theme.
const dropdownPopperClass = computed(
  () => `ml-ribbon-dropdown-menu ml-ribbon-popper ml-ribbon-popper--size-${resolvedSize.value}`,
)
const selectPopperClass = computed(
  () => `ml-ribbon-select-dropdown ml-ribbon-popper ml-ribbon-popper--size-${resolvedSize.value}`,
)
// Prefer icon declared in item props, then fallback to the top-level item icon.
const iconComponent = computed<Component | null>(() => {
  const byProps = props.item.props?.icon as Component | undefined
  if (byProps) return byProps
  if (typeof props.item.icon === 'string' || !props.item.icon) return null
  return props.item.icon as Component
})
// Hide label only when the schema explicitly sets hideLabel to true.
const shouldShowLabel = computed(() => props.item.hideLabel !== true)
const buttonAriaLabel = computed(() => props.item.label || props.item.id)
const keyTipText = computed(() => props.item.keyTip?.trim().toUpperCase() ?? '')
const isDropdownOpen = ref(false)
const shouldShowKeyTip = computed(() => {
  if (!ribbon?.keyTipsOpen.value) return false
  if (!keyTipText.value) return false
  const sequence = ribbon.keyTipsSequence.value.toLowerCase()
  if (!sequence) return true
  return keyTipText.value.toLowerCase().startsWith(sequence)
})

/**
 * Emits a normalized click payload so parent components only care about item id.
 */
function handleClick() {
  emit('item-click', props.id)
}

/**
 * Syncs dropdown open state from Element Plus visibility event.
 * @param value Whether dropdown menu is open.
 */
function setDropdownOpen(value: boolean) {
  isDropdownOpen.value = value
}

/**
 * Toggles dropdown arrow state on trigger click.
 */
function toggleDropdownOpen() {
  isDropdownOpen.value = !isDropdownOpen.value
}

/**
 * Handles dropdown option command and closes arrow state.
 */
function handleDropdownCommand() {
  handleClick()
  isDropdownOpen.value = false
}

/**
 * Resolves an option icon as a Vue component instance.
 * @param option Dropdown option candidate.
 * @returns Component icon when present and non-string; otherwise `null`.
 */
function optionIconAsComponent(option: unknown): Component | null {
  if (!option || typeof option !== 'object') return null
  const icon = (option as { icon?: unknown }).icon
  if (!icon || typeof icon === 'string') return null
  return icon as Component
}

/**
 * Resolves an option icon as a CSS class name.
 * @param option Dropdown option candidate.
 * @returns CSS class string when provided by schema; otherwise `null`.
 */
function optionIconAsClass(option: unknown): string | null {
  if (!option || typeof option !== 'object') return null
  const icon = (option as { icon?: unknown }).icon
  if (typeof icon !== 'string' || icon.trim().length === 0) return null
  return icon
}
</script>

<template>
  <div
    class="ml-ribbon-item-host"
    :class="[`is-${item.size ?? 'medium'}`, `type-${item.type}`, { 'is-label-hidden': item.hideLabel === true }]"
    :data-item-id="id"
    role="group"
  >
    <span v-if="shouldShowKeyTip" class="ml-ribbon-item-host__keytip">{{ keyTipText }}</span>

    <MlRibbonGroupButton
      v-if="item.type === 'groupButton'"
      :id="item.id"
      :label="item.label ?? ''"
      :options="(item.props?.options as any[]) ?? []"
      :multiple="Boolean(item.props?.multiple)"
      :disabled="item.disabled"
      @change="handleClick"
    />

    <MlRibbonGallery
      v-else-if="item.type === 'gallery'"
      :id="item.id"
      :label="item.label ?? ''"
      :categories="(item.props?.categories as any[]) ?? []"
      :preview-fallback="props.galleryPreviewFallback"
      :disabled="item.disabled"
      @select="handleClick"
    />

    <MlRibbonTemplateItem v-else-if="item.type === 'template'" :id="item.id" :item="item">
      <slot name="template" :item="item" />
    </MlRibbonTemplateItem>

    <ElDropdown
      v-else-if="item.type === 'dropdown'"
      trigger="click"
      :disabled="item.disabled"
      :popper-class="dropdownPopperClass"
      @visible-change="setDropdownOpen"
      @command="handleDropdownCommand"
    >
      <ElButton type="default" :aria-label="buttonAriaLabel" @click="toggleDropdownOpen">
        <span class="ml-ribbon-item-host__content">
          <ElIcon v-if="iconComponent" class="ml-ribbon-item-host__icon"><component :is="iconComponent" /></ElIcon>
          <span class="ml-ribbon-item-host__text-row">
            <span v-if="shouldShowLabel" class="ml-ribbon-item-host__label">{{ item.label }}</span>
            <ElIcon class="ml-ribbon-item-host__dropdown-arrow" :class="{ 'is-open': isDropdownOpen }">
              <component :is="isDropdownOpen ? ArrowUp : ArrowDown" />
            </ElIcon>
          </span>
        </span>
      </ElButton>
      <template #dropdown>
        <ElDropdownMenu>
          <ElDropdownItem
            v-for="opt in options"
            :key="String((opt as any).value)"
            :command="(opt as any).value"
          >
            <span class="ml-ribbon-dropdown-item__content">
              <ElIcon v-if="optionIconAsComponent(opt)" class="ml-ribbon-dropdown-item__icon">
                <component :is="optionIconAsComponent(opt)" />
              </ElIcon>
              <i
                v-else-if="optionIconAsClass(opt)"
                class="ml-ribbon-dropdown-item__icon ml-ribbon-dropdown-item__icon--class"
                :class="optionIconAsClass(opt)"
                aria-hidden="true"
              />
              <span class="ml-ribbon-dropdown-item__label">{{ (opt as any).label }}</span>
            </span>
          </ElDropdownItem>
        </ElDropdownMenu>
      </template>
    </ElDropdown>

    <ElCheckbox v-else-if="item.type === 'checkbox'" :disabled="item.disabled" @change="handleClick">
      {{ item.label }}
    </ElCheckbox>

    <ElColorPicker v-else-if="item.type === 'colorPicker'" :disabled="item.disabled" @change="handleClick" />

    <ElSelect
      v-else-if="item.type === 'comboBox'"
      :disabled="item.disabled"
      :popper-class="selectPopperClass"
      style="width: 92px"
      @change="handleClick"
    >
      <ElOption
        v-for="opt in options"
        :key="String((opt as any).value)"
        :label="String((opt as any).label)"
        :value="(opt as any).value"
      />
    </ElSelect>

    <ElButton v-else :disabled="item.disabled" :aria-label="buttonAriaLabel" @click="handleClick">
      <ElIcon v-if="iconComponent" class="ml-ribbon-item-host__icon"><component :is="iconComponent" /></ElIcon>
      <span v-if="shouldShowLabel" class="ml-ribbon-item-host__label">{{ item.label ?? item.id }}</span>
    </ElButton>
  </div>
</template>


