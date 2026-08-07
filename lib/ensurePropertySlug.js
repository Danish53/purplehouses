import prisma from "./prisma";
import { propertySlugFromTitle } from "./propertySlug";

/**
 * Build a unique property slug from title (appends -2, -3, ... if needed).
 */
export async function ensureUniquePropertySlug(title, excludeId = null) {
  const base = propertySlugFromTitle(title);
  let candidate = base;
  let n = 2;

  while (n <= 500) {
    const existing = await prisma.Property.findFirst({
      where:
        excludeId != null
          ? { slug: candidate, NOT: { id: BigInt(excludeId) } }
          : { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }

  return `${base}-${Date.now()}`;
}
