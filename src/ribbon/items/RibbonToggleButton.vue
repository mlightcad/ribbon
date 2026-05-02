<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Component } from 'vue'
import MlRibbonButton from './RibbonButton.vue'

const props = withDefaults(
  defineProps<{
    id: string
    label?: string
    modelValue?: boolean
    disabled?: boolean
    hideLabel?: boolean
    activeIcon?: string | Component
    inactiveIcon?: string | Component
    activeLabel?: string
    inactiveLabel?: string
  }>(),
  {
    label: '',
    modelValue: false,
    disabled: false,
    hideLabel: false,
    activeIcon: undefined,
    inactiveIcon: undefined,
    activeLabel: undefined,
    inactiveLabel: undefined,
  },
)

const emit = defineEmits<{ (e: 'change', value: boolean): void }>()

const localValue = ref(Boolean(props.modelValue))

watch(
  () => props.modelValue,
  (value) => {
    localValue.value = Boolean(value)
  },
  { immediate: true },
)

const isActive = computed(() => localValue.value)
const currentIcon = computed(() => (isActive.value ? props.activeIcon ?? props.inactiveIcon : props.inactiveIcon ?? props.activeIcon))
const resolvedLabel = computed(() => {
  const stateLabel = isActive.value ? props.activeLabel?.trim() : props.inactiveLabel?.trim()
  return stateLabel || props.label?.trim() || props.id
})
const shouldShowLabel = computed(() => !props.hideLabel && resolvedLabel.value.length > 0)

function handleClick() {
  if (props.disabled) return
  const nextValue = !localValue.value
  localValue.value = nextValue
  emit('change', nextValue)
}
</script>

<template>
  <MlRibbonButton
    :id="id"
    class="ml-ribbon-toggle"
    :class="{ 'is-active': isActive }"
    :icon="currentIcon"
    :label="resolvedLabel"
    :disabled="disabled"
    :hide-label="!shouldShowLabel"
    :aria-label="resolvedLabel"
    :aria-pressed="String(isActive)"
    @click="handleClick"
  />
</template>
