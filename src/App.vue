<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElRadioButton, ElRadioGroup } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Aim,
  Brush,
  CirclePlus,
  Connection,
  CopyDocument,
  Crop,
  DataLine,
  EditPen,
  Files,
  FullScreen,
  MagicStick,
  Minus,
  Operation,
  Pointer,
  Position,
  Scissor,
  Search,
} from '@element-plus/icons-vue'
import { MlRibbon } from './ribbon'
import type { RibbonComponentSize, RibbonLayout, RibbonTabModel } from './ribbon'

/**
 * @component App
 * @description
 * Interactive playground for `MlRibbon` showcasing layout switching, sizing,
 * contextual tabs, overflow behavior, file menu, backstage, and localization texts.
 *
 * @usage
 * Use this demo as a reference integration:
 * 1. Build a `RibbonTabModel[]` with groups/collections/items.
 * 2. Bind ribbon state through `v-model:active-tab`, `v-model:layout`, and `v-model:minimized`.
 * 3. Provide optional text overrides and file/backstage command sources.
 *
 * @example
 * ```vue
 * <MlRibbon
 *   v-model:active-tab="activeTab"
 *   v-model:layout="layout"
 *   v-model:minimized="minimized"
 *   :tabs="tabs"
 *   :texts="ribbonTexts"
 *   :file-menu-items="fileMenuItems"
 *   :backstage-items="backstageItems"
 * />
 * ```
 */
const layout = ref<RibbonLayout>('classic')
const minimized = ref(false)
const activeTab = ref('home')
// Demo-only size switch; mirrors external consumer-controlled ribbon sizing.
const ribbonSize = ref<RibbonComponentSize>('default')
// Global page theme used by demo toolbar.
const theme = ref<'light' | 'dark'>('light')
const lastCommand = ref('None')

// Sample ribbon schema that demonstrates common item types, priorities and overflow rules.
const tabs = ref<RibbonTabModel[]>([
  {
    id: 'home',
    title: 'Home',
    groups: [
      {
        id: 'draw',
        title: 'Draw',
        orientation: 'row',
        autoWidth: true,
        enableGroupOverflow: false,
        priority: 1,
        footerMenuItems: [
          { id: 'draw-spline', type: 'button', hideLabel: true, size: 'small', props: { icon: DataLine } },
          { id: 'draw-xline', type: 'button', hideLabel: true, size: 'small', props: { icon: Operation } },
          { id: 'draw-ray', type: 'button', hideLabel: true, size: 'small', props: { icon: Position } },
        ],
        collections: [
          {
            id: 'draw-primary',
            layout: 'row',
            items: [
              { id: 'draw-line', type: 'button', label: 'Line', size: 'large', props: { icon: Minus } },
              { id: 'draw-polyline', type: 'button', label: 'Polyline', size: 'large', props: { icon: Connection } },
              {
                id: 'draw-circle',
                type: 'dropdown',
                label: 'Circle',
                size: 'large',
                props: {
                  icon: CirclePlus,
                  options: [
                    { label: 'Center, Radius', value: 'circle-center-radius', icon: CirclePlus },
                    { label: 'Center, Diameter', value: 'circle-center-diameter', icon: Aim },
                    { label: '2-Point', value: 'circle-two-point', icon: Connection },
                    { label: '3-Point', value: 'circle-three-point', icon: DataLine },
                    { label: 'Tangent, Tangent, Radius', value: 'circle-tan-tan-radius', icon: Operation },
                    { label: 'Tangent, Tangent, Tangent', value: 'circle-tan-tan-tan', icon: MagicStick },
                  ],
                },
              },
            ],
          },
          {
            id: 'draw-secondary',
            layout: 'column',
            rows: 3,
            items: [
              {
                id: 'draw-rectangle',
                type: 'dropdown',
                hideLabel: true,
                size: 'small',
                props: {
                  icon: FullScreen,
                  options: [
                    { label: 'Rectangle', value: 'rectangle', icon: FullScreen },
                    { label: '2-Point Rectangle', value: 'rectangle-two-point', icon: Crop },
                    { label: 'Polygon', value: 'polygon', icon: EditPen },
                  ],
                },
              },
              { id: 'draw-ellipse', type: 'button', hideLabel: true, size: 'small', props: { icon: Aim } },
              { id: 'draw-hatch', type: 'button', hideLabel: true, size: 'small', props: { icon: MagicStick } },
            ],
          },
        ],
      },
      {
        id: 'clipboard',
        title: 'Clipboard',
        orientation: 'column',
        enableGroupOverflow: true,
        priority: 10,
        launcher: true,
        showLauncherIcon: true,
        collections: [
          {
            id: 'clipboard-left',
            layout: 'row',
            items: [
              { id: 'paste', type: 'button', label: 'Paste', size: 'large', keyTip: 'V', props: { icon: Files } },
            ],
          },
          {
            id: 'clipboard-right',
            layout: 'column',
            rows: 3,
            items: [
              { id: 'cut', type: 'button', label: 'Cut', size: 'small', keyTip: 'X', props: { icon: Scissor } },
              { id: 'copy', type: 'button', label: 'Copy', size: 'small', keyTip: 'C', props: { icon: CopyDocument } },
              {
                id: 'format-painter',
                type: 'button',
                label: 'Format Painter',
                size: 'small',
                keyTip: 'FP',
                props: { icon: Brush },
              },
            ],
          },
        ],
      },
      {
        id: 'font',
        title: 'Font',
        orientation: 'row',
        priority: 20,
        collections: [
          {
            id: 'font-main',
            layout: 'column',
            items: [
              {
                id: 'font-family',
                type: 'comboBox',
                label: 'Font Family',
                keyTip: 'FF',
                props: {
                  options: [
                    { label: 'Cambria', value: 'cambria' },
                    { label: 'Calibri', value: 'calibri' },
                    { label: 'Arial', value: 'arial' },
                  ],
                },
              },
              {
                id: 'font-size',
                type: 'comboBox',
                label: 'Font Size',
                keyTip: 'FS',
                props: {
                  options: [
                    { label: '11', value: 11 },
                    { label: '12', value: 12 },
                    { label: '14', value: 14 },
                  ],
                },
              },
              { id: 'font-color', type: 'colorPicker', label: 'Font Color', keyTip: 'FC' },
            ],
          },
        ],
      },
      {
        id: 'editing',
        title: 'Editing',
        orientation: 'row',
        enableGroupOverflow: true,
        priority: 80,
        collections: [
          {
            id: 'editing-actions',
            layout: 'column',
            rows: 2,
            items: [
              {
                id: 'find-replace',
                type: 'groupButton',
                keyTip: 'FD',
                props: {
                  options: [
                    { label: 'Find', value: 'find', icon: Search },
                    { label: 'Replace', value: 'replace', icon: EditPen },
                  ],
                },
              },
              {
                id: 'select',
                type: 'dropdown',
                label: 'Select',
                props: {
                  icon: Pointer,
                  options: [
                    { label: 'Select All', value: 'all' },
                    { label: 'Select Objects', value: 'objects' },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        id: 'editor',
        title: 'Editor',
        enableGroupOverflow: true,
        priority: 90,
        collections: [
          {
            id: 'editor-main',
            items: [
              {
                id: 'editor-launch',
                type: 'button',
                label: 'Editor',
                props: { icon: Crop },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'insert',
    title: 'Insert',
    groups: [
      {
        id: 'illustrations',
        title: 'Illustrations',
        priority: 20,
        collections: [
          {
            id: 'ill-1',
            items: [
              {
                id: 'shape',
                type: 'dropdown',
                label: 'Shapes',
                props: {
                  options: [
                    { label: 'Rectangle', value: 'rect' },
                    { label: 'Circle', value: 'circle' },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'chart-tools',
    title: 'Chart Design',
    contextual: true,
    contextualTitle: 'Chart Tools',
    contextualColor: '#eebe77',
    groups: [
      {
        id: 'chart-style',
        title: 'Chart Style',
        collections: [{ id: 'chart-c1', items: [{ id: 'color-scheme', type: 'colorPicker', label: 'Colors' }] }],
      },
    ],
  },
])

// Top-left file menu entries for demoing file/backstage integration.
const fileMenuItems = [
  { id: 'new', label: 'New' },
  { id: 'open', label: 'Open' },
  { id: 'save', label: 'Save' },
]

// Backstage navigation/content data used by the demo page.
const backstageItems = [
  { id: 'info', label: 'Info', description: 'Document info' },
  { id: 'print', label: 'Print', description: 'Print settings' },
  { id: 'share', label: 'Share', description: 'Sharing options' },
]

watch(
  theme,
  // Keep root html classes in sync so css variables can switch themes immediately.
  (value) => {
    document.documentElement.classList.toggle('dark', value === 'dark')
    document.documentElement.classList.toggle('ml-theme-dark', value === 'dark')
    document.documentElement.classList.toggle('ml-theme-light', value === 'light')
  },
  { immediate: true },
)

/**
 * Displays the last executed ribbon command in the demo.
 * @param payload Ribbon click payload.
 */
function onRibbonItemClick(payload: { tabId: string; groupId: string; itemId: string }) {
  lastCommand.value = `${payload.tabId}/${payload.groupId}/${payload.itemId}`
  ElMessage({
    type: 'success',
    message: `Command: ${lastCommand.value}`,
    duration: 1500,
    showClose: true,
  })
}
</script>

<template>
  <div class="demo">
    <div class="ml-demo-toolbar">
      <span class="ml-demo-toolbar__label">Theme</span>
      <ElRadioGroup v-model="theme" size="small">
        <ElRadioButton value="light">Light</ElRadioButton>
        <ElRadioButton value="dark">Dark</ElRadioButton>
      </ElRadioGroup>

      <span class="ml-demo-toolbar__label">Ribbon Size</span>
      <ElRadioGroup v-model="ribbonSize" size="small">
        <ElRadioButton value="large">Large</ElRadioButton>
        <ElRadioButton value="default">Default</ElRadioButton>
        <ElRadioButton value="small">Small</ElRadioButton>
      </ElRadioGroup>
    </div>
    <div class="ml-demo-status">
      <span class="ml-demo-status__hint">Press Alt to show Key Tips.</span>
      <span class="ml-demo-status__hint">Try V / X / C / F then P on Home tab.</span>
      <span class="ml-demo-status__value">Last command: {{ lastCommand }}</span>
    </div>
    <MlRibbon
      :active-layout="layout"
      :size="ribbonSize"
      v-model:layout="layout"
      v-model:minimized="minimized"
      v-model:active-tab="activeTab"
      :tabs="tabs"
      :file-menu-items="fileMenuItems"
      :backstage-items="backstageItems"
      @item-click="onRibbonItemClick"
    />
  </div>
</template>

<style scoped>
.demo {
  padding: 0;
}

.ml-demo-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.ml-demo-toolbar__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ml-demo-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 12px;
}

.ml-demo-status__hint {
  color: var(--el-text-color-secondary);
}

.ml-demo-status__value {
  color: var(--el-text-color-primary);
}
</style>
