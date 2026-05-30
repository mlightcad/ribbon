<script setup lang="ts">
import { computed, inject, markRaw, ref, toRaw, watch } from 'vue'
import {
  ElCheckbox,
  ElColorPicker,
  ElOption,
  ElSelect,
  ElTooltip,
  useGlobalConfig,
} from 'element-plus'
import type { Component } from 'vue'
import { ribbonKey } from '../context'
import type { RibbonGalleryCategoryModel, RibbonItemModel } from '../types'
import MlRibbonButton from '../items/RibbonButton.vue'
import MlRibbonButtonGroup from '../items/RibbonButtonGroup.vue'
import MlRibbonDropdown from '../items/RibbonDropdown.vue'
import MlRibbonGallery from '../items/RibbonGallery.vue'
import MlRibbonInputNumber from '../items/RibbonInputNumber.vue'
import MlRibbonSegmented from '../items/RibbonSegmented.vue'
import MlRibbonToggleButton from '../items/RibbonToggleButton.vue'
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
 * @slot template - Custom renderer slot fallback for `template` item type.
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
  disabled?: boolean
}>()

const emit = defineEmits<{ (e: 'item-click', payload: string): void }>()
const ribbon = inject(ribbonKey, null)
// Dropdown/combobox options are normalized to a stable array to simplify template rendering.
const options = computed(() =>
  Array.isArray(props.item.props?.options) ? props.item.props.options : [],
)
// Read Element Plus global size so popup menus inherit the same visual scale as ribbon controls.
const globalSize = useGlobalConfig('size', '')
const resolvedSize = computed(() => globalSize.value || 'default')
const resolvedTooltipShowAfter = computed(() =>
  normalizeTooltipDelay(ribbon?.tooltipShowAfter.value, 1000),
)
const resolvedTooltipHideAfter = computed(() =>
  normalizeTooltipDelay(ribbon?.tooltipHideAfter.value, 0),
)
const selectPopperClass = computed(
  () =>
    `ml-ribbon-select-dropdown ml-ribbon-popper ml-ribbon-popper--size-${resolvedSize.value}`,
)
const buttonIcon = computed<string | Component | undefined>(() => {
  const byProps = props.item.props?.icon
  if (byProps) return byProps as string | Component
  return props.item.icon
})
// Hide label only when the schema explicitly sets hideLabel to true.
const shouldShowLabel = computed(() => props.item.hideLabel !== true)
const dropdownTriggerTooltip = ref<string | undefined>(undefined)
const resolvedTooltip = computed(() => {
  if (props.item.type === 'dropdown' && dropdownTriggerTooltip.value)
    return dropdownTriggerTooltip.value
  return (
    itemText(props.item.tooltip) ??
    itemText(props.item.label) ??
    optionTooltipText(props.item) ??
    humanizeItemId(props.item.id)
  )
})
const shouldUseHostTooltip = computed(
  () => props.item.type !== 'buttonGroup' && props.item.type !== 'segmented',
)
const shouldDisableHostTooltip = computed(
  () => !shouldUseHostTooltip.value || !resolvedTooltip.value,
)
const buttonAriaLabel = computed(() => resolvedTooltip.value ?? props.item.id)
const keyTipText = computed(() => props.item.keyTip?.trim().toUpperCase() ?? '')
const shouldShowKeyTip = computed(() => {
  if (!ribbon?.keyTipsOpen.value) return false
  if (ribbon?.disabled.value) return false
  if (props.disabled === true) return false
  if (!keyTipText.value) return false
  const sequence = ribbon.keyTipsSequence.value.toLowerCase()
  if (!sequence) return true
  return keyTipText.value.toLowerCase().startsWith(sequence)
})
const isDisabled = computed(
  () =>
    props.disabled === true ||
    props.item.disabled === true ||
    ribbon?.disabled.value === true,
)
const toggleModelValue = computed(
  () => props.item.props?.modelValue as boolean | undefined,
)
const toggleActiveLabel = computed(
  () => props.item.props?.activeLabel as string | undefined,
)
const toggleInactiveLabel = computed(
  () => props.item.props?.inactiveLabel as string | undefined,
)
const galleryCategories = computed(() =>
  Array.isArray(props.item.props?.categories)
    ? (props.item.props.categories as RibbonGalleryCategoryModel[])
    : [],
)
const galleryModelValue = computed(() => {
  const value = props.item.props?.modelValue
  return typeof value === 'string' ? value : undefined
})
const galleryInlineItemLimit = computed(() => {
  const value = props.item.props?.inlineItemLimit
  return typeof value === 'number' ? value : undefined
})
const galleryInlineItemWidthMode = computed<'fixed' | 'auto'>(() =>
  props.item.props?.inlineItemWidthMode === 'auto' ? 'auto' : 'fixed',
)
const customItemComponent = computed<Component | null>(() => {
  const candidate = props.item.props?.component
  if (!candidate || typeof candidate === 'string') return null
  return markRaw(toRaw(candidate as Component))
})
const customItemComponentProps = computed<Record<string, unknown>>(() => {
  const candidate = props.item.props?.componentProps
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
    return {}
  return candidate as Record<string, unknown>
})
const buttonGroupWrap = computed(() => props.item.props?.wrap !== false)
const buttonGroupEqualWidth = computed(
  () => props.item.props?.equalWidth === true,
)
const buttonGroupSize = computed<'large' | 'default' | 'small' | undefined>(
  () => {
    const value = props.item.props?.buttonSize
    if (value === 'large' || value === 'default' || value === 'small')
      return value
    return undefined
  },
)
const buttonGroupIconSize = computed(() =>
  normalizeOptionalFontSize(props.item.props?.iconSize),
)
const comboBoxWidth = computed(() =>
  normalizeCssSize(
    props.item.props?.width ?? props.item.props?.comboWidth,
    '92px',
  ),
)
const comboBoxModelValue = computed(() => props.item.props?.modelValue)
const inputNumberWidth = computed(() =>
  normalizeCssSize(
    props.item.props?.width ?? props.item.props?.inputNumberWidth,
    '96px',
  ),
)
const inputNumberModelValue = computed(
  () => props.item.props?.modelValue as number | undefined,
)
const inputNumberControlProps = computed<Record<string, unknown>>(() => {
  const controlProps = { ...(props.item.props ?? {}) }
  delete controlProps.modelValue
  delete controlProps.width
  delete controlProps.inputNumberWidth
  delete controlProps.prefixLabel
  delete controlProps.prefixIcon
  delete controlProps.prefixIconClass
  delete controlProps.emitValueOnChange
  delete controlProps.valuePrefix
  delete controlProps.options
  delete controlProps.component
  delete controlProps.componentProps
  return controlProps
})
const labelWrapLines = computed(() =>
  normalizeLabelWrapLines(props.item.props?.labelWrapLines),
)
const labelWrapWidth = computed(() =>
  normalizeOptionalCssSize(props.item.props?.labelWrapWidth),
)
const shouldWrapLargeButtonLabel = computed(
  () =>
    props.item.type === 'button' &&
    props.item.size === 'large' &&
    shouldShowLabel.value &&
    (labelWrapLines.value ?? 0) > 1,
)
const labelWrapInlineStyle = computed<Record<string, string>>(() => {
  if (!shouldWrapLargeButtonLabel.value) return {}
  const style: Record<string, string> = {
    '--ml-rb-item-label-max-lines': String(labelWrapLines.value ?? 2),
  }
  if (labelWrapWidth.value) {
    style['--ml-rb-item-label-wrap-width'] = labelWrapWidth.value
  }
  return style
})

watch(
  () => props.item.id,
  () => {
    dropdownTriggerTooltip.value = undefined
  },
)

/**
 * Emits a normalized click payload so parent components only care about item id.
 */
function handleClick() {
  if (isDisabled.value) return
  emit('item-click', props.id)
}

/**
 * Handles dropdown option command and closes arrow state.
 */
function handleDropdownCommand(command: unknown) {
  if (isDisabled.value) return
  if (typeof command === 'string' || typeof command === 'number') {
    emit('item-click', String(command))
    return
  }
  handleClick()
}

function handleDropdownTooltipChange(tooltip: string | undefined) {
  dropdownTriggerTooltip.value = tooltip
}

/**
 * Emits segmented option value as the interaction payload.
 * @param value Segmented selection value.
 */
function handleSegmentedChange(value: unknown) {
  if (isDisabled.value) return
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    emit('item-click', String(value))
    return
  }
  handleClick()
}

/**
 * Emits toggle state, optionally mapped to custom active/inactive values.
 * @param value Current toggle state after interaction.
 */
function handleToggleChange(value: boolean) {
  if (isDisabled.value) return
  const mappedValue = value
    ? props.item.props?.activeValue
    : props.item.props?.inactiveValue
  if (
    typeof mappedValue === 'string' ||
    typeof mappedValue === 'number' ||
    typeof mappedValue === 'boolean'
  ) {
    emit('item-click', String(mappedValue))
    return
  }
  emit('item-click', String(value))
}

/**
 * Emits the clicked group button option value instead of the parent group item id.
 * @param value Group button option value.
 */
function handleButtonGroupChange(value: unknown) {
  if (isDisabled.value) return
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    emit('item-click', String(value))
    return
  }
  handleClick()
}

/**
 * Emits the selected gallery item id instead of the parent gallery item id.
 * @param value Selected gallery option id.
 */
function handleGallerySelect(value: string) {
  if (isDisabled.value) return
  emit('item-click', value)
}

/**
 * Emits combobox selection payload when configured, otherwise keeps item-id behavior.
 * @param value Selected combobox value.
 */
function handleComboBoxChange(value: unknown) {
  if (isDisabled.value) return
  if (props.item.props?.emitValueOnChange === true) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      emit('item-click', String(value))
      return
    }
  }
  handleClick()
}

/**
 * Emits input-number values when configured, otherwise preserves item-id command behavior.
 * @param value Current numeric value after interaction.
 */
function handleInputNumberChange(value: number | undefined) {
  if (isDisabled.value) return
  if (
    props.item.props?.emitValueOnChange === true &&
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    const valuePrefix = props.item.props?.valuePrefix
    emit(
      'item-click',
      `${typeof valuePrefix === 'string' ? valuePrefix : ''}${value}`,
    )
    return
  }
  handleClick()
}

/**
 * Lets custom item components emit normalized ribbon commands back to the host.
 * @param payload Optional command id override.
 */
function emitCustomItemClick(payload?: string | number | boolean) {
  if (isDisabled.value) return
  if (
    typeof payload === 'string' ||
    typeof payload === 'number' ||
    typeof payload === 'boolean'
  ) {
    emit('item-click', String(payload))
    return
  }
  handleClick()
}

/**
 * Reads the display label from a dropdown option.
 * @param option Dropdown option candidate.
 * @returns Option label string when available.
 */
function optionLabel(option: unknown): string | undefined {
  if (!option || typeof option !== 'object') return undefined
  const label = (option as { label?: unknown }).label
  return typeof label === 'string' ? label : undefined
}

/**
 * Normalizes optional item text values so blank strings do not render as UI copy.
 * @param value Candidate label/tooltip string.
 * @returns Trimmed string when present; otherwise `undefined`.
 */
function itemText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/**
 * Normalizes tooltip delay props so Element Plus always receives a safe number.
 * @param value Candidate tooltip delay in milliseconds.
 * @param fallback Default delay used when value is invalid.
 * @returns Non-negative integer delay.
 */
function normalizeTooltipDelay(value: unknown, fallback: number): number {
  if (
    typeof value !== 'number' ||
    Number.isNaN(value) ||
    !Number.isFinite(value)
  )
    return fallback
  return Math.max(0, Math.round(value))
}

/**
 * Converts schema width values to a valid CSS length.
 * @param value Width value from schema props.
 * @param fallback Default width used when value is absent/invalid.
 * @returns CSS width string.
 */
function normalizeCssSize(value: unknown, fallback: string): string {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0)
    return `${value}px`
  if (typeof value === 'string') {
    const normalized = value.trim()
    if (!normalized) return fallback
    if (normalized.toLowerCase() === 'full') return '100%'
    return normalized
  }
  return fallback
}

/**
 * Normalizes an optional CSS size without forcing a fallback value.
 * @param value Width value from schema props.
 * @returns CSS width string when valid; otherwise `undefined`.
 */
function normalizeOptionalCssSize(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0)
    return `${value}px`
  if (typeof value === 'string') {
    const normalized = value.trim()
    if (!normalized) return undefined
    if (normalized.toLowerCase() === 'full') return '100%'
    return normalized
  }
  return undefined
}

/**
 * Normalizes optional icon font-size props for schema-driven icon sizing.
 * @param value Candidate icon size from schema props.
 * @returns CSS size string when valid; otherwise `undefined`.
 */
function normalizeOptionalFontSize(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0)
    return `${value}px`
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

/**
 * Normalizes optional large-button label wrap lines to a safe integer.
 * @param value Candidate line count from schema props.
 * @returns Rounded line count when valid; otherwise `undefined`.
 */
function normalizeLabelWrapLines(value: unknown): number | undefined {
  if (
    typeof value !== 'number' ||
    Number.isNaN(value) ||
    !Number.isFinite(value)
  )
    return undefined
  return Math.max(1, Math.round(value))
}

/**
 * Derives tooltip text from option labels for grouped/selectable items.
 * @param item Ribbon item candidate.
 * @returns Tooltip text inferred from option labels when available.
 */
function optionTooltipText(item: RibbonItemModel): string | undefined {
  const optionLabels = options.value
    .map((option) => optionLabel(option))
    .filter((label): label is string => Boolean(label))
  if (!optionLabels.length) return undefined
  if (item.type === 'buttonGroup') return optionLabels.join(' / ')
  return optionLabels[0]
}

/**
 * Converts schema ids like `draw-ellipse` into a readable fallback tooltip.
 * @param value Item id.
 * @returns Human-readable fallback text.
 */
function humanizeItemId(value: string): string {
  const normalized = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
  if (!normalized) return value
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase())
}
</script>

<template>
  <ElTooltip
    :content="resolvedTooltip"
    :disabled="shouldDisableHostTooltip"
    :show-after="resolvedTooltipShowAfter"
    :hide-after="resolvedTooltipHideAfter"
    placement="top"
    effect="dark"
  >
    <div
      class="ml-ribbon-item-host"
      :class="[
        `is-${item.size ?? 'medium'}`,
        `type-${item.type}`,
        {
          'is-label-hidden': item.hideLabel === true,
          'is-label-wrap': shouldWrapLargeButtonLabel,
        },
      ]"
      :style="labelWrapInlineStyle"
      :data-item-id="id"
      role="group"
    >
      <span v-if="shouldShowKeyTip" class="ml-ribbon-item-host__keytip">{{
        keyTipText
      }}</span>

      <MlRibbonButtonGroup
        v-if="item.type === 'buttonGroup'"
        :id="item.id"
        :label="item.label ?? ''"
        :options="(item.props?.options as any[]) ?? []"
        :hide-label="item.hideLabel === true"
        :wrap="buttonGroupWrap"
        :equal-width="buttonGroupEqualWidth"
        :button-size="buttonGroupSize"
        :icon-size="buttonGroupIconSize"
        :tooltip-show-after="resolvedTooltipShowAfter"
        :tooltip-hide-after="resolvedTooltipHideAfter"
        :disabled="isDisabled"
        @change="handleButtonGroupChange"
      />

      <MlRibbonSegmented
        v-else-if="item.type === 'segmented'"
        :id="item.id"
        :label="item.label ?? item.id"
        :options="(item.props?.options as any[]) ?? []"
        :model-value="item.props?.modelValue as any"
        :direction="(item.props?.direction as any) ?? 'horizontal'"
        :block="item.props?.block === true"
        :disabled="isDisabled"
        :hide-label="item.hideLabel === true"
        :tooltip-show-after="resolvedTooltipShowAfter"
        :tooltip-hide-after="resolvedTooltipHideAfter"
        @change="handleSegmentedChange"
      />

      <MlRibbonToggleButton
        v-else-if="item.type === 'toggle'"
        :id="item.id"
        :label="item.label ?? item.id"
        :model-value="toggleModelValue"
        :active-icon="
          ((item.props?.activeIcon ?? item.props?.icon) as any) ?? item.icon
        "
        :inactive-icon="
          ((item.props?.inactiveIcon ?? item.props?.icon) as any) ?? item.icon
        "
        :active-label="toggleActiveLabel"
        :inactive-label="toggleInactiveLabel"
        :disabled="isDisabled"
        :hide-label="item.hideLabel === true"
        @change="handleToggleChange"
      />

      <MlRibbonGallery
        v-else-if="item.type === 'gallery'"
        :id="item.id"
        :label="item.label ?? ''"
        :categories="galleryCategories"
        :model-value="galleryModelValue"
        :collapsed="item.props?.collapsed === true"
        :inline-item-limit="galleryInlineItemLimit"
        :inline-item-width-mode="galleryInlineItemWidthMode"
        :preview-fallback="props.galleryPreviewFallback"
        :disabled="isDisabled"
        @select="handleGallerySelect"
      />

      <MlRibbonTemplateItem
        v-else-if="item.type === 'custom' || item.type === 'template'"
        :id="item.id"
        :item="item"
        :disabled="isDisabled"
      >
        <component
          :is="customItemComponent"
          v-if="customItemComponent"
          v-bind="customItemComponentProps"
          :item="item"
          :group-id="groupId"
          :disabled="isDisabled"
          :emit-item-click="emitCustomItemClick"
        />
        <slot v-else name="template" :item="item" :disabled="isDisabled" />
      </MlRibbonTemplateItem>

      <MlRibbonDropdown
        v-else-if="item.type === 'dropdown'"
        :id="item.id"
        :label="item.label ?? item.id"
        :tooltip="item.tooltip"
        :icon="buttonIcon"
        :options="(item.props?.options as any[]) ?? []"
        :model-value="
          (item.props as { modelValue?: unknown } | undefined)?.modelValue
        "
        :disabled="isDisabled"
        :hide-label="item.hideLabel === true"
        :item-size="item.size ?? 'medium'"
        :sync-label-with-selection="item.props?.syncLabelWithSelection === true"
        :tooltip-show-after="resolvedTooltipShowAfter"
        :tooltip-hide-after="resolvedTooltipHideAfter"
        @command="handleDropdownCommand"
        @tooltip-change="handleDropdownTooltipChange"
        @click="handleClick"
      />

      <ElCheckbox
        v-else-if="item.type === 'checkbox'"
        :disabled="isDisabled"
        @change="handleClick"
      >
        {{ item.label }}
      </ElCheckbox>

      <ElColorPicker
        v-else-if="item.type === 'colorPicker'"
        :disabled="isDisabled"
        @change="handleClick"
      />

      <ElSelect
        v-else-if="item.type === 'comboBox'"
        :model-value="comboBoxModelValue as any"
        :disabled="isDisabled"
        :popper-class="selectPopperClass"
        :style="{ width: comboBoxWidth }"
        @change="handleComboBoxChange"
      >
        <ElOption
          v-for="opt in options"
          :key="String((opt as any).value)"
          :label="String((opt as any).label)"
          :value="(opt as any).value"
        />
      </ElSelect>

      <MlRibbonInputNumber
        v-else-if="item.type === 'inputNumber'"
        :id="item.id"
        :model-value="inputNumberModelValue"
        :width="inputNumberWidth"
        :prefix-label="item.props?.prefixLabel as any"
        :prefix-icon="
          ((item.props?.prefixIcon ?? item.props?.icon) as any) ?? item.icon
        "
        :prefix-icon-class="item.props?.prefixIconClass as any"
        :control-props="inputNumberControlProps"
        :disabled="isDisabled"
        @change="handleInputNumberChange"
      />

      <MlRibbonButton
        v-else
        :id="item.id"
        :label="item.label ?? item.id"
        :icon="buttonIcon"
        :disabled="isDisabled"
        :hide-label="!shouldShowLabel"
        :aria-label="buttonAriaLabel"
        @click="handleClick"
      />
    </div>
  </ElTooltip>
</template>
