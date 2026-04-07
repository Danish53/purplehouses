"use client";

import Link from "next/link";

function formatAvailableDate(d) {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
}

function buildFullAddress(p) {
  const parts = [
    p.property_map_address,
    p.city,
    p.administrative_area_level_1,
    p.zip_code,
    p.country,
  ].filter(Boolean);
  return parts.join(", ");
}

function shortPurposeLabel(purpose) {
  if (!purpose) return "Rent";
  const s = String(purpose);
  if (/rent/i.test(s)) return "Rent";
  if (/sale/i.test(s)) return "Sale";
  return s.replace(/_/g, " ").split(" ")[0] || "Rent";
}

/**
 * Hero-style property card: full-bleed image, dark overlay, Featured asset image,
 * gallery hint, white typography; whole card opens detail; Apply button (stops propagation).
 */
export default function PropertyShowcaseCard({
  property,
  columnClass = "col-md-4 col-sm-6",
}) {
  const gallery = property.gallery_urls || [];
  const primaryImage =
    property.primary_image_url || gallery[0] || "/images/1.jpg";
  const availDateStr = formatAvailableDate(
    property.available_date || property.created_at,
  );
  const isFeatured =
    property.featured === true ||
    property.featured === 1 ||
    property.featured === "1";

  const numericPrice = Number(
    String(property.prop_price || "").replace(/[^0-9.]/g, ""),
  );
  const formattedPrice =
    Number.isFinite(numericPrice) && numericPrice > 0
      ? numericPrice.toLocaleString("en-US")
      : String(property.prop_price || "0").replace(/[^0-9.,]/g, "") ||
        property.prop_price ||
        "0";

  const headline =
    property.prop_title || property.property_map_address || "Property";
  const subline = buildFullAddress(property) || property.property_map_address;
  const galleryCount = gallery.length;

  return (
    <div className={`ph-showcase-wrap ${columnClass} d-flex relative`}>
      <div className="w-100">
      <article className="ph-showcase-card w-100">
        <div className="ph-showcase-card__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primaryImage}
            alt=""
            className="ph-showcase-card__photo"
            loading="lazy"
          />
          <div className="ph-showcase-card__scrim" aria-hidden />
        </div>

        <Link
          href={`/property/${property.id}`}
          className="ph-showcase-card__hit"
          aria-label={`View details: ${headline}`}
        />

        <div className="ph-showcase-card__hud">
          {isFeatured ? (
            <div className="ph-showcase-card__featured-badge">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/feature.png"
                alt="Featured"
                className="ph-showcase-card__featured-img"
              />
            </div>
          ) : null}
          

          {/* {galleryCount > 1 ? (
            <span
              className="ph-showcase-card__gallery-ic"
              title={`${galleryCount} photos`}
              aria-hidden
            >
              <i className="fas fa-images" />
            </span>
          ) : null} */}
          {availDateStr ? (
                <p className="ph-showcase-card__avail ph-showcase-card__gallery-ic">
                  Available {availDateStr}
                </p>
              ) : null}

          <div className="ph-showcase-card__bottom">
            <div className="ph-showcase-card__left">
              <p className="ph-showcase-card__headline">{headline}</p>
              {subline ? (
                <p className="ph-showcase-card__subline">{subline}</p>
              ) : null}
              <p className="ph-showcase-card__facts">
                <span>
                  <i className="fa fa-bed" aria-hidden />
                  {property.prop_beds ?? 0}
                </span>
                <span>
                  <i className="fa fa-shower" aria-hidden />
                  {property.prop_baths ?? 0}
                </span>
                <span>
                  <i className="fas fa-ruler-combined" aria-hidden />
                  {property.prop_size || "—"}
                </span>
              </p>
              
            </div>
            <div className="ph-showcase-card__right">
              <p className="ph-showcase-card__ptype">
                {shortPurposeLabel(property.purpose)}
              </p>
              <p className="ph-showcase-card__pprice">${formattedPrice}</p>
              <p className="ph-showcase-card__icons" aria-hidden>
                <i className="far fa-heart" />
                <i className="fas fa-plus" />
              </p>
            </div>
          </div>
        </div>
        
      </article>
      <div className="d-flex justify-content-between mt-2">
      <Link
                href={`/property/${property.id}`}
                className="ph-showcase-card__apply"
                onClick={(e) => e.stopPropagation()}
              >
                Details
              </Link>
      <Link
                href={`/applying?property_id=${property.id}`}
                className="ph-showcase-card__apply"
                onClick={(e) => e.stopPropagation()}
              >
                Apply now
              </Link>
              </div>
              </div>
    </div>
  );
}
