<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElOption, ElRadioButton, ElRadioGroup, ElSelect } from 'element-plus'
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
import type { RibbonComponentSize, RibbonLayout, RibbonLocaleTexts, RibbonTabModel } from './ribbon'

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
const language = ref<'en-US' | 'zh-CN'>('en-US')
const lastCommand = ref('None')

// Sample ribbon schema that demonstrates common item types, priorities and overflow rules.
const baseTabs: RibbonTabModel[] = [
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
]

const zhCNMap: Record<string, string> = {
  Home: '开始',
  Insert: '插入',
  'Chart Design': '图表设计',
  'Chart Tools': '图表工具',
  Draw: '绘图',
  Clipboard: '剪贴板',
  Font: '字体',
  Editing: '编辑',
  Editor: '编辑器',
  Illustrations: '插图',
  'Chart Style': '图表样式',
  Line: '直线',
  Polyline: '多段线',
  Circle: '圆',
  Rectangle: '矩形',
  Ellipse: '椭圆',
  Paste: '粘贴',
  Cut: '剪切',
  Copy: '复制',
  'Format Painter': '格式刷',
  Select: '选择',
  'Font Family': '字体',
  'Font Size': '字号',
  'Font Color': '字体颜色',
  Shapes: '形状',
  Colors: '颜色',
  Theme: '主题',
  'Ribbon Size': 'Ribbon 尺寸',
  Light: '浅色',
  Dark: '深色',
  Large: '大',
  Default: '默认',
  Small: '小',
  'Press Alt to show Key Tips.': '按 Alt 显示快捷提示。',
  'Try V / X / C / F then P on Home tab.': '在“开始”页签尝试 V / X / C / F 再按 P。',
  'Last command:': '最后命令：',
  'Current language:': '当前语言：',
  Command: '命令',
  New: '新建',
  Open: '打开',
  Save: '保存',
  Info: '信息',
  Print: '打印',
  Share: '共享',
  'Document info': '文档信息',
  'Print settings': '打印设置',
  'Sharing options': '共享选项',
}

const translate = (value?: string) => {
  if (!value) return value
  if (language.value !== 'zh-CN') return value
  return zhCNMap[value] ?? value
}

const tabs = computed<RibbonTabModel[]>(() =>
  baseTabs.map((tab) => ({
    ...tab,
    title: translate(tab.title) ?? tab.title,
    contextualTitle: translate(tab.contextualTitle),
    groups: tab.groups?.map((group) => ({
      ...group,
      title: translate(group.title) ?? group.title,
      collections: group.collections?.map((collection) => ({
        ...collection,
        items: collection.items.map((item) => {
          const options = Array.isArray(item.props?.options)
            ? item.props.options.map((option) => {
                if (!option || typeof option !== 'object') return option
                const optionRecord = option as Record<string, unknown>
                const optionLabel = typeof optionRecord.label === 'string' ? translate(optionRecord.label) : undefined
                return optionLabel ? { ...optionRecord, label: optionLabel } : optionRecord
              })
            : item.props?.options
          return {
            ...item,
            label: typeof item.label === 'string' ? translate(item.label) : item.label,
            props: item.props ? { ...item.props, options } : item.props,
          }
        }),
      })),
      footerMenuItems: group.footerMenuItems?.map((item) => ({
        ...item,
        label: typeof item.label === 'string' ? translate(item.label) : item.label,
      })),
    })),
  })),
)

const fileMenuItems = computed(() => [
  { id: 'new', label: translate('New') ?? 'New' },
  { id: 'open', label: translate('Open') ?? 'Open' },
  { id: 'save', label: translate('Save') ?? 'Save' },
])

const backstageItems = computed(() => [
  { id: 'info', label: translate('Info') ?? 'Info', description: translate('Document info') ?? 'Document info' },
  { id: 'print', label: translate('Print') ?? 'Print', description: translate('Print settings') ?? 'Print settings' },
  {
    id: 'share',
    label: translate('Share') ?? 'Share',
    description: translate('Sharing options') ?? 'Sharing options',
  },
])

const ribbonTexts = computed<RibbonLocaleTexts>(() => {
  if (language.value === 'zh-CN') {
    return {
      layoutSwitcherTooltip: '切换 Ribbon 布局',
      minimizeTooltip: '最小化 Ribbon',
      keyTipsToggleText: '快捷提示',
      overflowTriggerAriaLabel: '打开溢出分组',
      groupOverflowTriggerAriaLabel: '打开分组菜单',
      fileMenuLabel: '文件',
      fileMenuOpenBackstageLabel: '打开后台视图',
      backstageBackLabel: '返回',
      backstageTitle: '后台视图',
      backstageDescription: '在这里管理文档与设置。',
      keyTipsSequencePrefix: '按键序列：',
      keyTipsEmptySequence: '无按键序列',
      contextualTabDefaultTitle: '上下文',
      galleryPreviewFallback: '预览不可用',
    }
  }

  return {}
})

const languageOptions = [
  { value: 'en-US', label: 'English' },
  { value: 'zh-CN', label: '中文' },
] as const

const uiTexts = computed(() => ({
  themeLabel: translate('Theme') ?? 'Theme',
  ribbonSizeLabel: translate('Ribbon Size') ?? 'Ribbon Size',
  light: translate('Light') ?? 'Light',
  dark: translate('Dark') ?? 'Dark',
  large: translate('Large') ?? 'Large',
  default: translate('Default') ?? 'Default',
  small: translate('Small') ?? 'Small',
  keyTipHint: translate('Press Alt to show Key Tips.') ?? 'Press Alt to show Key Tips.',
  sequenceHint: translate('Try V / X / C / F then P on Home tab.') ?? 'Try V / X / C / F then P on Home tab.',
  lastCommand: translate('Last command:') ?? 'Last command:',
  currentLanguage: translate('Current language:') ?? 'Current language:',
  commandLabel: translate('Command') ?? 'Command',
}))


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
    message: `${uiTexts.value.commandLabel}: ${lastCommand.value}`,
    duration: 1500,
    showClose: true,
  })
}
</script>

<template>
  <div class="demo">
    <div class="ml-demo-toolbar">
      <span class="ml-demo-toolbar__label">{{ uiTexts.themeLabel }}</span>
      <ElRadioGroup v-model="theme" size="small">
        <ElRadioButton value="light">{{ uiTexts.light }}</ElRadioButton>
        <ElRadioButton value="dark">{{ uiTexts.dark }}</ElRadioButton>
      </ElRadioGroup>

      <span class="ml-demo-toolbar__label">{{ uiTexts.ribbonSizeLabel }}</span>
      <ElRadioGroup v-model="ribbonSize" size="small">
        <ElRadioButton value="large">{{ uiTexts.large }}</ElRadioButton>
        <ElRadioButton value="default">{{ uiTexts.default }}</ElRadioButton>
        <ElRadioButton value="small">{{ uiTexts.small }}</ElRadioButton>
      </ElRadioGroup>
    </div>
    <div class="ml-demo-status">
      <span class="ml-demo-status__hint">{{ uiTexts.keyTipHint }}</span>
      <span class="ml-demo-status__hint">{{ uiTexts.sequenceHint }}</span>
      <span class="ml-demo-status__value">{{ uiTexts.lastCommand }} {{ lastCommand }}</span>
      <span class="ml-demo-status__value">{{ uiTexts.currentLanguage }} {{ language }}</span>
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
      :texts="ribbonTexts"
      @item-click="onRibbonItemClick"
    >
      <template #tabs-extra>
        <div class="ml-demo-language-switch">
          <ElSelect v-model="language" size="small" class="ml-demo-language-switch__select">
            <ElOption v-for="option in languageOptions" :key="option.value" :value="option.value" :label="option.label" />
          </ElSelect>
        </div>
      </template>
    </MlRibbon>
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

.ml-demo-language-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.ml-demo-language-switch__select {
  width: 110px;
}
</style>
