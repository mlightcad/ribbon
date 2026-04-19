<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'
import { ElIcon, ElPopover, useGlobalConfig } from 'element-plus'
import type { Component } from 'vue'
import type { RibbonCustomItemBindings } from '../ribbon'
import type { MlDemoCadDropdownOption, MlDemoCadDropdownVariant } from './demoCadDropdown'

defineOptions({
  name: 'MlDemoCadDropdown',
})

/**
 * Props accepted by {@link MlDemoCadDropdown}.
 *
 * The component adapts ribbon custom-item bindings into a reusable CAD-style
 * dropdown trigger with either color, line-type, or line-weight previews.
 */
interface MlDemoCadDropdownProps extends RibbonCustomItemBindings {
  /**
   * Optional display title used for accessibility and integrations that need a
   * stable human-readable label.
   */
  title?: string

  /**
   * Currently selected option value.
   *
   * If the value is missing or does not match an available option, the first
   * option in {@link options} is used as the visual fallback.
   */
  modelValue?: string

  /**
   * Ordered list of selectable options rendered inside the popover.
   */
  options?: MlDemoCadDropdownOption[]

  /**
   * Selects the preview style used in both the trigger and the dropdown list.
   */
  variant?: MlDemoCadDropdownVariant

  /**
   * Label shown when no option can be resolved from {@link modelValue}.
   */
  placeholder?: string

  /**
   * Explicit Element Plus popover width, in pixels.
   */
  popoverWidth?: number

  /**
   * Optional icon rendered before the current preview value.
   */
  leadingIcon?: Component
}

const props = withDefaults(
  defineProps<MlDemoCadDropdownProps>(),
  {
    title: '',
    modelValue: '',
    options: () => [],
    variant: 'color',
    placeholder: 'Select',
    popoverWidth: 248,
  },
)

const popoverVisible = ref(false)
const globalSize = useGlobalConfig('size', '')
const resolvedRibbonSize = computed(() => globalSize.value || 'default')
const selectedOption = computed(
  () => props.options.find((option) => option.value === props.modelValue) ?? props.options[0] ?? null,
)
const displayLabel = computed(() => selectedOption.value?.label ?? props.placeholder)
const popoverClass = computed(() => `ml-demo-cad-dropdown-popper ml-demo-cad-dropdown-popper--${resolvedRibbonSize.value}`)
const accessibleLabel = computed(() => props.title || props.item.label || props.item.id)

watch(
  () => props.disabled,
  (value) => {
    if (value) popoverVisible.value = false
  },
)

function handleOptionClick(option: MlDemoCadDropdownOption) {
  if (props.disabled) return
  props.emitItemClick(option.command ?? `${props.item.id}-${option.value}`)
  popoverVisible.value = false
}

/**
 * Builds the CSS background used to preview line-based dropdown options.
 */
function resolveLineBackground(option: MlDemoCadDropdownOption) {
  const color = option.swatch ?? '#4f5b67'
  switch (option.pattern) {
    case 'dashed':
      return `repeating-linear-gradient(90deg, ${color} 0 20px, transparent 20px 28px)`
    case 'hidden':
      return `repeating-linear-gradient(90deg, ${color} 0 10px, transparent 10px 16px)`
    case 'center':
      return `repeating-linear-gradient(90deg, ${color} 0 26px, transparent 26px 34px, ${color} 34px 42px, transparent 42px 54px)`
    default:
      return `linear-gradient(90deg, ${color}, ${color})`
  }
}

/**
 * Maps the resolved option into CSS custom properties consumed by the preview UI.
 */
function previewStyle(option: MlDemoCadDropdownOption | null) {
  if (!option) return {}
  if (props.variant === 'color') {
    return {
      '--ml-demo-cad-swatch': option.swatch ?? '#7b8794',
    }
  }
  return {
    '--ml-demo-cad-line-bg': resolveLineBackground(option),
    '--ml-demo-cad-line-height': `${option.weight ?? 2}px`,
  }
}
</script>

<template>
  <section
    class="ml-demo-cad-dropdown"
    :class="[
      `ml-demo-cad-dropdown--${variant}`,
      `ml-demo-cad-dropdown--size-${resolvedRibbonSize}`,
      { 'ml-demo-cad-dropdown--disabled': disabled },
    ]"
    :aria-disabled="disabled"
  >
    <span v-if="leadingIcon" class="ml-demo-cad-dropdown__leading-icon" aria-hidden="true">
      <ElIcon>
        <component :is="leadingIcon" />
      </ElIcon>
    </span>

    <div class="ml-demo-cad-dropdown__field">
      <ElPopover
        v-model:visible="popoverVisible"
        trigger="click"
        placement="bottom-start"
        :width="popoverWidth"
        :disabled="disabled"
        :popper-class="popoverClass"
        :offset="6"
        persistent
      >
        <template #reference>
          <button
            type="button"
            class="ml-demo-cad-dropdown__trigger"
            :disabled="disabled"
            :aria-label="accessibleLabel"
          >
            <span class="ml-demo-cad-dropdown__preview" :class="`is-${variant}`">
              <span
                v-if="variant === 'color'"
                class="ml-demo-cad-dropdown__swatch"
                :style="previewStyle(selectedOption)"
                aria-hidden="true"
              />
              <span v-else class="ml-demo-cad-dropdown__line" :style="previewStyle(selectedOption)" aria-hidden="true" />
              <span class="ml-demo-cad-dropdown__value">{{ displayLabel }}</span>
            </span>
            <ElIcon class="ml-demo-cad-dropdown__arrow" :class="{ 'is-open': popoverVisible }">
              <ArrowDown />
            </ElIcon>
          </button>
        </template>

        <div class="ml-demo-cad-dropdown__menu">
          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            class="ml-demo-cad-dropdown__option"
            :class="{ 'is-selected': option.value === selectedOption?.value }"
            :disabled="disabled"
            @click="handleOptionClick(option)"
          >
            <span class="ml-demo-cad-dropdown__option-preview" :class="`is-${variant}`">
              <span
                v-if="variant === 'color'"
                class="ml-demo-cad-dropdown__swatch"
                :style="previewStyle(option)"
                aria-hidden="true"
              />
              <span v-else class="ml-demo-cad-dropdown__line" :style="previewStyle(option)" aria-hidden="true" />
              <span class="ml-demo-cad-dropdown__value">{{ option.label }}</span>
            </span>
            <span v-if="option.value === selectedOption?.value" class="ml-demo-cad-dropdown__selected-mark" aria-hidden="true">
              ✓
            </span>
          </button>
        </div>
      </ElPopover>
    </div>
  </section>
</template>

<style scoped>
.ml-demo-cad-dropdown {
  --ml-demo-cad-scale: var(--ml-rb-scale, 1);
  --ml-demo-cad-font-xs: var(
    --ml-rb-font-xs,
    calc(var(--el-font-size-extra-small) * var(--ml-demo-cad-scale))
  );
  --ml-demo-cad-font-sm: var(--ml-rb-font-sm, calc(var(--el-font-size-small) * var(--ml-demo-cad-scale)));
  --ml-demo-cad-compact-height: var(
    --ml-rb-compact-height,
    calc(var(--el-component-size-small) * var(--ml-demo-cad-scale))
  );
  --ml-demo-cad-surface: var(--ml-rb-surface, var(--el-bg-color));
  --ml-demo-cad-surface-soft: var(--ml-rb-surface-soft, var(--el-fill-color-blank));
  --ml-demo-cad-hover-bg: var(--ml-rb-hover-bg, var(--el-fill-color));
  --ml-demo-cad-hover-border: var(--ml-rb-hover-border, var(--el-border-color));
  --ml-demo-cad-active-bg: var(--ml-rb-active-bg, var(--el-fill-color-dark));
  --ml-demo-cad-active-border: var(--ml-rb-active-border, var(--el-border-color-darker));
  --ml-demo-cad-min-width: calc(150px * var(--ml-demo-cad-scale));
  display: inline-flex;
  align-items: center;
  gap: calc(6px * var(--ml-demo-cad-scale));
  width: 100%;
  max-width: 100%;
  min-width: var(--ml-demo-cad-min-width);
  height: 100%;
}

.ml-demo-cad-dropdown--size-small {
  --ml-demo-cad-scale: 0.92;
}

.ml-demo-cad-dropdown--size-large {
  --ml-demo-cad-scale: 1.08;
}

.ml-demo-cad-dropdown--disabled {
  opacity: 0.7;
}

.ml-demo-cad-dropdown__trigger {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: calc(8px * var(--ml-demo-cad-scale));
  width: 100%;
  min-height: var(--ml-demo-cad-compact-height);
  height: var(--ml-demo-cad-compact-height);
  padding: 0 calc(8px * var(--ml-demo-cad-scale));
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: transparent;
  color: var(--el-text-color-primary);
  box-sizing: border-box;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.ml-demo-cad-dropdown__field {
  min-width: 0;
  flex: 1 1 auto;
}

.ml-demo-cad-dropdown__trigger:hover {
  border-color: var(--ml-demo-cad-hover-border);
  background: var(--ml-demo-cad-hover-bg);
}

.ml-demo-cad-dropdown__trigger:disabled {
  border-color: transparent;
  background: transparent;
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}

.ml-demo-cad-dropdown__preview {
  display: inline-flex;
  align-items: center;
  gap: calc(8px * var(--ml-demo-cad-scale));
  min-width: 0;
  flex: 1 1 auto;
}

.ml-demo-cad-dropdown__leading-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  color: var(--el-text-color-secondary);
  font-size: calc(14px * var(--ml-demo-cad-scale));
}

.ml-demo-cad-dropdown__preview.is-line-type,
.ml-demo-cad-dropdown__preview.is-line-weight {
  gap: calc(10px * var(--ml-demo-cad-scale));
}

.ml-demo-cad-dropdown__swatch {
  --ml-demo-cad-swatch: #7b8794;
  flex: 0 0 calc(18px * var(--ml-demo-cad-scale));
  width: calc(18px * var(--ml-demo-cad-scale));
  height: calc(18px * var(--ml-demo-cad-scale));
  border: 1px solid color-mix(in oklab, var(--ml-demo-cad-swatch) 68%, #1f2933);
  background: var(--ml-demo-cad-swatch);
  box-sizing: border-box;
}

.ml-demo-cad-dropdown__line {
  --ml-demo-cad-line-bg: linear-gradient(90deg, #4f5b67, #4f5b67);
  --ml-demo-cad-line-height: 2px;
  flex: 0 0 calc(64px * var(--ml-demo-cad-scale));
  width: calc(64px * var(--ml-demo-cad-scale));
  height: max(calc(var(--ml-demo-cad-line-height) * var(--ml-demo-cad-scale)), 2px);
  background: var(--ml-demo-cad-line-bg);
  background-repeat: no-repeat;
  background-position: center;
}

.ml-demo-cad-dropdown__value {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: var(--ml-demo-cad-font-sm);
  line-height: 1.25;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ml-demo-cad-dropdown__arrow {
  flex: 0 0 auto;
  margin-left: auto;
  color: var(--el-text-color-secondary);
  transition: transform 0.18s ease;
}

.ml-demo-cad-dropdown__arrow.is-open {
  transform: rotate(180deg);
}

.ml-demo-cad-dropdown__menu {
  display: grid;
  gap: 2px;
}

.ml-demo-cad-dropdown__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: calc(var(--ml-demo-cad-compact-height) + 2px);
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  box-sizing: border-box;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.ml-demo-cad-dropdown__option:hover {
  border-color: var(--el-border-color);
  background: var(--ml-demo-cad-surface-soft);
}

.ml-demo-cad-dropdown__option.is-selected {
  border-color: color-mix(in oklab, var(--el-color-primary) 45%, var(--el-border-color));
  background: color-mix(in oklab, var(--el-color-primary) 10%, var(--el-fill-color-blank));
}

.ml-demo-cad-dropdown__option:active {
  background: var(--ml-demo-cad-active-bg);
  border-color: var(--ml-demo-cad-active-border);
}

.ml-demo-cad-dropdown__option:disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}

.ml-demo-cad-dropdown__option:disabled:hover,
.ml-demo-cad-dropdown__option:disabled:active {
  border-color: transparent;
  background: transparent;
}

.ml-demo-cad-dropdown__option-preview {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1 1 auto;
}

.ml-demo-cad-dropdown__selected-mark {
  color: var(--el-color-primary);
  font-size: var(--ml-demo-cad-font-xs);
  line-height: 1;
}

:global(.ml-demo-cad-dropdown-popper) {
  --ml-demo-cad-scale: var(--ml-demo-cad-popper-scale, 1);
  --ml-demo-cad-font-xs: calc(var(--el-font-size-extra-small) * var(--ml-demo-cad-scale));
  --ml-demo-cad-font-sm: calc(var(--el-font-size-small) * var(--ml-demo-cad-scale));
  --ml-demo-cad-compact-height: calc(var(--el-component-size-small) * var(--ml-demo-cad-scale));
  --ml-demo-cad-surface-soft: var(--el-fill-color-blank);
  --ml-demo-cad-active-bg: var(--el-fill-color-dark);
  --ml-demo-cad-active-border: var(--el-border-color-darker);
  padding: 4px;
  border-radius: 6px;
}

:global(.ml-demo-cad-dropdown-popper .ml-demo-cad-dropdown__menu) {
  display: grid;
  gap: 2px;
}

:global(.ml-demo-cad-dropdown-popper .ml-demo-cad-dropdown__option) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: calc(var(--ml-demo-cad-compact-height) + 2px);
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  box-sizing: border-box;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

:global(.ml-demo-cad-dropdown-popper .ml-demo-cad-dropdown__option:hover) {
  border-color: var(--el-border-color);
  background: var(--ml-demo-cad-surface-soft);
}

:global(.ml-demo-cad-dropdown-popper .ml-demo-cad-dropdown__option.is-selected) {
  border-color: color-mix(in oklab, var(--el-color-primary) 45%, var(--el-border-color));
  background: color-mix(in oklab, var(--el-color-primary) 10%, var(--el-fill-color-blank));
}

:global(.ml-demo-cad-dropdown-popper .ml-demo-cad-dropdown__option:active) {
  background: var(--ml-demo-cad-active-bg);
  border-color: var(--ml-demo-cad-active-border);
}

:global(.ml-demo-cad-dropdown-popper .ml-demo-cad-dropdown__option:disabled) {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}

:global(.ml-demo-cad-dropdown-popper .ml-demo-cad-dropdown__option:disabled:hover),
:global(.ml-demo-cad-dropdown-popper .ml-demo-cad-dropdown__option:disabled:active) {
  border-color: transparent;
  background: transparent;
}

:global(.ml-demo-cad-dropdown-popper .ml-demo-cad-dropdown__option-preview) {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1 1 auto;
}

:global(.ml-demo-cad-dropdown-popper .ml-demo-cad-dropdown__swatch) {
  --ml-demo-cad-swatch: #7b8794;
  display: inline-block;
  flex: 0 0 calc(18px * var(--ml-demo-cad-scale));
  width: calc(18px * var(--ml-demo-cad-scale));
  height: calc(18px * var(--ml-demo-cad-scale));
  border: 1px solid color-mix(in oklab, var(--ml-demo-cad-swatch) 68%, #1f2933);
  background: var(--ml-demo-cad-swatch);
  box-sizing: border-box;
}

:global(.ml-demo-cad-dropdown-popper .ml-demo-cad-dropdown__line) {
  --ml-demo-cad-line-bg: linear-gradient(90deg, #4f5b67, #4f5b67);
  --ml-demo-cad-line-height: 2px;
  display: inline-block;
  flex: 0 0 calc(64px * var(--ml-demo-cad-scale));
  width: calc(64px * var(--ml-demo-cad-scale));
  height: max(calc(var(--ml-demo-cad-line-height) * var(--ml-demo-cad-scale)), 2px);
  background: var(--ml-demo-cad-line-bg);
  background-repeat: no-repeat;
  background-position: center;
}

:global(.ml-demo-cad-dropdown-popper .ml-demo-cad-dropdown__value) {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: var(--ml-demo-cad-font-sm);
  line-height: 1.25;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.ml-demo-cad-dropdown-popper .ml-demo-cad-dropdown__selected-mark) {
  color: var(--el-color-primary);
  font-size: var(--ml-demo-cad-font-xs);
  line-height: 1;
}

:global(.ml-demo-cad-dropdown-popper .el-popover__title) {
  margin: 0;
}

:global(.ml-demo-cad-dropdown-popper--small) {
  --ml-demo-cad-popper-scale: 0.92;
  transform-origin: top left;
}

:global(.ml-demo-cad-dropdown-popper--large) {
  --ml-demo-cad-popper-scale: 1.08;
  transform-origin: top left;
}

:global(.ml-demo-cad-dropdown-popper .el-popover) {
  font-size: calc(var(--el-font-size-small) * var(--ml-demo-cad-popper-scale, 1));
}
</style>
