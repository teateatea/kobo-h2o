// Shared utilities

/**
 * Strips characters illegal in filenames/YAML keys and normalises whitespace.
 * Newlines are collapsed to a space so titles/authors with embedded newlines
 * don't silently create duplicate book entries.
 */
export function sanitizeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, "-").replace(/\r?\n/g, " ").trim();
}
