import type { InjectionKey } from 'vue'
import type { RibbonContextValue } from './types'

export const ribbonKey: InjectionKey<RibbonContextValue> = Symbol('RibbonContext')
