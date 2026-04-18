<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElButton, ElIcon } from 'element-plus'
import type { Component } from 'vue'

function iconAsComponent(icon: string | Component | undefined): Component | null {
  if (!icon || typeof icon === 'string') return null
  return icon
}

function iconAsClass(icon: string | Component | undefined): string | null {
  if (typeof icon !== 'string' || icon.trim().length === 0) return null
  return icon
}

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
const currentIconComponent = computed(() => iconAsComponent(currentIcon.value))
const currentIconClass = computed(() => (currentIconComponent.value ? null : iconAsClass(currentIcon.value)))
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
  <ElButton
    class="ml-ribbon-toggle"
    :class="{ 'is-active': isActive }"
    type="default"
    :disabled="disabled"
    :aria-label="resolvedLabel"
    :aria-pressed="String(isActive)"
    @click="handleClick"
  >
    <ElIcon v-if="currentIconComponent" class="ml-ribbon-item-host__icon">
      <component :is="currentIconComponent" />
    </ElIcon>
    <i
      v-else-if="currentIconClass"
      class="ml-ribbon-item-host__icon ml-ribbon-item-host__icon--class"
      :class="currentIconClass"
      aria-hidden="true"
    />
    <span v-if="shouldShowLabel" class="ml-ribbon-item-host__label">{{ resolvedLabel }}</span>
  </ElButton>
</template>
