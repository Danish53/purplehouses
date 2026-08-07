/**
 * URL-safe slug from a property title.
 */
export function propertySlugFromTitle(title) {
  const s = String(title || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "property";
}

/**
 * Public detail path — prefers slug, falls back to id for older rows.
 */
export function propertyDetailPath(property) {
  const slug = String(property?.slug || "").trim();
  if (slug) return `/property/${slug}`;
  const id = property?.id;
  if (id != null && String(id).trim() !== "") return `/property/${id}`;
  return "/properties";
}
