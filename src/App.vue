<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElOption, ElSelect } from 'element-plus'
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
  Moon,
  Operation,
  Pointer,
  Position,
  Scissor,
  Search,
  Sunny,
} from '@element-plus/icons-vue'
import { MlRibbon } from './ribbon'
import type { RibbonComponentSize, RibbonLayout, RibbonLocaleTexts, RibbonTabModel } from './ribbon'
import MlDemoColorDropdown from './components/MlDemoColorDropdown.vue'
import MlDemoLineTypeDropdown from './components/MlDemoLineTypeDropdown.vue'
import MlDemoLineWeightDropdown from './components/MlDemoLineWeightDropdown.vue'
import type { MlDemoCadDropdownOption } from './components/demoCadDropdown'

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
 * 3. Provide optional text overrides and file commands.
 * 4. Optionally customize backstage entirely via `#backstage` slot.
 * 5. Embed schema-driven custom Vue components inside ribbon groups with `type: 'custom'`.
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
 * />
 * ```
 */
const layout = ref<RibbonLayout>('classic')
const minimized = ref(false)
const activeTab = ref('home')
// Demo-only size switch; mirrors external consumer-controlled ribbon sizing.
const ribbonSize = ref<RibbonComponentSize>('default')
// Global page theme driven by demo ribbon commands.
const theme = ref<'light' | 'dark'>('light')
const gridSnap = ref(true)
const entityColor = ref('bylayer')
const entityLineType = ref('continuous')
const entityLineWeight = ref('0.25')
const language = ref<'en-US' | 'zh-CN'>('en-US')
const lastCommand = ref('None')
const ribbonDisabled = ref(false)

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
                tooltip: 'Rectangle',
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
              { id: 'draw-ellipse', type: 'button', tooltip: 'Ellipse', hideLabel: true, size: 'small', props: { icon: Aim } },
              { id: 'draw-hatch', type: 'button', tooltip: 'Hatch', hideLabel: true, size: 'small', props: { icon: MagicStick } },
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
                type: 'buttonGroup',
                tooltip: 'Find / Replace',
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
        id: 'appearance',
        title: 'Appearance',
        orientation: 'row',
        enableGroupOverflow: true,
        priority: 85,
        collections: [
          {
            id: 'appearance-controls',
            layout: 'column',
            rows: 3,
            items: [
              {
                id: 'theme',
                type: 'segmented',
                label: 'Theme',
                hideLabel: true,
                props: {
                  options: [
                    { label: 'Light', value: 'theme-light', icon: Sunny },
                    { label: 'Dark', value: 'theme-dark', icon: Moon },
                  ],
                },
              },
              {
                id: 'ribbon-size',
                type: 'segmented',
                label: 'Ribbon Size',
                hideLabel: true,
                props: {
                  options: [
                    { label: 'Large', value: 'size-large' },
                    { label: 'Default', value: 'size-default' },
                    { label: 'Small', value: 'size-small' },
                  ],
                },
              },
              {
                id: 'grid-snap',
                type: 'toggle',
                label: 'Grid Snap',
                props: {
                  activeValue: 'grid-snap-on',
                  inactiveValue: 'grid-snap-off',
                  activeIcon: Aim,
                  inactiveIcon: Pointer,
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
    id: 'custom',
    title: 'Properties',
    groups: [
      {
        id: 'entity-properties',
        title: 'Entity Properties',
        orientation: 'row',
        width: 220,
        priority: 20,
        collections: [
          {
            id: 'entity-properties-main',
            layout: 'column',
            rows: 3,
            items: [
              {
                id: 'entity-color',
                type: 'custom',
                size: 'small',
                props: {
                  component: MlDemoColorDropdown,
                },
              },
              {
                id: 'entity-line-type',
                type: 'custom',
                size: 'small',
                props: {
                  component: MlDemoLineTypeDropdown,
                },
              },
              {
                id: 'entity-line-weight',
                type: 'custom',
                size: 'small',
                props: {
                  component: MlDemoLineWeightDropdown,
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
  Properties: '属性',
  'Chart Design': '图表设计',
  'Chart Tools': '图表工具',
  Draw: '绘图',
  Clipboard: '剪贴板',
  Font: '字体',
  Editing: '编辑',
  Appearance: '外观',
  Editor: '编辑器',
  'Entity Properties': '对象属性',
  'Chart Style': '图表样式',
  Color: '颜色',
  'Line Type': '线型',
  'Line Weight': '线宽',
  ByLayer: '随层',
  Red: '红色',
  Yellow: '黄色',
  Green: '绿色',
  Cyan: '青色',
  Blue: '蓝色',
  Magenta: '洋红',
  Continuous: '连续',
  Dashed: '虚线',
  Hidden: '隐藏线',
  Center: '中心线',
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
  'Grid Snap': '栅格捕捉',
  Light: '浅色',
  Dark: '深色',
  Large: '大',
  Default: '默认',
  Small: '小',
  'Press Alt to show Key Tips.': '按 Alt 显示快捷提示。',
  'Try V / X / C / F then P on Home tab.': '在“开始”页签尝试 V / X / C / F 再按 P。',
  'Last command:': '最后命令：',
  'Current language:': '当前语言：',
  'Ribbon state:': 'Ribbon 状态：',
  Enabled: '已启用',
  Disabled: '已禁用',
  'Disable Ribbon': '禁用 Ribbon',
  'Enable Ribbon': '启用 Ribbon',
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

function resolveAppearanceModelValue(itemId: string): string | boolean | undefined {
  switch (itemId) {
    case 'theme':
      return theme.value === 'dark' ? 'theme-dark' : 'theme-light'
    case 'ribbon-size':
      return `size-${ribbonSize.value}`
    case 'grid-snap':
      return gridSnap.value
    default:
      return undefined
  }
}

function translateRecordStrings(value?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!value) return value
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, typeof entry === 'string' ? translate(entry) : entry]),
  )
}

const cadColorOptions = computed<MlDemoCadDropdownOption[]>(() => [
  { value: 'bylayer', label: translate('ByLayer') ?? 'ByLayer', swatch: '#7b8794', command: 'entity-color-bylayer' },
  { value: 'red', label: translate('Red') ?? 'Red', swatch: '#d64541', command: 'entity-color-red' },
  { value: 'yellow', label: translate('Yellow') ?? 'Yellow', swatch: '#f2c94c', command: 'entity-color-yellow' },
  { value: 'green', label: translate('Green') ?? 'Green', swatch: '#27ae60', command: 'entity-color-green' },
  { value: 'cyan', label: translate('Cyan') ?? 'Cyan', swatch: '#00acc1', command: 'entity-color-cyan' },
  { value: 'blue', label: translate('Blue') ?? 'Blue', swatch: '#2f80ed', command: 'entity-color-blue' },
  { value: 'magenta', label: translate('Magenta') ?? 'Magenta', swatch: '#bb6bd9', command: 'entity-color-magenta' },
])

const cadLineTypeOptions = computed<MlDemoCadDropdownOption[]>(() => [
  {
    value: 'bylayer',
    label: translate('ByLayer') ?? 'ByLayer',
    pattern: 'solid',
    command: 'entity-line-type-bylayer',
  },
  {
    value: 'continuous',
    label: translate('Continuous') ?? 'Continuous',
    pattern: 'solid',
    command: 'entity-line-type-continuous',
  },
  {
    value: 'dashed',
    label: translate('Dashed') ?? 'Dashed',
    pattern: 'dashed',
    command: 'entity-line-type-dashed',
  },
  {
    value: 'hidden',
    label: translate('Hidden') ?? 'Hidden',
    pattern: 'hidden',
    command: 'entity-line-type-hidden',
  },
  {
    value: 'center',
    label: translate('Center') ?? 'Center',
    pattern: 'center',
    command: 'entity-line-type-center',
  },
])

const cadLineWeightOptions = computed<MlDemoCadDropdownOption[]>(() => [
  { value: 'default', label: translate('Default') ?? 'Default', weight: 2, command: 'entity-line-weight-default' },
  { value: '0.13', label: '0.13 mm', weight: 1, command: 'entity-line-weight-0.13' },
  { value: '0.25', label: '0.25 mm', weight: 2, command: 'entity-line-weight-0.25' },
  { value: '0.35', label: '0.35 mm', weight: 3, command: 'entity-line-weight-0.35' },
  { value: '0.50', label: '0.50 mm', weight: 4, command: 'entity-line-weight-0.50' },
  { value: '0.70', label: '0.70 mm', weight: 5, command: 'entity-line-weight-0.70' },
])

function resolveCustomComponentProps(itemId: string): Record<string, unknown> | undefined {
  switch (itemId) {
    case 'entity-color':
      return {
        title: translate('Color') ?? 'Color',
        modelValue: entityColor.value,
        options: cadColorOptions.value,
      }
    case 'entity-line-type':
      return {
        title: translate('Line Type') ?? 'Line Type',
        modelValue: entityLineType.value,
        options: cadLineTypeOptions.value,
      }
    case 'entity-line-weight':
      return {
        title: translate('Line Weight') ?? 'Line Weight',
        modelValue: entityLineWeight.value,
        options: cadLineWeightOptions.value,
      }
    default:
      return undefined
  }
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
          const componentProps = {
            ...(translateRecordStrings(item.props?.componentProps as Record<string, unknown> | undefined) ?? {}),
            ...(resolveCustomComponentProps(item.id) ?? {}),
          }
          const modelValue = resolveAppearanceModelValue(item.id)
          const nextProps = item.props
            ? { ...item.props, options, componentProps }
            : options || componentProps
              ? { options, componentProps }
              : undefined
          return {
            ...item,
            label: typeof item.label === 'string' ? translate(item.label) : item.label,
            tooltip: typeof item.tooltip === 'string' ? translate(item.tooltip) : item.tooltip,
            props: modelValue === undefined ? nextProps : { ...(nextProps ?? {}), modelValue },
          }
        }),
      })),
      footerMenuItems: group.footerMenuItems?.map((item) => ({
        ...item,
        label: typeof item.label === 'string' ? translate(item.label) : item.label,
        tooltip: typeof item.tooltip === 'string' ? translate(item.tooltip) : item.tooltip,
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
  keyTipHint: translate('Press Alt to show Key Tips.') ?? 'Press Alt to show Key Tips.',
  sequenceHint: translate('Try V / X / C / F then P on Home tab.') ?? 'Try V / X / C / F then P on Home tab.',
  lastCommand: translate('Last command:') ?? 'Last command:',
  currentLanguage: translate('Current language:') ?? 'Current language:',
  ribbonState: translate('Ribbon state:') ?? 'Ribbon state:',
  enabled: translate('Enabled') ?? 'Enabled',
  disabled: translate('Disabled') ?? 'Disabled',
  disableRibbon: translate('Disable Ribbon') ?? 'Disable Ribbon',
  enableRibbon: translate('Enable Ribbon') ?? 'Enable Ribbon',
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
  switch (payload.itemId) {
    case 'theme-light':
      theme.value = 'light'
      break
    case 'theme-dark':
      theme.value = 'dark'
      break
    case 'size-large':
      ribbonSize.value = 'large'
      break
    case 'size-default':
      ribbonSize.value = 'default'
      break
    case 'size-small':
      ribbonSize.value = 'small'
      break
    case 'grid-snap-on':
      gridSnap.value = true
      break
    case 'grid-snap-off':
      gridSnap.value = false
      break
    case 'entity-color-bylayer':
      entityColor.value = 'bylayer'
      break
    case 'entity-color-red':
      entityColor.value = 'red'
      break
    case 'entity-color-yellow':
      entityColor.value = 'yellow'
      break
    case 'entity-color-green':
      entityColor.value = 'green'
      break
    case 'entity-color-cyan':
      entityColor.value = 'cyan'
      break
    case 'entity-color-blue':
      entityColor.value = 'blue'
      break
    case 'entity-color-magenta':
      entityColor.value = 'magenta'
      break
    case 'entity-line-type-bylayer':
      entityLineType.value = 'bylayer'
      break
    case 'entity-line-type-continuous':
      entityLineType.value = 'continuous'
      break
    case 'entity-line-type-dashed':
      entityLineType.value = 'dashed'
      break
    case 'entity-line-type-hidden':
      entityLineType.value = 'hidden'
      break
    case 'entity-line-type-center':
      entityLineType.value = 'center'
      break
    case 'entity-line-weight-default':
      entityLineWeight.value = 'default'
      break
    case 'entity-line-weight-0.13':
      entityLineWeight.value = '0.13'
      break
    case 'entity-line-weight-0.25':
      entityLineWeight.value = '0.25'
      break
    case 'entity-line-weight-0.35':
      entityLineWeight.value = '0.35'
      break
    case 'entity-line-weight-0.50':
      entityLineWeight.value = '0.50'
      break
    case 'entity-line-weight-0.70':
      entityLineWeight.value = '0.70'
      break
  }

  lastCommand.value = `${payload.tabId}/${payload.groupId}/${payload.itemId}`
  ElMessage({
    type: 'success',
    message: `${uiTexts.value.commandLabel}: ${lastCommand.value}`,
    duration: 1500,
    showClose: true,
  })
}

function setRibbonDisabled(value: boolean) {
  ribbonDisabled.value = value
}
</script>

<template>
  <div class="demo">
    <div class="ml-demo-toolbar">
      <ElButton size="small" :disabled="ribbonDisabled" @click="setRibbonDisabled(true)">
        {{ uiTexts.disableRibbon }}
      </ElButton>
      <ElButton size="small" :disabled="!ribbonDisabled" @click="setRibbonDisabled(false)">
        {{ uiTexts.enableRibbon }}
      </ElButton>
    </div>
    <div class="ml-demo-status">
      <span class="ml-demo-status__hint">{{ uiTexts.keyTipHint }}</span>
      <span class="ml-demo-status__hint">{{ uiTexts.sequenceHint }}</span>
      <span class="ml-demo-status__value">{{ uiTexts.lastCommand }} {{ lastCommand }}</span>
      <span class="ml-demo-status__value">{{ uiTexts.currentLanguage }} {{ language }}</span>
      <span class="ml-demo-status__value">
        {{ uiTexts.ribbonState }} {{ ribbonDisabled ? uiTexts.disabled : uiTexts.enabled }}
      </span>
    </div>
    <MlRibbon
      :active-layout="layout"
      :size="ribbonSize"
      :disabled="ribbonDisabled"
      v-model:layout="layout"
      v-model:minimized="minimized"
      v-model:active-tab="activeTab"
      :tabs="tabs"
      :file-menu-items="fileMenuItems"
      :texts="ribbonTexts"
      :tooltip-show-after="1000"
      :tooltip-hide-after="0"
      @item-click="onRibbonItemClick"
    >
      <template #tabs-extra="{ disabled }">
        <div class="ml-demo-language-switch">
          <ElSelect v-model="language" size="small" class="ml-demo-language-switch__select" :disabled="disabled">
            <ElOption
              v-for="option in languageOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </ElSelect>
        </div>
      </template>
      <template #backstage="{ close, size }">
        <section class="ml-demo-backstage" :class="`ml-demo-backstage--size-${size}`">
          <aside class="ml-demo-backstage__nav">
            <button type="button" class="ml-demo-backstage__back" @click="close">
              {{ ribbonTexts.backstageBackLabel ?? 'Back' }}
            </button>
            <ul class="ml-demo-backstage__menu">
              <li v-for="item in backstageItems" :key="item.id" class="ml-demo-backstage__menu-item">
                <strong>{{ item.label }}</strong>
                <span>{{ item.description }}</span>
              </li>
            </ul>
          </aside>
          <section class="ml-demo-backstage__content">
            <h2>{{ ribbonTexts.backstageTitle ?? 'Backstage' }}</h2>
            <p>{{ ribbonTexts.backstageDescription ?? 'Manage your document and settings here.' }}</p>
            <p class="ml-demo-backstage__meta">This whole area is rendered from the `#backstage` slot.</p>
          </section>
        </section>
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
  margin-bottom: 8px;
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

:deep(.ml-ribbon-group[data-group-id='entity-properties'] .ml-ribbon-group__content) {
  width: 100%;
}

:deep(.ml-ribbon-group[data-group-id='entity-properties'] .ml-ribbon-collection--column) {
  width: 100%;
  grid-auto-columns: minmax(0, 1fr);
}

.ml-demo-backstage {
  --ml-demo-backstage-scale: 1;
  display: grid;
  grid-template-columns: calc(260px * var(--ml-demo-backstage-scale)) 1fr;
  height: 100%;
}

.ml-demo-backstage.ml-demo-backstage--size-small {
  --ml-demo-backstage-scale: 0.92;
}

.ml-demo-backstage.ml-demo-backstage--size-large {
  --ml-demo-backstage-scale: 1.08;
}

.ml-demo-backstage__nav {
  border-right: 1px solid var(--el-border-color);
  padding: calc(16px * var(--ml-demo-backstage-scale));
  background: var(--el-fill-color-lighter);
}

.ml-demo-backstage__back {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-color-primary);
  color: #fff;
  padding: calc(6px * var(--ml-demo-backstage-scale)) calc(12px * var(--ml-demo-backstage-scale));
  cursor: pointer;
}

.ml-demo-backstage__menu {
  list-style: none;
  padding: 0;
  margin: calc(14px * var(--ml-demo-backstage-scale)) 0 0;
  display: grid;
  gap: calc(10px * var(--ml-demo-backstage-scale));
}

.ml-demo-backstage__menu-item {
  display: grid;
  gap: 4px;
  font-size: calc(13px * var(--ml-demo-backstage-scale));
}

.ml-demo-backstage__menu-item span {
  color: var(--el-text-color-secondary);
}

.ml-demo-backstage__content {
  padding: calc(24px * var(--ml-demo-backstage-scale));
}

.ml-demo-backstage__content h2 {
  margin: 0 0 calc(10px * var(--ml-demo-backstage-scale));
  font-size: calc(28px * var(--ml-demo-backstage-scale));
}

.ml-demo-backstage__content p {
  margin: 0 0 calc(10px * var(--ml-demo-backstage-scale));
}

.ml-demo-backstage__meta {
  color: var(--el-text-color-secondary);
  font-size: calc(13px * var(--ml-demo-backstage-scale));
}
</style>
