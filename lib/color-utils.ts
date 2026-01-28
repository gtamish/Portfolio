/**
 * Calculates the luminance of an RGB color
 * Uses the relative luminance formula from WCAG 2.0
 */
export function getLuminance(r: number, g: number, b: number): number {
  // Convert to sRGB
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })

  // Calculate relative luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Determines if text should be light or dark based on background image
 * Analyzes a canvas to get the average color and returns appropriate text color
 */
export function getAdaptiveTextColor(
  canvas: HTMLCanvasElement,
  isDarkMode: boolean
): 'light' | 'dark' {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return isDarkMode ? 'light' : 'dark'

    const width = canvas.width
    const height = canvas.height
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    let r = 0, g = 0, b = 0
    const pixelCount = data.length / 4

    // Sample every nth pixel for performance
    const sampleRate = Math.max(1, Math.floor(pixelCount / 100))

    for (let i = 0; i < data.length; i += sampleRate * 4) {
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
    }

    // Calculate average color
    const samples = Math.floor(data.length / (sampleRate * 4))
    r = Math.round(r / samples)
    g = Math.round(g / samples)
    b = Math.round(b / samples)

    const luminance = getLuminance(r, g, b)

    // If luminance > 0.5, background is light, so use dark text
    // If luminance <= 0.5, background is dark, so use light text
    return luminance > 0.5 ? 'dark' : 'light'
  } catch (error) {
    console.error('[v0] Error calculating adaptive text color:', error)
    return isDarkMode ? 'light' : 'dark'
  }
}

/**
 * Gets appropriate text color class based on luminance
 */
export function getTextColorClass(textColor: 'light' | 'dark'): string {
  return textColor === 'light'
    ? 'text-white drop-shadow-lg'
    : 'text-black drop-shadow-md'
}
