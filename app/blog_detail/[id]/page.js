export const dynamic = "force-dynamic";
import { getBlogById } from "@/lib/queries";
import Link from "next/link";
import { notFound } from "next/navigation";

// Allowlist-based HTML sanitizer: only permits safe inline/block tags and
// a restricted set of attributes. Strips everything else.
function sanitizeHtml(html) {
  if (!html) return "";

  const ALLOWED_TAGS = new Set([
    "p",
    "br",
    "b",
    "strong",
    "i",
    "em",
    "u",
    "s",
    "del",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "pre",
    "code",
    "a",
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "div",
    "span",
  ]);

  const ALLOWED_ATTRS = {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
  };

  // Strip comments
  let out = html.replace(/<!--[\s\S]*?-->/g, "");

  // Strip disallowed tags (keep content of most; void-remove dangerous ones)
  const VOID_STRIP =
    /^(script|style|iframe|object|embed|form|input|base|meta|link)$/i;

  out = out.replace(
    /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
    (match, tag, attrs) => {
      const lTag = tag.toLowerCase();
      if (VOID_STRIP.test(lTag)) return "";
      if (!ALLOWED_TAGS.has(lTag)) return "";

      // Closing tag — no attrs needed
      if (match.startsWith("</")) return `</${lTag}>`;

      // Build safe attribute string
      const allowedAttrNames = ALLOWED_ATTRS[lTag] || [];
      let safeAttrs = "";
      for (const attrName of allowedAttrNames) {
        const attrMatch = attrs.match(
          new RegExp(
            `\\b${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
            "i",
          ),
        );
        if (attrMatch) {
          const val = (
            attrMatch[1] ??
            attrMatch[2] ??
            attrMatch[3] ??
            ""
          ).trim();
          // Block javascript: and data: URLs in href/src
          if (
            (attrName === "href" || attrName === "src") &&
            /^(javascript|data|vbscript)\s*:/i.test(val)
          )
            continue;
          // Force external links to be noopener
          if (attrName === "rel") continue; // we set rel ourselves below
          safeAttrs += ` ${attrName}="${val.replace(/"/g, "&quot;")}"`;
        }
      }
      // Force safe link attributes
      if (lTag === "a") {
        if (!safeAttrs.includes("href")) safeAttrs += ` href="#"`;
        safeAttrs += ` rel="noopener noreferrer"`;
      }

      const selfClose = /\/$/.test(attrs.trimEnd()) ? " /" : "";
      return `<${lTag}${safeAttrs}${selfClose}>`;
    },
  );

  return out;
}

export default async function BlogDetailPage({ params }) {
  const { id } = await params;
  const blog = await getBlogById(id);
  if (!blog) return notFound();

  const imageUrl = blog.safe_image_url || blog.image_url;
  const keywordList = blog.keywords
    ? blog.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  return (
    <section className="ph-page-shell">
      <div className="ph-page-hero">
        <div className="ph-page-hero__inner">
          <p className="ph-page-hero__title">Blog Details</p>
          <div className="ph-page-hero__crumbs">
            <span>Home</span>
            <i className="fas fa-angle-right"></i>
            <span>Blog Details</span>
          </div>
        </div>
      </div>
      <div className="aboutUsPage aboutUsPage--wide">
        <div className="inner">
          <div className="content">
            <div className="container py-4">
              <h1 className="mb-4">{blog.title}</h1>
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  className="img-fluid mb-3"
                  alt={blog.title}
                />
              )}

              <div
                className="mb-3"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(blog.description),
                }}
              />

              {keywordList.length > 0 && (
                <div className="mb-4">
                  <strong>Keywords:</strong>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {keywordList.map((keyword) => (
                      <Link
                        key={keyword}
                        href={`/blog?q=${encodeURIComponent(keyword)}`}
                        className="btn btn-sm blog-keyword-chip"
                      >
                        {keyword}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <Link href="/blog" className="btn btn-blogShow">
                Back to All Blogs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
