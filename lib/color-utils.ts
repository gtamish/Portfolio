/**
 * Returns appropriate text color based on current theme
 * Canvas-based color detection is avoided due to CORS restrictions
 * on cross-origin images from Blob storage
 */
export function getAdaptiveTextColor(
  canvas: HTMLCanvasElement | null,
  isDarkMode: boolean
): 'light' | 'dark' {
  // Use consistent, readable text colors based on theme
  // Light mode: dark text on light backgrounds, light text on dark image overlays
  // Dark mode: light text on dark backgrounds, dark text on light image overlays
  return isDarkMode ? 'light' : 'dark'
}

/**
 * Gets appropriate text color class for display
 */
export function getTextColorClass(textColor: 'light' | 'dark'): string {
  return textColor === 'light'
    ? 'text-white drop-shadow-lg'
    : 'text-black drop-shadow-md'
}

/**
 * Legacy function kept for compatibility
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}
