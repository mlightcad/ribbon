<script setup lang="ts">
import { ArrowDown, ArrowUp, Check } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'
import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElIcon,
  ElTooltip,
  useGlobalConfig,
} from 'element-plus'
import type { Component } from 'vue'
import type { RibbonDropdownOption, RibbonItemSize } from '../types'

defineOptions({
  name: 'MlRibbonDropdown',
})

/**
 * @component MlRibbonDropdown
 * @description
 * Ribbon-styled dropdown command renderer. It centralizes trigger layout,
 * command memory, option icons, popper sizing, and split trigger behavior so
 * built-in and custom ribbon controls can share one dropdown surface.
 *
 * @prop id - Stable command identifier.
 * @prop label - Trigger label.
 * @prop tooltip - Trigger tooltip fallback.
 * @prop icon - Trigger icon component or CSS class name.
 * @prop options - Dropdown command options.
 * @prop disabled - Disables trigger and options.
 * @prop hideLabel - Hides trigger label while preserving arrow/icon affordance.
 * @prop syncLabelWithSelection - Uses the selected option label as trigger label; enables the menu check column.
 * @prop modelValue - When not `undefined`, keeps the trigger/menu selection in sync (controlled mode) and enables the menu check column.
 *
 * @event command - Emitted with the selected/current option value.
 * @event click - Emitted when the primary icon is clicked before an option is selected.
 *
 * @slot icon - Custom trigger icon/preview content.
 * @slot label - Custom trigger label content.
 * @slot option - Custom option row content.
 */
const props = withDefaults(
  defineProps<{
    id: string
    label?: string
    tooltip?: string
    icon?: string | Component
    options?: RibbonDropdownOption[]
    disabled?: boolean
    hideLabel?: boolean
    syncLabelWithSelection?: boolean
    itemSize?: RibbonItemSize
    tooltipShowAfter?: number
    tooltipHideAfter?: number
    popperClass?: string
    modelValue?: unknown
  }>(),
  {
    label: undefined,
    tooltip: undefined,
    icon: undefined,
    options: () => [],
    disabled: false,
    hideLabel: false,
    syncLabelWithSelection: false,
    itemSize: 'medium',
    tooltipShowAfter: 1000,
    tooltipHideAfter: 0,
    popperClass: undefined,
    modelValue: undefined,
  },
)

const emit = defineEmits<{
  (e: 'command', command: unknown): void
  (e: 'click'): void
  (e: 'tooltip-change', tooltip: string | undefined): void
}>()

const globalSize = useGlobalConfig('size', '')
const resolvedSize = computed(() => globalSize.value || 'default')
const isOpen = ref(false)
const selectedValue = ref<unknown>(undefined)

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined) {
      selectedValue.value = val
    }
  },
  { immediate: true },
)

const normalizedOptions = computed(() =>
  Array.isArray(props.options) ? props.options : [],
)
const selectedOption = computed(
  () =>
    normalizedOptions.value.find(
      (option) => optionValue(option) === selectedValue.value,
    ) ?? null,
)
const resolvedLabel = computed(() => {
  if (selectedOption.value && props.syncLabelWithSelection) {
    const label = optionLabel(selectedOption.value)
    if (label) return label
  }
  return itemText(props.label) ?? props.id
})
const shouldShowLabel = computed(
  () => !props.hideLabel && resolvedLabel.value.length > 0,
)
/** Reserve leading check column only when selection is surfaced (controlled value or label sync). */
const showSelectionCheckColumn = computed(
  () => props.modelValue !== undefined || props.syncLabelWithSelection,
)
const iconComponent = computed<Component | null>(() => {
  if (selectedOption.value) {
    const fromOption = optionIconAsComponent(selectedOption.value)
    if (fromOption) return fromOption
  }
  if (!props.icon || typeof props.icon === 'string') return null
  return props.icon
})
const iconClass = computed<string | null>(() => {
  if (selectedOption.value) {
    const fromOption = optionIconAsClass(selectedOption.value)
    if (fromOption) return fromOption
  }
  if (typeof props.icon !== 'string') return null
  const normalized = props.icon.trim()
  return normalized.length > 0 ? normalized : null
})
const hasTriggerIcon = computed(() =>
  Boolean(iconComponent.value || iconClass.value),
)
const buttonAriaLabel = computed(
  () =>
    optionTooltip(selectedOption.value) ??
    itemText(props.tooltip) ??
    itemText(resolvedLabel.value) ??
    itemText(props.label) ??
    humanizeItemId(props.id),
)
const dropdownPopperClass = computed(() =>
  [
    'ml-ribbon-dropdown-menu',
    'ml-ribbon-popper',
    `ml-ribbon-popper--size-${resolvedSize.value}`,
    props.popperClass,
  ]
    .filter(Boolean)
    .join(' '),
)

function setOpen(value: boolean) {
  if (props.disabled) {
    isOpen.value = false
    return
  }
  isOpen.value = value
}

function toggleOpen() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function handleCommand(command: unknown) {
  if (props.disabled) return
  selectedValue.value = command
  emit(
    'tooltip-change',
    optionTooltip(selectedOption.value) ?? buttonAriaLabel.value,
  )
  emit('command', command)
  isOpen.value = false
}

function handlePrimaryClick() {
  if (props.disabled) return
  const option = selectedOption.value
  if (!option) {
    emit('click')
    return
  }
  emit('command', optionValue(option))
}

function optionIconAsComponent(option: unknown): Component | null {
  if (!option || typeof option !== 'object') return null
  const icon = (option as { icon?: unknown }).icon
  if (!icon || typeof icon === 'string') return null
  return icon as Component
}

function optionIconAsClass(option: unknown): string | null {
  if (!option || typeof option !== 'object') return null
  const icon = (option as { icon?: unknown }).icon
  if (typeof icon !== 'string' || icon.trim().length === 0) return null
  return icon
}

function optionValue(option: unknown): unknown {
  if (!option || typeof option !== 'object') return undefined
  return (option as { value?: unknown }).value
}

function optionCommand(
  option: unknown,
): string | number | Record<string, unknown> | undefined {
  const value = optionValue(option)
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object')
    return value as Record<string, unknown>
  return undefined
}

function optionLabel(option: unknown): string | undefined {
  if (!option || typeof option !== 'object') return undefined
  const label = (option as { label?: unknown }).label
  return typeof label === 'string' ? label : undefined
}

function humanizeOptionValue(value: unknown): string | undefined {
  if (typeof value === 'string') return humanizeItemId(value)
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  return undefined
}

function optionTooltip(option: unknown): string | undefined {
  if (!option || typeof option !== 'object') return undefined
  const explicitTooltip = itemText((option as { tooltip?: unknown }).tooltip)
  return (
    explicitTooltip ??
    optionLabel(option) ??
    humanizeOptionValue(optionValue(option))
  )
}

function itemText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function humanizeItemId(value: string): string {
  const normalized = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
  if (!normalized) return value
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase())
}

function isOptionSelected(option: unknown): boolean {
  return optionValue(option) === selectedValue.value
}
</script>

<template>
  <ElDropdown
    class="ml-ribbon-dropdown"
    :class="[
      `ml-ribbon-dropdown--item-${itemSize}`,
      { 'is-label-hidden': hideLabel },
    ]"
    trigger="click"
    :disabled="disabled"
    :popper-class="dropdownPopperClass"
    @visible-change="setOpen"
    @command="handleCommand"
  >
    <ElButton
      type="default"
      :disabled="disabled"
      :aria-label="buttonAriaLabel"
      @click="toggleOpen"
    >
      <span class="ml-ribbon-item-host__content ml-ribbon-dropdown__content">
        <span
          v-if="$slots.icon || hasTriggerIcon"
          class="ml-ribbon-item-host__icon ml-ribbon-item-host__icon--dropdown-primary ml-ribbon-dropdown__icon"
          :class="{
            'ml-ribbon-item-host__icon--class':
              iconClass && !iconComponent && !$slots.icon,
          }"
          @click.stop="handlePrimaryClick"
        >
          <slot name="icon" :selected-option="selectedOption">
            <ElIcon v-if="iconComponent">
              <component :is="iconComponent" />
            </ElIcon>
            <i v-else-if="iconClass" :class="iconClass" aria-hidden="true" />
          </slot>
        </span>
        <span
          class="ml-ribbon-item-host__text-row ml-ribbon-dropdown__text-row"
        >
          <span
            v-if="shouldShowLabel"
            class="ml-ribbon-item-host__label ml-ribbon-dropdown__label"
          >
            <slot
              name="label"
              :selected-option="selectedOption"
              :label="resolvedLabel"
              >{{ resolvedLabel }}</slot
            >
          </span>
          <ElIcon
            class="ml-ribbon-item-host__dropdown-arrow ml-ribbon-dropdown__arrow"
            :class="{ 'is-open': isOpen }"
          >
            <component :is="isOpen ? ArrowUp : ArrowDown" />
          </ElIcon>
        </span>
      </span>
    </ElButton>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem
          v-for="option in normalizedOptions"
          :key="String(optionValue(option))"
          :command="optionCommand(option)"
          :disabled="option.disabled === true"
          :divided="option.divided === true"
          :aria-current="isOptionSelected(option) ? 'true' : undefined"
          :class="{
            'ml-ribbon-dropdown-item--selected': isOptionSelected(option),
          }"
        >
          <ElTooltip
            :content="optionTooltip(option)"
            :disabled="!optionTooltip(option)"
            :show-after="tooltipShowAfter"
            :hide-after="tooltipHideAfter"
            placement="top"
            effect="dark"
          >
            <span class="ml-ribbon-dropdown-item__content">
              <slot name="option" :option="option">
                <span class="ml-ribbon-dropdown-item__row">
                  <span
                    v-if="showSelectionCheckColumn"
                    class="ml-ribbon-dropdown-item__check"
                    aria-hidden="true"
                  >
                    <ElIcon
                      v-if="isOptionSelected(option)"
                      class="ml-ribbon-dropdown-item__check-icon"
                    >
                      <Check />
                    </ElIcon>
                  </span>
                  <span class="ml-ribbon-dropdown-item__main">
                    <ElIcon
                      v-if="optionIconAsComponent(option)"
                      class="ml-ribbon-dropdown-item__icon"
                    >
                      <component :is="optionIconAsComponent(option)" />
                    </ElIcon>
                    <i
                      v-else-if="optionIconAsClass(option)"
                      class="ml-ribbon-dropdown-item__icon ml-ribbon-dropdown-item__icon--class"
                      :class="optionIconAsClass(option)"
                      aria-hidden="true"
                    />
                    <span class="ml-ribbon-dropdown-item__label">{{
                      optionLabel(option)
                    }}</span>
                  </span>
                </span>
              </slot>
            </span>
          </ElTooltip>
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>

<style scoped>
.ml-ribbon-dropdown-item__row {
  display: flex;
  align-items: center;
  gap: 0.35em;
  min-width: 0;
}

.ml-ribbon-dropdown-item__check {
  display: inline-flex;
  width: 1em;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.ml-ribbon-dropdown-item__check-icon {
  font-size: 1em;
  color: var(--el-color-primary);
}

.ml-ribbon-dropdown-item__main {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  min-width: 0;
  flex: 1;
}

.ml-ribbon-dropdown-item--selected {
  font-weight: 600;
  color: var(--el-color-primary);
  background-color: var(--el-dropdown-menuItem-hover-fill);
}

.ml-ribbon-dropdown-item--selected .ml-ribbon-dropdown-item__label {
  color: inherit;
}
</style>
