/**
 * Generate a URL-safe slug from a name + random suffix for uniqueness.
 */
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^؀-ۿa-z0-9\s-]/g, "") // keep Arabic + latin + numbers
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "org"}-${suffix}`;
}
