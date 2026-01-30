/**
 * Convert a string to a URL-friendly slug
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Decode a slug back to readable text (for display purposes)
 */
export function decodeSlug(slug: string): string {
  return slug.replace(/-/g, ' ')
}
