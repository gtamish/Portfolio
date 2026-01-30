/**
 * Calculate relative luminance of a color
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Luminance value
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Extract RGB values from hex or rgb color string
 * @param color - Color in hex (#RRGGBB) or rgb format
 * @returns RGB object with r, g, b values
 */
export function parseColor(color: string): { r: number; g: number; b: number } {
  const hex = color.replace("#", "")
  if (hex.length === 6) {
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    }
  }
  // Default to black if parsing fails
  return { r: 0, g: 0, b: 0 }
}

/**
 * Determine if text should be light or dark based on background color
 * Uses WCAG contrast calculation
 * @param bgColor - Background color (hex or rgb format)
 * @returns "light" or "dark"
 */
export function getContrastTextColor(bgColor: string): "light" | "dark" {
  const rgb = parseColor(bgColor)
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b)
  // If luminance is greater than 0.5, use dark text, otherwise light
  return luminance > 0.5 ? "dark" : "light"
}

/**
 * Get computed background color from an image element or default
 * Uses canvas to extract average color from image
 * @param imageUrl - URL of the image
 * @returns Promise resolving to hex color or default black
 */
export async function getAverageImageColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve("#000000")
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      let r = 0,
        g = 0,
        b = 0

      for (let i = 0; i < data.length; i += 4) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
      }

      const pixelCount = data.length / 4
      r = Math.floor(r / pixelCount)
      g = Math.floor(g / pixelCount)
      b = Math.floor(b / pixelCount)

      const hex = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`
      resolve(hex)
    }

    img.onerror = () => {
      resolve("#000000")
    }

    img.src = imageUrl
  })
}
