/**
 * URL-safe slug from a blog title (shared by server links and blog detail lookup).
 */
export function blogSlugFromTitle(title) {
  const s = String(title || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "blog";
}
