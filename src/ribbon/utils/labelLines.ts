/**
 * Splits a ribbon label into display lines.
 *
 * Host apps encode intentional line breaks with `\n` (for example
 * `Recover\nText` / `识别\n文字`). CSS `white-space: normal` collapses those
 * to spaces, so callers should render each entry on its own line.
 */
export function splitRibbonLabelLines(label: string): string[] {
  return label.replace(/\r\n?/g, '\n').split('\n')
}

/**
 * Flattens intentional label newlines for tooltip / aria text.
 */
export function flattenRibbonLabel(label: string): string {
  return label.replace(/\r\n?/g, '\n').replace(/\n+/g, ' ')
}
