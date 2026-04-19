/**
 * Visual presentation mode supported by the shared CAD-style dropdown component.
 */
export type MlDemoCadDropdownVariant = 'color' | 'line-type' | 'line-weight'

/**
 * Describes a selectable entry rendered by the CAD dropdown demos.
 *
 * Different dropdown variants consume different preview fields:
 * - `color` reads {@link swatch}
 * - `line-type` reads {@link pattern}
 * - `line-weight` reads {@link weight}
 */
export interface MlDemoCadDropdownOption {
  /**
   * Stable internal value used to resolve the current selection.
   */
  value: string

  /**
   * Human-readable label shown in both the trigger and popover menu.
   */
  label: string

  /**
   * Optional ribbon command emitted when the option is selected.
   *
   * When omitted, the dropdown falls back to an `${item.id}-${value}` command.
   */
  command?: string

  /**
   * Color swatch used by the `color` variant preview.
   */
  swatch?: string

  /**
   * Stroke pattern used by the `line-type` variant preview.
   */
  pattern?: 'solid' | 'dashed' | 'hidden' | 'center'

  /**
   * Preview stroke thickness, in pixels, used by the `line-weight` variant.
   */
  weight?: number
}
