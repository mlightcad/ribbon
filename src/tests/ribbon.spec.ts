import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { ElConfigProvider } from 'element-plus'
import MlRibbon from '../ribbon/components/Ribbon.vue'
import MlRibbonItemHost from '../ribbon/components/RibbonItemHost.vue'
import MlRibbonBackstage from '../ribbon/modules/RibbonBackstage.vue'
import MlRibbonFileMenu from '../ribbon/modules/RibbonFileMenu.vue'
import type { RibbonTabModel } from '../ribbon'

const tabs: RibbonTabModel[] = [
  {
    id: 'home',
    title: 'Home',
    groups: [
      {
        id: 'grp',
        title: 'Group',
        collections: [{ id: 'c1', items: [{ id: 'btn1', type: 'button', label: 'Run' }] }],
      },
    ],
  },
]

describe('MlRibbonBackstage', () => {
  it('applies size class from ribbon size context', async () => {
    const wrapper = mount(MlRibbonBackstage, {
      props: {
        open: true,
        size: 'small',
      },
      global: {
        stubs: {
          ElDrawer: {
            props: ['modelValue'],
            template: '<div v-if="modelValue"><slot /></div>',
          },
        },
      },
    })

    try {
      const backstage = wrapper.find('.ml-ribbon-backstage')
      expect(backstage.exists()).toBe(true)
      expect(backstage.classes()).toContain('ml-ribbon-backstage--size-small')

      await wrapper.setProps({ size: 'large' })
      expect(backstage.classes()).toContain('ml-ribbon-backstage--size-large')
    } finally {
      wrapper.unmount()
    }
  })

  it('renders custom slot content and skips default layout when slot is provided', () => {
    const wrapper = mount(MlRibbonBackstage, {
      props: {
        open: true,
      },
      slots: {
        default: '<div class="ml-test-custom-backstage">Custom Backstage</div>',
      },
      global: {
        stubs: {
          ElDrawer: {
            props: ['modelValue'],
            template: '<div v-if="modelValue"><slot /></div>',
          },
        },
      },
    })

    try {
      expect(wrapper.find('.ml-test-custom-backstage').exists()).toBe(true)
      expect(wrapper.find('.ml-ribbon-backstage__nav').exists()).toBe(false)
      expect(wrapper.find('.ml-ribbon-backstage__content').exists()).toBe(false)
    } finally {
      wrapper.unmount()
    }
  })
})

describe('MlRibbon', () => {
  it('renders tab and item', () => {
    const wrapper = mount(MlRibbon, { props: { tabs } })
    expect(wrapper.text()).toContain('Home')
    expect(wrapper.text()).toContain('Run')
  })

  it('supports layout updates', async () => {
    const wrapper = mount(MlRibbon, { props: { tabs, activeTab: 'home' } })
    await wrapper.setProps({ layout: 'simplified' })
    expect(wrapper.find('.ml-ribbon').classes()).toContain('ml-ribbon--simplified')
  })

  it('toggles inline key tips with Alt and shows active tab item tip labels', async () => {
    const keyTipTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'grp',
            title: 'Clipboard',
            collections: [{ id: 'c1', items: [{ id: 'paste', type: 'button', label: 'Paste', keyTip: 'V' }] }],
          },
        ],
      },
    ]
    const wrapper = mount(MlRibbon, { props: { tabs: keyTipTabs, activeTab: 'home' } })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt', altKey: true, bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.ml-ribbon').classes()).toContain('ml-ribbon--keytips-open')
    const keyTipBadge = wrapper.find('.ml-ribbon-item-host[data-item-id="paste"] .ml-ribbon-item-host__keytip')
    expect(keyTipBadge.exists()).toBe(true)
    expect(keyTipBadge.text()).toBe('V')
  })

  it('triggers itemClick when key tip sequence is matched', async () => {
    const keyTipTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'grp',
            title: 'Clipboard',
            collections: [{ id: 'c1', items: [{ id: 'run', type: 'button', label: 'Run', keyTip: 'R' }] }],
          },
        ],
      },
    ]
    const wrapper = mount(MlRibbon, { props: { tabs: keyTipTabs, activeTab: 'home' } })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt', altKey: true, bubbles: true }))
    await wrapper.vm.$nextTick()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }))
    await wrapper.vm.$nextTick()

    const emissions = wrapper.emitted('itemClick') ?? []
    expect(emissions).toHaveLength(1)
    expect(emissions[0]?.[0]).toEqual({ tabId: 'home', groupId: 'grp', itemId: 'run' })
    expect(wrapper.find('.ml-ribbon-item-host[data-item-id="run"] .ml-ribbon-item-host__keytip').exists()).toBe(false)
  })

  it('uses flat medium items without duplicated title in simplified popover', async () => {
    // Dedicated schema for simplified mode to verify the flattening behavior in popover panels.
    const simplifiedTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'grp',
            title: 'Clipboard',
            collections: [
              {
                id: 'c1',
                items: [
                  { id: 'paste', type: 'button', label: 'Paste', size: 'large' },
                  { id: 'copy', type: 'button', label: 'Copy', size: 'small' },
                ],
              },
            ],
          },
        ],
      },
    ]
    const wrapper = mount(MlRibbon, {
      attachTo: document.body,
      props: { tabs: simplifiedTabs, layout: 'simplified', activeTab: 'home' },
    })

    try {
      await wrapper.find('.ml-ribbon-simplified-group').trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      // The popover is rendered in document.body, so query from body instead of wrapper root.
      const popoverPanel = Array.from(
        document.body.querySelectorAll('.ml-ribbon-group-popover .ml-ribbon-simplified-group__panel'),
      ).find((panel) => panel.textContent?.includes('Paste') && panel.textContent?.includes('Copy'))
      expect(popoverPanel).not.toBeNull()
      expect(popoverPanel?.querySelector('.ml-ribbon-simplified-group__title')).toBeNull()
      expect(popoverPanel?.querySelector('.ml-ribbon-item-host.is-large')).toBeNull()
      expect(popoverPanel?.querySelector('.ml-ribbon-item-host.is-small')).toBeNull()
      expect(popoverPanel?.querySelectorAll('.ml-ribbon-item-host.is-medium').length).toBe(2)
    } finally {
      wrapper.unmount()
    }
  })

  it('supports size prop', () => {
    const wrapper = mount(MlRibbon, { props: { tabs, size: 'small' } })
    expect(wrapper.find('.ml-ribbon').classes()).toContain('ml-ribbon--size-small')
  })

  it('hides open backstage menu command when showOpenBackstage is false', async () => {
    const wrapper = mount(MlRibbon, {
      attachTo: document.body,
      props: {
        tabs,
        showOpenBackstage: false,
        fileMenuItems: [{ id: 'open-file', label: 'Open File Unique' }],
        texts: { fileMenuOpenBackstageLabel: 'Open Backstage Hidden Unique' },
      },
    })

    try {
      const fileTab = wrapper.find('.ml-ribbon-tab--file')
      expect(fileTab.exists()).toBe(true)
      await fileTab.trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      const menuItems = Array.from(document.body.querySelectorAll('.ml-ribbon-file-menu-dropdown .el-dropdown-menu__item'))
      const labels = menuItems.map((item) => item.textContent?.trim() ?? '')

      expect(labels).toContain('Open File Unique')
      expect(labels).not.toContain('Open Backstage Hidden Unique')
    } finally {
      wrapper.unmount()
    }
  })

  it('renders custom backstage slot content in ribbon shell', async () => {
    const wrapper = mount(MlRibbon, {
      props: { tabs },
      slots: {
        backstage: '<div class="ml-test-custom-backstage-shell">Custom Backstage Shell</div>',
      },
      global: {
        stubs: {
          ElDrawer: {
            props: ['modelValue'],
            template: '<div v-if="modelValue"><slot /></div>',
          },
        },
      },
    })

    try {
      wrapper.findComponent(MlRibbonFileMenu).vm.$emit('open-backstage')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ml-test-custom-backstage-shell').exists()).toBe(true)
      expect(wrapper.find('.ml-ribbon-backstage__nav').exists()).toBe(false)
    } finally {
      wrapper.unmount()
    }
  })

  it('renders custom tabs-extra slot content on the far-right side of ribbon header', () => {
    const wrapper = mount(MlRibbon, {
      props: { tabs },
      slots: {
        'tabs-extra': '<button class="ml-test-tabs-extra">Language</button>',
      },
    })

    const slotHost = wrapper.find('.ml-ribbon__head-right .ml-ribbon__tabs-extra')
    expect(slotHost.exists()).toBe(true)
    expect(slotHost.find('.ml-test-tabs-extra').exists()).toBe(true)
    expect(wrapper.text()).toContain('Language')
  })

  it('places minimize control beside tabs area', () => {
    const wrapper = mount(MlRibbon, { props: { tabs } })
    expect(wrapper.find('.ml-ribbon__head-left .ml-ribbon__control--minimize').exists()).toBe(true)
  })

  it('supports visibility toggles for layout switcher, minimize button and key tips toggle', () => {
    const wrapper = mount(MlRibbon, {
      props: {
        tabs,
        hideLayoutSwitcher: true,
        hideMinimizeButton: true,
        hideKeyTipsToggle: true,
      },
    })

    expect(wrapper.find('.ml-ribbon__control--layout').exists()).toBe(false)
    expect(wrapper.find('.ml-ribbon__control--minimize').exists()).toBe(false)
    expect(wrapper.find('.ml-ribbon__control--keytips').exists()).toBe(false)
  })

  it('switches minimize button icon from down to up when ribbon is minimized', async () => {
    const wrapper = mount(MlRibbon, { props: { tabs, minimized: false } })
    const minimizeButton = wrapper.find('.ml-ribbon__control--minimize')
    expect(minimizeButton.classes()).toContain('ml-ribbon__control--minimize-down')

    await wrapper.setProps({ minimized: true })
    expect(minimizeButton.classes()).toContain('ml-ribbon__control--minimize-up')
  })

  it('reclaims panel space by removing panel DOM when minimized', async () => {
    const wrapper = mount(MlRibbon, { props: { tabs, minimized: false } })
    expect(wrapper.find('.ml-ribbon__panel').exists()).toBe(true)

    await wrapper.find('.ml-ribbon__control--minimize').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.ml-ribbon__panel').exists()).toBe(false)
    expect(wrapper.find('.ml-ribbon').classes()).toContain('ml-ribbon--minimized')
  })

  it('emits update:minimized when minimized state changes', async () => {
    const wrapper = mount(MlRibbon, { props: { tabs, minimized: false } })

    await wrapper.find('.ml-ribbon__control--minimize').trigger('click')
    await wrapper.vm.$nextTick()

    const updateEvents = wrapper.emitted('update:minimized') ?? []
    expect(updateEvents).toHaveLength(1)
    expect(updateEvents[0]).toEqual([true])
  })

  it('uses externally provided i18n texts', () => {
    const contextualTabs: RibbonTabModel[] = [
      {
        id: 'ctx',
        title: 'Chart',
        contextual: true,
        groups: [{ id: 'g1', title: 'Group', collections: [{ id: 'c1', items: [] }] }],
      },
    ]
    const wrapper = mount(MlRibbon, {
      props: {
        tabs: contextualTabs,
        texts: {
          fileMenuLabel: '文档',
          contextualTabDefaultTitle: '图表工具',
        },
      },
    })

    expect(wrapper.find('.ml-ribbon-tab--file').text()).toBe('文档')
    expect(wrapper.text()).toContain('图表工具')
  })

  it('inherits size from element plus config provider', () => {
    // Host component mirrors app-level usage where ribbon inherits size from ElConfigProvider.
    const Host = defineComponent({
      components: { ElConfigProvider, MlRibbon },
      setup() {
        return { tabs }
      },
      template: `
        <ElConfigProvider size="large">
          <MlRibbon :tabs="tabs" />
        </ElConfigProvider>
      `,
    })
    const wrapper = mount(Host)
    const ribbon = wrapper.find('.ml-ribbon')
    expect(ribbon.classes()).toContain('ml-ribbon--size-large')
  })

  it('releases classic overflow groups when tab width becomes sufficient', async () => {
    // Mutable width lets us simulate resize without remounting the component.
    let panelWidth = 260
    // Mock geometry so overflow decisions are deterministic in jsdom.
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const element = this
      if (element.classList.contains('ml-ribbon__panel')) {
        return new DOMRect(0, 0, panelWidth, 84)
      }
      if (element.classList.contains('ml-ribbon-group')) {
        return new DOMRect(0, 0, 120, 76)
      }
      return new DOMRect(0, 0, 80, 24)
    })

    const clientWidthSpy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('ml-ribbon__panel') ? panelWidth : 120
    })

    // Width budget is initially too narrow to fit all groups inline.
    const overflowTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'g1',
            title: 'Clipboard',
            collections: [{ id: 'c1', items: [{ id: 'paste', type: 'button', label: 'Paste' }] }],
          },
          {
            id: 'g2',
            title: 'Font',
            collections: [{ id: 'c2', items: [{ id: 'bold', type: 'button', label: 'Bold' }] }],
          },
          {
            id: 'g3',
            title: 'Insert',
            collections: [{ id: 'c3', items: [{ id: 'shape', type: 'button', label: 'Shape' }] }],
          },
        ],
      },
    ]

    try {
      const wrapper = mount(MlRibbon, { props: { tabs: overflowTabs } })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ml-ribbon-overflow-trigger').exists()).toBe(true)

      // Trigger reactive relayout by changing props after expanding available panel width.
      panelWidth = 480
      await wrapper.setProps({ tabs: overflowTabs.map((tab) => ({ ...tab })) })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ml-ribbon-overflow-trigger').exists()).toBe(false)
    } finally {
      rectSpy.mockRestore()
      clientWidthSpy.mockRestore()
    }
  })

  it('emits itemClick when triggering hidden group item from classic overflow popover', async () => {
    // Keep the panel narrow so at least one group is guaranteed to move into overflow popover.
    const panelWidth = 200
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const element = this
      if (element.classList.contains('ml-ribbon__panel')) {
        return new DOMRect(0, 0, panelWidth, 84)
      }
      if (element.classList.contains('ml-ribbon-group')) {
        return new DOMRect(0, 0, 140, 76)
      }
      return new DOMRect(0, 0, 90, 24)
    })

    const clientWidthSpy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('ml-ribbon__panel') ? panelWidth : 140
    })

    const overflowTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'g1',
            title: 'Clipboard',
            collections: [{ id: 'c1', items: [{ id: 'paste', type: 'button', label: 'Paste' }] }],
          },
          {
            id: 'g2',
            title: 'Insert',
            collections: [{ id: 'c2', items: [{ id: 'hidden-action', type: 'button', label: 'Hidden Action' }] }],
          },
        ],
      },
    ]

    const wrapper = mount(MlRibbon, {
      attachTo: document.body,
      props: { tabs: overflowTabs },
    })

    try {
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      const overflowTrigger = wrapper.find('.ml-ribbon-overflow-trigger')
      expect(overflowTrigger.exists()).toBe(true)
      await overflowTrigger.trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      // Overflow popover is teleported to body by Element Plus.
      const hiddenButton = Array.from(
        document.body.querySelectorAll<HTMLButtonElement>('.ml-ribbon-overflow-popover .el-button'),
      ).find((button) => button.textContent?.includes('Hidden Action'))
      expect(hiddenButton).toBeTruthy()
      hiddenButton?.click()
      await wrapper.vm.$nextTick()

      const emissions = wrapper.emitted('itemClick') ?? []
      expect(emissions).toHaveLength(1)
      expect(emissions[0]?.[0]).toEqual({ tabId: 'home', groupId: 'g2', itemId: 'hidden-action' })
    } finally {
      wrapper.unmount()
      rectSpy.mockRestore()
      clientWidthSpy.mockRestore()
    }
  })

  it('uses visible panel width to decide classic overflow trigger', async () => {
    // getBoundingClientRect represents the true visible width even when clientWidth is stale/oversized.
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const element = this
      if (element.classList.contains('ml-ribbon__panel')) {
        return new DOMRect(0, 0, 220, 84)
      }
      if (element.classList.contains('ml-ribbon-group')) {
        return new DOMRect(0, 0, 130, 76)
      }
      return new DOMRect(0, 0, 90, 24)
    })

    const clientWidthSpy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.classList.contains('ml-ribbon__panel')) return 1200
      return 130
    })

    const overflowTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'g1',
            title: 'Clipboard',
            collections: [{ id: 'c1', items: [{ id: 'paste', type: 'button', label: 'Paste' }] }],
          },
          {
            id: 'g2',
            title: 'Insert',
            collections: [{ id: 'c2', items: [{ id: 'hidden-action', type: 'button', label: 'Hidden Action' }] }],
          },
        ],
      },
    ]

    try {
      const wrapper = mount(MlRibbon, { props: { tabs: overflowTabs } })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ml-ribbon-overflow-trigger').exists()).toBe(true)
    } finally {
      rectSpy.mockRestore()
      clientWidthSpy.mockRestore()
    }
  })

  it('keeps one group visible when width fits one group plus overflow slot', async () => {
    // Exact width budget: one regular group + overflow trigger slot.
    const panelWidth = 175
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const element = this
      if (element.classList.contains('ml-ribbon__panel')) {
        return new DOMRect(0, 0, panelWidth, 84)
      }
      if (element.classList.contains('ml-ribbon-group')) {
        return new DOMRect(0, 0, 130, 76)
      }
      return new DOMRect(0, 0, 90, 24)
    })

    const overflowTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'g1',
            title: 'Clipboard',
            collections: [{ id: 'c1', items: [{ id: 'paste', type: 'button', label: 'Paste' }] }],
          },
          {
            id: 'g2',
            title: 'Insert',
            collections: [{ id: 'c2', items: [{ id: 'shape', type: 'button', label: 'Shape' }] }],
          },
        ],
      },
    ]

    try {
      const wrapper = mount(MlRibbon, { props: { tabs: overflowTabs } })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      const inlineGroups = wrapper
        .findAll('.ml-ribbon__panel .ml-ribbon-group[data-group-id]')
        .map((group) => group.attributes('data-group-id'))
      expect(inlineGroups).toEqual(['g1'])
      expect(wrapper.find('.ml-ribbon-overflow-trigger').exists()).toBe(true)
    } finally {
      rectSpy.mockRestore()
    }
  })

  it('restores overflowable groups when width grows after only fixed group is visible', async () => {
    // Start from a constrained width where only fixed (non-overflowable) group can stay visible.
    let panelWidth = 220
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const element = this
      if (element.classList.contains('ml-ribbon__panel')) {
        return new DOMRect(0, 0, panelWidth, 84)
      }
      if (element.classList.contains('ml-ribbon-group')) {
        if (element.dataset.groupId === 'g1') return new DOMRect(0, 0, 190, 76)
        return new DOMRect(0, 0, 120, 76)
      }
      return new DOMRect(0, 0, 90, 24)
    })

    const overflowTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'g1',
            title: 'Pinned',
            enableGroupOverflow: false,
            collections: [{ id: 'c1', items: [{ id: 'pin', type: 'button', label: 'Pin' }] }],
          },
          {
            id: 'g2',
            title: 'Font',
            collections: [{ id: 'c2', items: [{ id: 'bold', type: 'button', label: 'Bold' }] }],
          },
          {
            id: 'g3',
            title: 'Insert',
            collections: [{ id: 'c3', items: [{ id: 'shape', type: 'button', label: 'Shape' }] }],
          },
        ],
      },
    ]

    try {
      const wrapper = mount(MlRibbon, { props: { tabs: overflowTabs } })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('.ml-ribbon__panel .ml-ribbon-group').length).toBe(2)
      expect(wrapper.find('.ml-ribbon-overflow-trigger').exists()).toBe(true)

      // Simulate grow event and force recalculation through prop update.
      panelWidth = 480
      await wrapper.setProps({ tabs: overflowTabs.map((tab) => ({ ...tab })) })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ml-ribbon-overflow-trigger').exists()).toBe(false)
      expect(wrapper.findAll('.ml-ribbon__panel .ml-ribbon-group').length).toBe(3)
    } finally {
      rectSpy.mockRestore()
    }
  })

  it('shows group overflow arrow when items are clipped inside a group', async () => {
    // Mock item coordinates so the second item appears outside the content viewport.
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const element = this
      if (element.classList.contains('ml-ribbon-group__content')) {
        return new DOMRect(0, 0, 100, 36)
      }
      if (element.classList.contains('ml-ribbon-item-host')) {
        if (element.dataset.itemId === 'btn-hidden') {
          return new DOMRect(110, 0, 24, 20)
        }
        return new DOMRect(4, 0, 24, 20)
      }
      return new DOMRect(0, 0, 160, 40)
    })

    const overflowTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'grp-overflow',
            title: 'Group',
            enableGroupOverflow: false,
            collections: [
              {
                id: 'c1',
                items: [
                  { id: 'btn-visible', type: 'button', label: 'Visible' },
                  { id: 'btn-hidden', type: 'button', label: 'Hidden' },
                ],
              },
            ],
          },
        ],
      },
    ]

    try {
      const wrapper = mount(MlRibbon, { props: { tabs: overflowTabs } })
      await wrapper.vm.$nextTick()
      await wrapper.setProps({ tabs: overflowTabs.map((tab) => ({ ...tab })) })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      const overflowTrigger = wrapper.find('.ml-ribbon-group__overflow-trigger')
      expect(overflowTrigger.exists()).toBe(true)
      await overflowTrigger.trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      expect(overflowTrigger.classes()).toContain('is-open')
    } finally {
      rectSpy.mockRestore()
    }
  })

  it('avoids reactive component warnings for icon definitions in reactive tab schemas', async () => {
    const IconStub = defineComponent({
      name: 'IconStub',
      template: '<span class="ml-test-icon" />',
    })

    // Keep schema reactive to mimic real-world dynamic tab updates.
    const reactiveTabs = ref<RibbonTabModel[]>([
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'clipboard',
            title: 'Clipboard',
            footerMenuItems: [{ id: 'footer-find', type: 'button', label: 'Footer Find', props: { icon: IconStub } }],
            collections: [
              {
                id: 'c1',
                items: [{ id: 'paste', type: 'button', label: 'Paste', props: { icon: IconStub } }],
              },
              {
                id: 'c2',
                items: [
                  {
                    id: 'find-replace',
                    type: 'groupButton',
                    label: 'Find/Replace',
                    props: {
                      options: [
                        { label: 'Find', value: 'find', icon: IconStub },
                        { label: 'Replace', value: 'replace', icon: IconStub },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ])

    // Silence console noise and assert no Vue warning about reactive component definitions is emitted.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mount(MlRibbon, { props: { tabs: reactiveTabs.value, activeTab: 'home' } })

    try {
      await wrapper.vm.$nextTick()
      const hasReactiveComponentWarning = warnSpy.mock.calls.some((call) =>
        call.some((value) => String(value).includes('Component that was made reactive')),
      )
      expect(hasReactiveComponentWarning).toBe(false)
    } finally {
      warnSpy.mockRestore()
      wrapper.unmount()
    }
  })

  it('hides item label when hideLabel is true', () => {
    const iconOnlyTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'draw',
            title: 'Draw',
            collections: [
              {
                id: 'c1',
                items: [
                  { id: 'ellipse', type: 'button', label: 'Ellipse', hideLabel: true },
                  {
                    id: 'rect',
                    type: 'dropdown',
                    label: 'Rectangle',
                    hideLabel: true,
                    props: { options: [{ label: 'Rectangle', value: 'rect' }] },
                  },
                ],
              },
            ],
          },
        ],
      },
    ]

    const wrapper = mount(MlRibbon, { props: { tabs: iconOnlyTabs } })
    expect(wrapper.text()).not.toContain('Ellipse')
    expect(wrapper.text()).not.toContain('Rectangle')
  })

  it('renders dropdown arrows next to labels and icon according to item size/label visibility', () => {
    const IconStub = defineComponent({
      name: 'DropdownIconStub',
      template: '<span class="ml-test-icon" />',
    })

    const dropdownTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'draw',
            title: 'Draw',
            collections: [
              {
                id: 'c1',
                items: [
                  {
                    id: 'large-dropdown',
                    type: 'dropdown',
                    label: 'Circle',
                    size: 'large',
                    props: { options: [{ label: 'Circle', value: 'circle' }], icon: IconStub },
                  },
                  {
                    id: 'small-dropdown',
                    type: 'dropdown',
                    label: 'Line',
                    size: 'small',
                    props: { options: [{ label: 'Line', value: 'line' }], icon: IconStub },
                  },
                  {
                    id: 'icon-only-dropdown',
                    type: 'dropdown',
                    hideLabel: true,
                    size: 'small',
                    props: { options: [{ label: 'Ray', value: 'ray' }], icon: IconStub },
                  },
                ],
              },
            ],
          },
        ],
      },
    ]

    const wrapper = mount(MlRibbon, { props: { tabs: dropdownTabs } })

    const largeHost = wrapper.find('.ml-ribbon-item-host[data-item-id="large-dropdown"]')
    expect(largeHost.find('.ml-ribbon-item-host__label').text()).toBe('Circle')
    expect(largeHost.find('.ml-ribbon-item-host__text-row .ml-ribbon-item-host__dropdown-arrow').exists()).toBe(true)

    const smallHost = wrapper.find('.ml-ribbon-item-host[data-item-id="small-dropdown"]')
    expect(smallHost.find('.ml-ribbon-item-host__label').text()).toBe('Line')
    expect(smallHost.find('.ml-ribbon-item-host__text-row .ml-ribbon-item-host__dropdown-arrow').exists()).toBe(true)

    const iconOnlyHost = wrapper.find('.ml-ribbon-item-host[data-item-id="icon-only-dropdown"]')
    expect(iconOnlyHost.find('.ml-ribbon-item-host__label').exists()).toBe(false)
    expect(iconOnlyHost.find('.ml-ribbon-item-host__icon + .ml-ribbon-item-host__text-row').exists()).toBe(true)
    expect(iconOnlyHost.find('.ml-ribbon-item-host__text-row .ml-ribbon-item-host__dropdown-arrow').exists()).toBe(true)
  })

  it('switches dropdown trigger arrow to up when dropdown menu is open', async () => {
    const dropdownTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'draw',
            title: 'Draw',
            collections: [
              {
                id: 'c1',
                items: [
                  {
                    id: 'draw-circle',
                    type: 'dropdown',
                    label: 'Circle',
                    props: {
                      options: [
                        { label: 'Center, Radius', value: 'circle-center-radius' },
                        { label: '2-Point', value: 'circle-two-point' },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ]

    const wrapper = mount(MlRibbon, {
      attachTo: document.body,
      props: { tabs: dropdownTabs },
    })

    try {
      const host = wrapper.find('.ml-ribbon-item-host[data-item-id="draw-circle"]')
      const arrow = host.find('.ml-ribbon-item-host__dropdown-arrow')
      expect(arrow.classes()).not.toContain('is-open')

      const triggerButton = host.find('.el-button')
      await triggerButton.trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(arrow.classes()).toContain('is-open')
    } finally {
      wrapper.unmount()
    }
  })

  it('renders option icons inside dropdown menu items', async () => {
    const IconStub = defineComponent({
      name: 'DropdownOptionIconStub',
      template: '<span class="ml-test-option-icon" />',
    })

    const dropdownTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'draw',
            title: 'Draw',
            collections: [
              {
                id: 'c1',
                items: [
                  {
                    id: 'draw-circle',
                    type: 'dropdown',
                    label: 'Circle',
                    props: {
                      options: [
                        { label: 'Center, Radius', value: 'circle-center-radius', icon: IconStub },
                        { label: '2-Point', value: 'circle-two-point' },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ]

    const wrapper = mount(MlRibbon, {
      attachTo: document.body,
      props: { tabs: dropdownTabs },
    })

    try {
      const triggerButton = wrapper.find('.ml-ribbon-item-host[data-item-id="draw-circle"] .el-button')
      expect(triggerButton.exists()).toBe(true)

      await triggerButton.trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      // Dropdown menu is teleported to body, query there for icon assertions.
      const dropdownIcon = document.body.querySelector('.ml-ribbon-dropdown-menu .ml-ribbon-dropdown-item__icon')
      expect(dropdownIcon).toBeTruthy()
    } finally {
      wrapper.unmount()
    }
  })

  it('renders string class icons inside dropdown menu items', async () => {
    const dropdownTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'draw',
            title: 'Draw',
            collections: [
              {
                id: 'c1',
                items: [
                  {
                    id: 'draw-rectangle',
                    type: 'dropdown',
                    label: 'Rectangle',
                    props: {
                      options: [
                        { label: 'Rectangle', value: 'rectangle', icon: 'ml-test-option-class-icon' },
                        { label: 'Polygon', value: 'polygon' },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ]

    const wrapper = mount(MlRibbon, {
      attachTo: document.body,
      props: { tabs: dropdownTabs },
    })

    try {
      const triggerButton = wrapper.find('.ml-ribbon-item-host[data-item-id="draw-rectangle"] .el-button')
      expect(triggerButton.exists()).toBe(true)

      await triggerButton.trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      // Validate CSS-class icon path instead of component-based icon path.
      const classIcon = document.body.querySelector(
        '.ml-ribbon-dropdown-menu .ml-ribbon-dropdown-item__icon--class.ml-test-option-class-icon',
      )
      expect(classIcon).toBeTruthy()
    } finally {
      wrapper.unmount()
    }
  })

  it('updates dropdown trigger label after selecting a dropdown option', async () => {
    const IconStub = defineComponent({
      name: 'DropdownPrimaryIconStub',
      template: '<span class="ml-test-dropdown-primary-icon" />',
    })

    const dropdownTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'draw',
            title: 'Draw',
            collections: [
              {
                id: 'c1',
                items: [
                  {
                    id: 'draw-circle',
                    type: 'dropdown',
                    label: 'Circle',
                    props: {
                      options: [
                        { label: 'Center, Radius', value: 'circle-center-radius', icon: IconStub },
                        { label: '2-Point', value: 'circle-two-point', icon: IconStub },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ]

    const wrapper = mount(MlRibbon, {
      props: { tabs: dropdownTabs },
    })

    try {
      const host = wrapper.find('.ml-ribbon-item-host[data-item-id="draw-circle"]')
      expect(host.find('.ml-ribbon-item-host__label').text()).toBe('Circle')

      const dropdown = host.findComponent({ name: 'ElDropdown' })
      dropdown.vm.$emit('command', 'circle-two-point')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(host.find('.ml-ribbon-item-host__label').text()).toBe('2-Point')
    } finally {
      wrapper.unmount()
    }
  })

  it('executes selected dropdown command when clicking dropdown icon and keeps label click as menu trigger', async () => {
    const IconStub = defineComponent({
      name: 'DropdownPrimaryIconStub',
      template: '<span class="ml-test-dropdown-primary-icon" />',
    })

    const wrapper = mount(MlRibbonItemHost, {
      props: {
        id: 'draw-circle',
        groupId: 'draw',
        item: {
          id: 'draw-circle',
          type: 'dropdown',
          label: 'Circle',
          props: {
            options: [
              { label: 'Center, Radius', value: 'circle-center-radius', icon: IconStub },
              { label: '2-Point', value: 'circle-two-point', icon: IconStub },
            ],
          },
        },
      },
    })

    try {
      const host = wrapper.find('.ml-ribbon-item-host[data-item-id="draw-circle"]')
      const dropdown = wrapper.findComponent({ name: 'ElDropdown' })
      dropdown.vm.$emit('command', 'circle-two-point')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      const iconTrigger = host.find('.ml-ribbon-item-host__icon--dropdown-primary')
      expect(iconTrigger.exists()).toBe(true)
      iconTrigger.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      const emissions = wrapper.emitted('item-click') ?? []
      expect(emissions).toHaveLength(2)
      expect(emissions[0]?.[0]).toBe('circle-two-point')
      expect(emissions[1]?.[0]).toBe('circle-two-point')

      const labelTrigger = host.find('.ml-ribbon-item-host__text-row')
      await labelTrigger.trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      const arrow = host.find('.ml-ribbon-item-host__dropdown-arrow')
      expect(arrow.classes()).toContain('is-open')
      expect((wrapper.emitted('item-click') ?? []).length).toBe(2)
    } finally {
      wrapper.unmount()
    }
  })

  it('shows footer title with a right arrow trigger when footer menu items are provided', () => {
    const footerMenuTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'draw',
            title: 'Draw',
            footerMenuItems: [{ id: 'spline', type: 'button', hideLabel: true }],
            collections: [{ id: 'c1', items: [{ id: 'line', type: 'button', label: 'Line' }] }],
          },
        ],
      },
    ]

    const wrapper = mount(MlRibbon, { props: { tabs: footerMenuTabs } })
    expect(wrapper.find('.ml-ribbon-group__title').text()).toBe('Draw')
    expect(wrapper.find('.ml-ribbon-group__footer-trigger').exists()).toBe(true)
  })

  it('marks footer trigger as open after clicking footer dropdown', async () => {
    const footerMenuTabs: RibbonTabModel[] = [
      {
        id: 'home',
        title: 'Home',
        groups: [
          {
            id: 'draw',
            title: 'Draw',
            footerMenuItems: [{ id: 'spline', type: 'button', hideLabel: true }],
            collections: [{ id: 'c1', items: [{ id: 'line', type: 'button', label: 'Line' }] }],
          },
        ],
      },
    ]

    const wrapper = mount(MlRibbon, {
      attachTo: document.body,
      props: { tabs: footerMenuTabs },
    })

    try {
      const footerTrigger = wrapper.find('.ml-ribbon-group__footer-trigger')
      expect(footerTrigger.exists()).toBe(true)
      await footerTrigger.trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      expect(footerTrigger.classes()).toContain('is-open')
    } finally {
      wrapper.unmount()
    }
  })
})
