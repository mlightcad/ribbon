<script setup lang="ts">
import { computed } from 'vue'
import { ElButton, ElTag, useGlobalConfig } from 'element-plus'
import type { RibbonCustomItemBindings } from '../ribbon'

const props = defineProps<
  RibbonCustomItemBindings & {
    title?: string
    description?: string
    status?: string
    primaryLabel?: string
    secondaryLabel?: string
  }
>()

const globalSize = useGlobalConfig('size', '')
const resolvedRibbonSize = computed(() => globalSize.value || 'default')

function handlePrimaryClick() {
  props.emitItemClick(`${props.item.id}-primary`)
}

function handleSecondaryClick() {
  props.emitItemClick(`${props.item.id}-secondary`)
}
</script>

<template>
  <section
    class="ml-demo-custom-panel"
    :class="[`ml-demo-custom-panel--size-${resolvedRibbonSize}`, { 'ml-demo-custom-panel--disabled': disabled }]"
  >
    <header class="ml-demo-custom-panel__header">
      <div class="ml-demo-custom-panel__heading">
        <strong>{{ title ?? item.label ?? item.id }}</strong>
        <span>{{ description }}</span>
      </div>
      <ElTag :size="resolvedRibbonSize" effect="plain" type="info">{{ status }}</ElTag>
    </header>

    <div class="ml-demo-custom-panel__actions">
      <ElButton :size="resolvedRibbonSize" :disabled="disabled" @click="handlePrimaryClick">
        {{ primaryLabel ?? 'Apply' }}
      </ElButton>
      <ElButton :size="resolvedRibbonSize" text bg :disabled="disabled" @click="handleSecondaryClick">
        {{ secondaryLabel ?? 'Reset' }}
      </ElButton>
    </div>
  </section>
</template>

<style scoped>
.ml-demo-custom-panel {
  --ml-demo-custom-panel-scale: 1;
  display: grid;
  align-content: space-between;
  gap: calc(8px * var(--ml-demo-custom-panel-scale));
  min-width: calc(186px * var(--ml-demo-custom-panel-scale));
  height: 100%;
  padding: calc(10px * var(--ml-demo-custom-panel-scale)) calc(12px * var(--ml-demo-custom-panel-scale));
  border: 1px solid var(--el-border-color);
  border-radius: calc(8px * var(--ml-demo-custom-panel-scale));
  background:
    linear-gradient(180deg, color-mix(in oklab, var(--el-color-primary) 7%, white), transparent 62%),
    var(--el-bg-color);
  box-sizing: border-box;
}

.ml-demo-custom-panel--size-small {
  --ml-demo-custom-panel-scale: 0.92;
}

.ml-demo-custom-panel--size-large {
  --ml-demo-custom-panel-scale: 1.08;
}

.ml-demo-custom-panel--disabled {
  opacity: 0.7;
}

.ml-demo-custom-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: calc(10px * var(--ml-demo-custom-panel-scale));
}

.ml-demo-custom-panel__heading {
  display: grid;
  gap: calc(4px * var(--ml-demo-custom-panel-scale));
}

.ml-demo-custom-panel__heading strong {
  font-size: calc(13px * var(--ml-demo-custom-panel-scale));
  line-height: 1.2;
}

.ml-demo-custom-panel__heading span {
  color: var(--el-text-color-secondary);
  font-size: calc(12px * var(--ml-demo-custom-panel-scale));
  line-height: 1.35;
}

.ml-demo-custom-panel__actions {
  display: flex;
  align-items: center;
  gap: calc(6px * var(--ml-demo-custom-panel-scale));
}
</style>
