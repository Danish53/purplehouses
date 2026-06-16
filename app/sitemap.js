import {
  getPublicProperties,
  getAllBlogs,
  enrichProperty,
} from "@/lib/queries";
import { blogSlugFromTitle } from "@/lib/blogSlug";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://purplehousing.com"
).replace(/\/$/, "");

const DEFAULT_LASTMOD = new Date("2026-06-15T22:31:58+00:00");

function sitemapEntry(url, { lastModified = DEFAULT_LASTMOD, priority } = {}) {
  return { url, lastModified, priority };
}

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const staticPages = [
    sitemapEntry(`${BASE_URL}/`, { priority: 1.0 }),
    sitemapEntry(`${BASE_URL}/about`, { priority: 0.8 }),
    sitemapEntry(`${BASE_URL}/applying`, { priority: 0.8 }),
    sitemapEntry(`${BASE_URL}/properties`, { priority: 0.8 }),
    sitemapEntry(`${BASE_URL}/booking`, { priority: 0.8 }),
    sitemapEntry(`${BASE_URL}/contact`, { priority: 0.8 }),
    sitemapEntry(`${BASE_URL}/blogs`, { priority: 0.8 }),
    sitemapEntry(`${BASE_URL}/iab`, { priority: 0.8 }),
    sitemapEntry(`${BASE_URL}/consumer-prediction`, { priority: 0.8 }),
  ];

  const propertyPages = [];
  const applyingPages = [];
  const bookingPages = [];
  const pdfPages = [];
  const paginationPages = [];
  let blogPages = [];

  try {
    const properties = (await getPublicProperties()).map(enrichProperty);
    const limit = 9;
    const totalPages = Math.max(1, Math.ceil(properties.length / limit));

    for (let page = 1; page <= totalPages; page++) {
      paginationPages.push(
        sitemapEntry(`${BASE_URL}/properties?page=${page}`, {
          priority: page === 1 ? 0.64 : 0.51,
        }),
      );
    }

    for (const prop of properties) {
      const id = prop.id;
      const lastModified = prop.updated_at
        ? new Date(prop.updated_at)
        : DEFAULT_LASTMOD;

      propertyPages.push(
        sitemapEntry(`${BASE_URL}/property/${id}`, {
          lastModified,
          priority: 0.8,
        }),
      );

      applyingPages.push(
        sitemapEntry(`${BASE_URL}/applying?property_id=${id}`, {
          lastModified,
          priority: 0.8,
        }),
      );

      const bookingLabel =
        prop.property_map_address?.trim() || prop.prop_title?.trim();
      if (bookingLabel) {
        bookingPages.push(
          sitemapEntry(
            `${BASE_URL}/booking?property=${encodeURIComponent(bookingLabel)}`,
            { lastModified, priority: 0.64 },
          ),
        );
      }

      for (const att of prop.attachment_urls || []) {
        const path = typeof att === "string" ? att : att?.url;
        if (!path || !path.includes("/property_attachments/")) continue;
        const fullUrl = path.startsWith("http")
          ? path
          : `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
        pdfPages.push(
          sitemapEntry(fullUrl, { lastModified, priority: 0.51 }),
        );
      }
    }
  } catch (err) {
    console.error("Sitemap properties fetch error:", err);
  }

  try {
    const blogs = await getAllBlogs();
    blogPages = blogs.map((blog) => {
      const slug = blogSlugFromTitle(blog.title);
      return sitemapEntry(`${BASE_URL}/blogs/${slug}`, { priority: 0.8 });
    });
  } catch (err) {
    console.error("Sitemap blogs fetch error:", err);
  }

  const all = [
    ...staticPages,
    ...propertyPages,
    ...applyingPages,
    ...blogPages,
    ...paginationPages,
    ...bookingPages,
    ...pdfPages,
  ];

  const seen = new Set();
  return all.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}
