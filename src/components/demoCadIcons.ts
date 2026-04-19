import { defineComponent, h } from 'vue'

/**
 * Shared SVG attributes for the lightweight CAD demo icons.
 */
const baseSvgProps = {
  viewBox: '0 0 16 16',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': 'true',
}

/**
 * Leading icon used by the color dropdown demo.
 */
export const MlDemoCadColorIcon = defineComponent({
  name: 'MlDemoCadColorIcon',
  render() {
    return h(
      'svg',
      baseSvgProps,
      [
        h('path', {
          d: 'M3 10.5L10.5 3a1.4 1.4 0 0 1 2 0l.5.5a1.4 1.4 0 0 1 0 2L5.5 13H3v-2.5Z',
          stroke: 'currentColor',
          'stroke-width': '1.2',
          'stroke-linejoin': 'round',
        }),
        h('path', {
          d: 'M9.75 3.75l2.5 2.5',
          stroke: 'currentColor',
          'stroke-width': '1.2',
          'stroke-linecap': 'round',
        }),
        h('path', {
          d: 'M2.5 13.5h11',
          stroke: '#d64541',
          'stroke-width': '1.8',
          'stroke-linecap': 'round',
        }),
      ],
    )
  },
})

/**
 * Leading icon used by the line type dropdown demo.
 */
export const MlDemoCadLineTypeIcon = defineComponent({
  name: 'MlDemoCadLineTypeIcon',
  render() {
    return h(
      'svg',
      baseSvgProps,
      [
        h('path', {
          d: 'M2 5.25h3.25M7 5.25h2M10.5 5.25H14',
          stroke: 'currentColor',
          'stroke-width': '1.4',
          'stroke-linecap': 'round',
        }),
        h('path', {
          d: 'M2 10.75H14',
          stroke: 'currentColor',
          'stroke-width': '1.4',
          'stroke-linecap': 'round',
          'stroke-dasharray': '3 2',
        }),
      ],
    )
  },
})

/**
 * Leading icon used by the line weight dropdown demo.
 */
export const MlDemoCadLineWeightIcon = defineComponent({
  name: 'MlDemoCadLineWeightIcon',
  render() {
    return h(
      'svg',
      baseSvgProps,
      [
        h('path', {
          d: 'M2.5 4.25h11',
          stroke: 'currentColor',
          'stroke-width': '1',
          'stroke-linecap': 'round',
        }),
        h('path', {
          d: 'M2.5 8h11',
          stroke: 'currentColor',
          'stroke-width': '1.8',
          'stroke-linecap': 'round',
        }),
        h('path', {
          d: 'M2.5 11.75h11',
          stroke: 'currentColor',
          'stroke-width': '2.6',
          'stroke-linecap': 'round',
        }),
      ],
    )
  },
})
