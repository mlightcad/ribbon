<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElPopover, useGlobalConfig } from 'element-plus'
import { MlRibbonButton } from '../ribbon'
import type { RibbonCustomItemBindings } from '../ribbon'

defineOptions({
  name: 'MlDemoHatchButton',
})

interface MlDemoHatchPatternOption {
  value: string
  label: string
  command?: string
  pattern: 'solid' | 'ansi31' | 'ansi37' | 'grid' | 'cross' | 'brick'
}

interface MlDemoHatchButtonProps extends RibbonCustomItemBindings {
  title?: string
  modelValue?: string
  options?: MlDemoHatchPatternOption[]
  popoverWidth?: number
}

const props = withDefaults(defineProps<MlDemoHatchButtonProps>(), {
  title: 'Hatch',
  modelValue: '',
  options: () => [
    {
      value: 'solid',
      label: 'Solid',
      pattern: 'solid',
      command: 'hatch-pattern-solid',
    },
    {
      value: 'ansi31',
      label: 'ANSI31',
      pattern: 'ansi31',
      command: 'hatch-pattern-ansi31',
    },
    {
      value: 'ansi37',
      label: 'ANSI37',
      pattern: 'ansi37',
      command: 'hatch-pattern-ansi37',
    },
    {
      value: 'grid',
      label: 'Grid',
      pattern: 'grid',
      command: 'hatch-pattern-grid',
    },
    {
      value: 'cross',
      label: 'Cross',
      pattern: 'cross',
      command: 'hatch-pattern-cross',
    },
    {
      value: 'brick',
      label: 'Brick',
      pattern: 'brick',
      command: 'hatch-pattern-brick',
    },
  ],
  popoverWidth: 236,
})

const popoverVisible = ref(false)
const localValue = ref(props.modelValue)
const globalSize = useGlobalConfig('size', '')
const resolvedRibbonSize = computed(() => globalSize.value || 'default')
const popoverClass = computed(
  () =>
    `ml-demo-hatch-button-popper ml-demo-hatch-button-popper--${resolvedRibbonSize.value}`,
)
const selectedOption = computed(
  () =>
    props.options.find((option) => option.value === localValue.value) ??
    props.options[0] ??
    null,
)
const accessibleLabel = computed(
  () => props.title || props.item.label || props.item.id,
)

watch(
  () => props.modelValue,
  (value) => {
    localValue.value = value
  },
  { immediate: true },
)

watch(
  () => props.disabled,
  (value) => {
    if (value) popoverVisible.value = false
  },
)

function selectPattern(option: MlDemoHatchPatternOption) {
  if (props.disabled) return
  localValue.value = option.value
  props.emitItemClick(option.command ?? `${props.item.id}-${option.value}`)
  popoverVisible.value = false
}

function patternBackground(option: MlDemoHatchPatternOption | null) {
  const stroke = '#39424e'
  const soft = 'transparent'
  switch (option?.pattern) {
    case 'solid':
      return `linear-gradient(135deg, ${stroke}, ${stroke})`
    case 'ansi37':
      return `repeating-linear-gradient(45deg, ${stroke} 0 1px, ${soft} 1px 8px), repeating-linear-gradient(-45deg, ${stroke} 0 1px, ${soft} 1px 8px)`
    case 'grid':
      return `repeating-linear-gradient(0deg, ${stroke} 0 1px, ${soft} 1px 9px), repeating-linear-gradient(90deg, ${stroke} 0 1px, ${soft} 1px 9px)`
    case 'cross':
      return `repeating-linear-gradient(0deg, ${stroke} 0 1px, ${soft} 1px 7px), repeating-linear-gradient(90deg, ${stroke} 0 1px, ${soft} 1px 7px), repeating-linear-gradient(45deg, ${stroke} 0 1px, ${soft} 1px 10px)`
    case 'brick':
      return `repeating-linear-gradient(0deg, ${stroke} 0 1px, ${soft} 1px 10px), repeating-linear-gradient(90deg, ${stroke} 0 1px, ${soft} 1px 18px), repeating-linear-gradient(90deg, ${soft} 0 9px, ${stroke} 9px 10px, ${soft} 10px 18px)`
    case 'ansi31':
    default:
      return `repeating-linear-gradient(45deg, ${stroke} 0 1px, ${soft} 1px 8px)`
  }
}

function patternStyle(option: MlDemoHatchPatternOption | null) {
  return {
    '--ml-demo-hatch-pattern-bg': patternBackground(option),
  }
}
</script>

<template>
  <section
    class="ml-demo-hatch-button"
    :class="{ 'ml-demo-hatch-button--disabled': disabled }"
    :aria-disabled="disabled"
  >
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
        <MlRibbonButton
          :id="item.id"
          class="ml-demo-hatch-button__trigger"
          :label="title"
          :disabled="disabled"
          :aria-label="accessibleLabel"
        >
          <template #icon>
            <span
              class="ml-demo-hatch-button__icon-pattern"
              :style="patternStyle(selectedOption)"
              aria-hidden="true"
            />
          </template>
        </MlRibbonButton>
      </template>

      <div class="ml-demo-hatch-button__panel">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="ml-demo-hatch-button__option"
          :class="{ 'is-selected': option.value === selectedOption?.value }"
          :disabled="disabled"
          @click="selectPattern(option)"
        >
          <span
            class="ml-demo-hatch-button__option-pattern"
            :style="patternStyle(option)"
            aria-hidden="true"
          />
          <span class="ml-demo-hatch-button__option-label">{{
            option.label
          }}</span>
          <span
            v-if="option.value === selectedOption?.value"
            class="ml-demo-hatch-button__selected-mark"
            aria-hidden="true"
          />
        </button>
      </div>
    </ElPopover>
  </section>
</template>

<style scoped>
.ml-demo-hatch-button {
  --ml-demo-hatch-scale: var(--ml-rb-scale, 1);
  --ml-demo-hatch-compact-height: var(
    --ml-rb-compact-height,
    calc(var(--el-component-size-small) * var(--ml-demo-hatch-scale))
  );
  --ml-demo-hatch-font-sm: var(
    --ml-rb-font-sm,
    calc(var(--el-font-size-small) * var(--ml-demo-hatch-scale))
  );
  display: inline-flex;
  align-items: stretch;
  height: 100%;
}

.ml-demo-hatch-button--disabled {
  opacity: 0.7;
}

.ml-demo-hatch-button__trigger {
  min-width: calc(62px * var(--ml-demo-hatch-scale));
}

.ml-demo-hatch-button__icon-pattern,
.ml-demo-hatch-button__option-pattern {
  --ml-demo-hatch-pattern-bg: repeating-linear-gradient(
    45deg,
    #39424e 0 1px,
    transparent 1px 8px
  );
  display: inline-block;
  border: 1px solid var(--el-border-color);
  background: var(--ml-demo-hatch-pattern-bg), var(--el-fill-color-blank);
  box-sizing: border-box;
}

.ml-demo-hatch-button__icon-pattern {
  width: calc(28px * var(--ml-demo-hatch-scale));
  height: calc(28px * var(--ml-demo-hatch-scale));
}

.ml-demo-hatch-button__panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
}

.ml-demo-hatch-button__option {
  display: grid;
  grid-template-columns:
    calc(28px * var(--ml-demo-hatch-scale)) minmax(0, 1fr)
    8px;
  align-items: center;
  gap: 8px;
  min-height: calc(var(--ml-demo-hatch-compact-height) + 8px);
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--el-text-color-primary);
  cursor: pointer;
  text-align: left;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.ml-demo-hatch-button__option:hover {
  border-color: var(--el-border-color);
  background: var(--el-fill-color-blank);
}

.ml-demo-hatch-button__option.is-selected {
  border-color: color-mix(
    in oklab,
    var(--el-color-primary) 45%,
    var(--el-border-color)
  );
  background: color-mix(
    in oklab,
    var(--el-color-primary) 10%,
    var(--el-fill-color-blank)
  );
}

.ml-demo-hatch-button__option:disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}

.ml-demo-hatch-button__option-pattern {
  width: calc(28px * var(--ml-demo-hatch-scale));
  height: calc(22px * var(--ml-demo-hatch-scale));
}

.ml-demo-hatch-button__option-label {
  min-width: 0;
  overflow: hidden;
  font-size: var(--ml-demo-hatch-font-sm);
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ml-demo-hatch-button__selected-mark {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

:global(.ml-demo-hatch-button-popper) {
  --ml-demo-hatch-scale: var(--ml-demo-hatch-popper-scale, 1);
  --ml-demo-hatch-compact-height: calc(
    var(--el-component-size-small) * var(--ml-demo-hatch-scale)
  );
  --ml-demo-hatch-font-sm: calc(
    var(--el-font-size-small) * var(--ml-demo-hatch-scale)
  );
  padding: 4px;
  border-radius: 6px;
}

:global(.ml-demo-hatch-button-popper .ml-demo-hatch-button__panel) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
}

:global(.ml-demo-hatch-button-popper .ml-demo-hatch-button__option) {
  display: grid;
  grid-template-columns:
    calc(28px * var(--ml-demo-hatch-scale)) minmax(0, 1fr)
    8px;
  align-items: center;
  gap: 8px;
  min-height: calc(var(--ml-demo-hatch-compact-height) + 8px);
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--el-text-color-primary);
  cursor: pointer;
  text-align: left;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
}

:global(.ml-demo-hatch-button-popper .ml-demo-hatch-button__option:hover) {
  border-color: var(--el-border-color);
  background: var(--el-fill-color-blank);
}

:global(
  .ml-demo-hatch-button-popper .ml-demo-hatch-button__option.is-selected
) {
  border-color: color-mix(
    in oklab,
    var(--el-color-primary) 45%,
    var(--el-border-color)
  );
  background: color-mix(
    in oklab,
    var(--el-color-primary) 10%,
    var(--el-fill-color-blank)
  );
}

:global(.ml-demo-hatch-button-popper .ml-demo-hatch-button__option:disabled) {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}

:global(.ml-demo-hatch-button-popper .ml-demo-hatch-button__option-pattern) {
  --ml-demo-hatch-pattern-bg: repeating-linear-gradient(
    45deg,
    #39424e 0 1px,
    transparent 1px 8px
  );
  display: inline-block;
  width: calc(28px * var(--ml-demo-hatch-scale));
  height: calc(22px * var(--ml-demo-hatch-scale));
  border: 1px solid var(--el-border-color);
  background: var(--ml-demo-hatch-pattern-bg), var(--el-fill-color-blank);
  box-sizing: border-box;
}

:global(.ml-demo-hatch-button-popper .ml-demo-hatch-button__option-label) {
  min-width: 0;
  overflow: hidden;
  font-size: var(--ml-demo-hatch-font-sm);
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.ml-demo-hatch-button-popper .ml-demo-hatch-button__selected-mark) {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

:global(.ml-demo-hatch-button-popper--small) {
  --ml-demo-hatch-popper-scale: 0.92;
}

:global(.ml-demo-hatch-button-popper--large) {
  --ml-demo-hatch-popper-scale: 1.08;
}
</style>
