export type MlDemoCadDropdownVariant = 'color' | 'line-type' | 'line-weight'

export interface MlDemoCadDropdownOption {
  value: string
  label: string
  command?: string
  swatch?: string
  pattern?: 'solid' | 'dashed' | 'hidden' | 'center'
  weight?: number
}
