# Vue3 + Element Plus Ribbon Component Library Requirements (V1)

## 1. Summary
Build a Vue3 + Element Plus Ribbon UI component library aligned with the behavior and information architecture of Syncfusion Vue Ribbon.

Constraints:
- Do not rebuild components that already exist in Element Plus.
- Only implement Ribbon-specific structural, orchestration, and interaction layers missing from Element Plus.
- Provide adapters to compose/drive Element Plus components.

V1 scope (full alignment target):
- Core Ribbon container and tab/group/collection structure
- Advanced item types (group button, segmented, toggle, gallery, template)
- Layout modes and overflow/simplified behavior
- File menu and backstage
- Contextual tabs and key tips
- Runtime dynamic API (add/remove/show/hide/update)
- Customizable tab-right extension slot for host applications

## 2. Core Capabilities and Components
Only components not provided by Element Plus should be newly implemented.

### 2.1 Structure Components
- `MlRibbon`: top-level state container, layout/minimize/active-tab manager, event hub, runtime API entry.
- `MlRibbonTabs` / `MlRibbonTab`: tab system, including normal and contextual tabs.
- `MlRibbonGroup`: group shell with title, icon, priority, launcher support.
- `MlRibbonCollection`: subgroup container for complex item arrangement.
- `MlRibbonItemHost`: unified host for item size mode, disabled status, key tip, and overflow mounting.

### 2.2 Advanced Items
- `MlRibbonButtonGroup`: grouped command buttons with no persistent selected item state.
- `MlRibbonSegmented`: controlled segmented selector built on top of Element Plus `ElSegmented`.
- `MlRibbonToggleButton`: two-state toggle command with optional active/inactive icon mapping.
- `MlRibbonGallery`: categorized gallery with preview and select behavior.
- `MlRibbonTemplateItem`: slot-driven template item integrated with Ribbon context.

### 2.3 Modules
- `MlRibbonFileMenu`: file entry menu model and actions.
- `MlRibbonBackstage`: full-screen backstage shell (navigation + content).
- `MlRibbonKeyTips`: key tip overlay with key sequence handling.
- `MlRibbonContextualTabs`: contextual tab groups with show/hide and style marker.

### 2.4 Runtime API
Expose runtime methods from `MlRibbon` instance:
- `addTab/removeTab/showTab/hideTab/selectTab`
- `addGroup/removeGroup/showGroup/hideGroup`
- `addItem/removeItem/updateItem`
- `enableItem/disableItem`
- `refreshLayout/minimize/toggleSimplified`

Events:
- `tabChange`, `layoutChange`, `itemClick`
- `overflowOpen`, `overflowClose`
- `backstageOpen`, `backstageClose`
- `fileMenuSelect`

## 3. Public Interfaces and Models
- `RibbonLayout = 'classic' | 'simplified'`
- `RibbonItemSize = 'large' | 'medium' | 'small'`
- `RibbonComponentSize = 'large' | 'default' | 'small'`
- `RibbonItemType = 'button' | 'toggle' | 'segmented' | 'dropdown' | 'splitButton' | 'buttonGroup' | 'checkbox' | 'colorPicker' | 'comboBox' | 'gallery' | 'template'`
- `RibbonTabModel`, `RibbonGroupModel`, `RibbonCollectionModel`, `RibbonItemModel`
- `KeyTipModel`, `FileMenuItemModel`
- `RibbonItemModel.hideLabel?: boolean` for icon-only command display
- `RibbonItemModel.props.modelValue?: string | number | boolean` for controlled segmented selection
- `RibbonItemModel.props.modelValue?: boolean` for toggle default state / controlled sync
- `RibbonItemModel.props.activeIcon` / `inactiveIcon` for toggle-state icon switching
- `RibbonItemModel.props.activeValue` / `inactiveValue` for toggle emitted values
- `RibbonGroupModel.footerMenuItems?: RibbonItemModel[]` for footer-triggered secondary commands
- Dropdown item option: `RibbonItemModel.props.syncLabelWithSelection?: boolean` controls whether selected option label replaces trigger label (default `false`)

Controlled props:
- `v-model:activeTab`
- `v-model:layout`
- `v-model:minimized`
- `disabled?: boolean` disables all ribbon interactions while preserving the current visual state
- `size?: RibbonComponentSize` (inherits outer Element Plus `ElConfigProvider` size when omitted)
- `hideLayoutSwitcher?: boolean` (default `false`)
- `hideMinimizeButton?: boolean` (default `false`)
- `hideKeyTipsToggle?: boolean` (default `false`)

Slots:
- `tabs-extra`: host-provided custom content rendered at the right side of ribbon tab area
- `backstage`: host-provided custom backstage content rendered inside backstage shell

## 4. Boundaries with Element Plus
- Reuse Element Plus base controls directly (`ElButton`, `ElDropdown`, `ElCheckbox`, `ElColorPicker`, `ElSelect`, etc.).
- Implement only Ribbon-only behavior in this project (layout orchestration, contextual orchestration, key tip system, backstage shell, gallery semantics).
- Keep an adapter layer for mapping Ribbon model props/events into Element Plus controls.

## 5. Behavioral Acceptance
- Support classic/simplified layout and runtime switching.
- Support temporarily disabling the full ribbon during async host workflows such as opening files.
- Support Element Plus light/dark theme switching without Ribbon-specific remount.
- Group priority impacts collapse/overflow behavior.
- Simplified mode keeps commands interactive via popup/overflow presentation.
- Dropdown trigger supports split behavior: icon executes current option command; label/arrow opens option menu.
- By default, dropdown trigger label remains unchanged after selection while trigger icon follows selected option; label sync is opt-in.
- Keyboard interaction remains consistent between main ribbon and overflow.
- KeyTips support Alt activation, sequence input, and Escape handling.
- Contextual tabs can be dynamically shown/hidden.
- File menu/backstage must have correct open/close and focus behavior.
- Runtime API mutations keep internal state and UI consistent.

## 6. Testing Plan
- Unit tests (Vitest): state machine, runtime API, overflow strategy, key tip matching.
- Component tests (Vue Test Utils): rendering consistency across layouts/overflow and event propagation.
- E2E tests (Playwright): key user workflows, key tips pathing, dynamic tab/group/item operations.

## 7. Naming and Style Rules
- All public component names must use the `Ml` prefix.
- All CSS classes/selectors must use the `ml-` prefix.
- Ribbon component visible UI text must support internationalization:
  - Do not hard-code display strings inside Ribbon components/modules/items.
  - Strings must be provided externally (for example via model fields or dedicated text props).
