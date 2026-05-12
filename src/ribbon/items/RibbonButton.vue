<script setup lang="ts">
import { computed } from 'vue'
import { ElButton, ElIcon } from 'element-plus'
import type { Component } from 'vue'

defineOptions({
  name: 'MlRibbonButton',
})

/**
 * @component MlRibbonButton
 * @description
 * Shared ribbon command button renderer. It centralizes the icon/label markup
 * used by standard ribbon buttons so custom item components can reuse the same
 * Element Plus theme, ribbon size variables, and large/small layout rules.
 *
 * @prop id - Stable command identifier used as fallback text and data id.
 * @prop label - Visible label. Empty strings intentionally render no label.
 * @prop icon - Optional Vue icon component or CSS class name.
 * @prop disabled - Disables interaction.
 * @prop hideLabel - Hides the visible label while preserving aria text.
 * @prop ariaLabel - Explicit accessible label.
 * @prop iconSize - Optional CSS font-size for the icon.
 *
 * @event click - Emitted when the command is activated.
 *
 * @slot icon - Custom icon/preview content rendered in the ribbon icon slot.
 * @slot label - Custom label content rendered in the ribbon label slot.
 * @slot default - Optional trailing content.
 */
const props = withDefaults(
  defineProps<{
    id: string
    label?: string
    icon?: string | Component
    disabled?: boolean
    hideLabel?: boolean
    ariaLabel?: string
    iconSize?: string
    size?: 'large' | 'default' | 'small'
    buttonType?:
      | 'default'
      | 'primary'
      | 'success'
      | 'warning'
      | 'danger'
      | 'info'
      | 'text'
    nativeType?: 'button' | 'submit' | 'reset'
  }>(),
  {
    label: undefined,
    icon: undefined,
    disabled: false,
    hideLabel: false,
    ariaLabel: undefined,
    iconSize: undefined,
    size: undefined,
    buttonType: 'default',
    nativeType: 'button',
  },
)

const emit = defineEmits<{ (e: 'click', event: MouseEvent): void }>()

const resolvedLabel = computed(() => {
  if (props.label !== undefined) return props.label.trim()
  return props.id
})
const shouldShowLabel = computed(
  () => !props.hideLabel && resolvedLabel.value.length > 0,
)
const resolvedAriaLabel = computed(
  () => props.ariaLabel?.trim() || resolvedLabel.value || props.id,
)
const iconComponent = computed<Component | null>(() => {
  if (!props.icon || typeof props.icon === 'string') return null
  return props.icon
})
const iconClass = computed<string | null>(() => {
  if (typeof props.icon !== 'string') return null
  const normalized = props.icon.trim()
  return normalized.length > 0 ? normalized : null
})
const iconModeClass = computed(() =>
  shouldShowLabel.value
    ? 'ml-ribbon-item-host__icon--with-label'
    : 'ml-ribbon-item-host__icon--icon-only',
)
const iconStyle = computed(() => {
  if (!props.iconSize) return undefined
  return { fontSize: props.iconSize }
})

function handleClick(event: MouseEvent) {
  if (props.disabled) return
  emit('click', event)
}
</script>

<template>
  <ElButton
    class="ml-ribbon-button"
    :data-ribbon-button-id="id"
    :type="buttonType"
    :size="size"
    :native-type="nativeType"
    :disabled="disabled"
    :aria-label="resolvedAriaLabel"
    @click="handleClick"
  >
    <span
      v-if="$slots.icon"
      class="ml-ribbon-item-host__icon ml-ribbon-button__icon"
      :class="iconModeClass"
      :style="iconStyle"
      aria-hidden="true"
    >
      <slot name="icon" />
    </span>
    <ElIcon
      v-else-if="iconComponent"
      class="ml-ribbon-item-host__icon ml-ribbon-button__icon"
      :class="iconModeClass"
      :style="iconStyle"
    >
      <component :is="iconComponent" />
    </ElIcon>
    <i
      v-else-if="iconClass"
      class="ml-ribbon-item-host__icon ml-ribbon-item-host__icon--class ml-ribbon-button__icon"
      :class="[iconClass, iconModeClass]"
      :style="iconStyle"
      aria-hidden="true"
    />
    <span
      v-if="shouldShowLabel"
      class="ml-ribbon-item-host__label ml-ribbon-button__label"
    >
      <slot name="label">{{ resolvedLabel }}</slot>
    </span>
    <slot />
  </ElButton>
</template>
