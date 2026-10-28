/** Generates a readable unique identifier for local demo records. */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}
