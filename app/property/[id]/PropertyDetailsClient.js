"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { formatPropertyCardAddress } from "@/lib/formatPropertyCardAddress";

// ── helpers ──────────────────────────────────────────────────────────────────
function getFileExtension(value = "") {
  const clean = String(value).split("?")[0];
  const parts = clean.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function formatFloorPlanTitle(name, index) {
  const base = String(name || "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!base) return `Floor Plan ${index + 1}`;
  return base.replace(/\b\w/g, (char) => char.toUpperCase());
}

// ── main component ────────────────────────────────────────────────────────────
export default function PropertyDetailsClient({
  property,
  galleryImages,
  features,
  attachments,
}) {
  // Gallery
  const images = galleryImages.length ? galleryImages : ["/images/1.jpg"];
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const prevImage = useCallback(
    () => setActiveIdx((p) => (p === 0 ? images.length - 1 : p - 1)),
    [images.length],
  );
  const nextImage = useCallback(
    () => setActiveIdx((p) => (p === images.length - 1 ? 0 : p + 1)),
    [images.length],
  );

  // Description read-more
  const [expanded, setExpanded] = useState(false);
  const desc = property.prop_des || "";
  const shortDesc = desc.length > 280 ? desc.slice(0, 280) + "\u2026" : desc;
  const floorPlans = attachments.map((attachment, index) => {
    const extension = getFileExtension(attachment.name || attachment.url);
    return {
      ...attachment,
      extension,
      title: formatFloorPlanTitle(attachment.name, index),
      isImage: ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension),
      isPdf: extension === "pdf",
    };
  });

  // Map src
  const mapQuery = property.property_map_address
    ? encodeURIComponent(property.property_map_address)
    : "Fort+Worth+TX";
  const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&output=embed`;

  const purposeLabel = property.purpose
    ? property.purpose
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "For Rent";
  const isFeatured =
    property.featured === true ||
    property.featured === 1 ||
    property.featured === "1";
  // Fixed thumbnails: always images[1..4], regardless of active index
  const fixedThumbIndexes = [];
  for (let i = 1; i <= 4 && i < images.length; i++) {
    fixedThumbIndexes.push(i);
  }
  const hiddenImagesCount = Math.max(images.length - 5, 0);
  const numericPrice = Number(
    String(property.prop_price || "").replace(/[^0-9.]/g, ""),
  );
  const formattedPrice =
    Number.isFinite(numericPrice) && numericPrice > 0
      ? numericPrice.toLocaleString("en-US")
      : property.prop_price || "0";

  return (
    <div className="pd-page">
      <div className="pd-top" />
      {/* ── BREADCRUMB ──────────────────────────────────────────────────── */}
      <div className="pd-breadcrumb">
        <div className="container">
          <nav className="pd-breadcrumb__nav">
            <Link href="/">Home</Link>
            <span className="pd-breadcrumb__sep">
              <i className="fas fa-chevron-right" />
            </span>
            <Link href="/properties">Properties</Link>
            <span className="pd-breadcrumb__sep">
              <i className="fas fa-chevron-right" />
            </span>
            <span className="pd-breadcrumb__current">
              {property.prop_title || "Property Details"}
            </span>
          </nav>
        </div>
      </div>

      <div className="container pd-container">
        {/* ── GALLERY ──────────────────────────────────────────────────── */}
        <div className="pd-gallery">
          <div className="pd-gallery__grid">
            <div
              className="pd-gallery__main"
              onClick={() => setLightboxOpen(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[activeIdx]} alt={property.prop_title} />
              <div className="pd-gallery__badges">
                {isFeatured && (
                  <span className="pd-gallery__badge pd-gallery__badge--featured">
                    Featured
                  </span>
                )}
                <span className="pd-gallery__badge pd-gallery__badge--purpose">
                  {purposeLabel}
                </span>
              </div>
              <button
                className="pd-gallery__arrow pd-gallery__arrow--prev"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
              >
                <i className="fas fa-chevron-left" />
              </button>
              <button
                className="pd-gallery__arrow pd-gallery__arrow--next"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
              >
                <i className="fas fa-chevron-right" />
              </button>
              <span className="pd-gallery__counter">
                <i className="fas fa-camera me-1" />
                {activeIdx + 1}/{images.length} Photos
              </span>
              {images.length > 5 && (
                <button
                  type="button"
                  className="pd-gallery__view-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGalleryModalOpen(true);
                  }}
                >
                  View All Photos
                </button>
              )}
            </div>

            {fixedThumbIndexes.length > 0 && (
              <div className="pd-gallery__side">
                {fixedThumbIndexes.map((thumbIndex, idx) => {
                  const isMoreTrigger =
                    hiddenImagesCount > 0 &&
                    idx === fixedThumbIndexes.length - 1;
                  return (
                    <button
                      key={thumbIndex}
                      type="button"
                      className={`pd-gallery__side-thumb${thumbIndex === activeIdx ? " pd-gallery__side-thumb--active" : ""}`}
                      onClick={() => {
                        setActiveIdx(thumbIndex);
                        if (isMoreTrigger) setGalleryModalOpen(true);
                        else setLightboxOpen(true);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={images[thumbIndex]} alt="" />
                      {isMoreTrigger && (
                        <span className="pd-gallery__side-more">
                          +{hiddenImagesCount} More
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Gallery Modal */}
        {galleryModalOpen && (
          <div
            className="pd-gallery-modal"
            onClick={() => setGalleryModalOpen(false)}
          >
            <div
              className="pd-gallery-modal__dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pd-gallery-modal__header">
                <h3>All Photos ({images.length})</h3>
                <button
                  type="button"
                  className="pd-gallery-modal__close"
                  onClick={() => setGalleryModalOpen(false)}
                >
                  <i className="fas fa-times" />
                </button>
              </div>
              <div className="pd-gallery-modal__grid">
                {images.map((img, index) => (
                  <button
                    key={img + index}
                    type="button"
                    className={`pd-gallery-modal__thumb${index === activeIdx ? " pd-gallery-modal__thumb--active" : ""}`}
                    onClick={() => {
                      setActiveIdx(index);
                      setGalleryModalOpen(false);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${property.prop_title} ${index + 1}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxOpen && (
          <div className="pd-lightbox" onClick={() => setLightboxOpen(false)}>
            <button
              className="pd-lightbox__close"
              type="button"
              onClick={() => setLightboxOpen(false)}
            >
              <i className="fas fa-times" />
            </button>
            <button
              className="pd-lightbox__arrow pd-lightbox__arrow--prev"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
            >
              <i className="fas fa-chevron-left" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[activeIdx]}
              alt=""
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="pd-lightbox__arrow pd-lightbox__arrow--next"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
            >
              <i className="fas fa-chevron-right" />
            </button>
          </div>
        )}

        {/* ── TITLE / PRICE / STATS ─────────────────────────────────── */}
        <div className="row">
          <div className="col-12">
            <div className="pd-hero-info">
              {/* Top row: badges + price */}
              <div className="pd-hero-info__top">
                <div className="pd-hero-info__badges">
                  {isFeatured && (
                    <span className="pd-hero-badge pd-hero-badge--featured">
                      Featured
                    </span>
                  )}
                  <span className="pd-hero-badge pd-hero-badge--purpose">
                    {purposeLabel}
                  </span>
                </div>
                <div className="pd-hero-info__price">
                  <span className="pd-hero-info__price-amount">
                    ${formattedPrice}
                  </span>
                  <span className="pd-hero-info__price-period">/month</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="pd-hero-info__title">{property.prop_title}</h1>

              {/* Address + stats row */}
              <div className="pd-hero-info__meta">
                <p className="pd-hero-info__address">
                  <i className="fas fa-map-marker-alt" />
                  {formatPropertyCardAddress(property) ||
                    property.property_map_address}
                </p>
                <div className="pd-hero-info__stats">
                  {property.prop_beds && (
                    <span>
                      <i className="fas fa-bed" />
                      {property.prop_beds} Bed
                    </span>
                  )}
                  {property.prop_baths && (
                    <span>
                      <i className="fas fa-bath" />
                      {property.prop_baths} Bath
                    </span>
                  )}
                  {property.prop_size && (
                    <span>
                      <i className="fas fa-ruler-combined" />
                      {property.prop_size} Sqft
                    </span>
                  )}
                </div>
              </div>

              {/* CTAs */}
              <div className="pd-hero-info__ctas">
                <Link
                  href={`/booking?property=${encodeURIComponent(property.prop_title)}`}
                  className="pd-btn pd-btn--primary"
                >
                  <i className="fas fa-calendar-check me-2" />
                  Schedule Showing
                </Link>
                <Link
                  href={`/applying?property_id=${property.id}`}
                  className="pd-btn pd-btn--secondary"
                >
                  <i className="fas fa-file-alt me-2" />
                  Apply Now
                </Link>
                {property.available_date && (
                  <span className="pd-hero-info__avail">
                    <i className="fas fa-clock me-1" />
                    Available: {property.available_date}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── TWO-COLUMN LAYOUT ────────────────────────────────────── */}
        <div className="row">
          {/* MAIN CONTENT */}
          <div className="col-lg-8">
            {/* PROPERTY DETAILS */}
            <div className="pd-card">
              <div className="pd-card__header">
                <h2>Property Details</h2>
              </div>
              <div className="pd-card__body">
                <div className="pd-desc">
                  <p>{expanded ? desc : shortDesc}</p>
                  {desc.length > 280 && (
                    <button
                      className="pd-read-more"
                      onClick={() => setExpanded(!expanded)}
                    >
                      {expanded ? "Read Less" : "Read More"}{" "}
                      <i
                        className={`fas fa-chevron-${expanded ? "up" : "down"} ms-1`}
                      />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* AMENITIES & FEATURES */}
            {features.length > 0 && (
              <div className="pd-card">
                <div className="pd-card__header">
                  <h2>Amenities And Features</h2>
                </div>
                <div className="pd-card__body">
                  <ul className="pd-features-list">
                    {features.map((feat, i) => (
                      <li key={i}>
                        <span
                          className="pd-features-list__bullet"
                          aria-hidden="true"
                        />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* GET DIRECTION */}
            <div className="pd-card">
              <div className="pd-card__header">
                <h2>Get Direction</h2>
              </div>
              <div className="pd-card__body p-0">
                <iframe
                  className="pd-map"
                  src={mapSrc}
                  title="Property Location"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>

            {/* FLOOR PLANS */}
            {floorPlans.length > 0 && (
              <div className="pd-card">
                <div className="pd-card__header">
                  <h2>Floor Plans</h2>
                </div>
                <div className="pd-card__body">
                  <div className="pd-floor-plans">
                    {floorPlans.map((plan, i) => (
                      <div key={i} className="pd-floor-plan-item">
                        <div className="pd-floor-plan-item__header">
                          {/* <div>
                            <h6>Property Document</h6>
                          </div> */}
                          <div className="pd-floor-plan-item__meta">
                            {property.prop_beds && (
                              <span>
                                <i className="fas fa-bed me-1" />
                                {property.prop_beds} Bedroom
                              </span>
                            )}
                            {property.prop_baths && (
                              <span>
                                <i className="fas fa-bath me-1" />
                                {property.prop_baths} Bathroom
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="pd-floor-plan-item__file-row">
                          <div className="pd-floor-plan-item__file">
                            <i
                              className={`fas ${plan.isPdf ? "fa-file-pdf" : "fa-image"}`}
                            />
                            <span>{plan.name}</span>
                          </div>
                          <div className="pd-floor-plan-item__actions">
                            <a
                              href={plan.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <i className="fas fa-eye me-1" />
                              View
                            </a>
                            <a href={plan.url} download>
                              <i className="fas fa-download me-1" />
                              Download
                            </a>
                          </div>
                        </div>
                        <div className="pd-floor-plan-item__preview">
                          {plan.isImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={plan.url} alt={plan.title} />
                          ) : plan.isPdf ? (
                            <iframe
                              src={`${plan.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                              title={plan.title}
                            />
                          ) : (
                            <div className="pd-floor-plan-item__placeholder">
                              <i className="fas fa-drafting-compass" />
                              <span>
                                Preview not available for this file type
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="col-lg-4">
            <div className="pd-sidebar">
              {/* Purple Housing quick actions */}
              <div className="pd-card pd-sidebar-card pd-contact-hub">
                <div className="pd-card__body">
                  <div className="pd-contact-hub__actions">
                    <Link
                      href={`/booking?property=${encodeURIComponent(property.prop_title)}`}
                      className="pd-contact-hub__cta pd-contact-hub__cta--showing"
                    >
                      Schedule a Showing
                    </Link>
                    <Link
                      href="/applying"
                      className="pd-contact-hub__cta pd-contact-hub__cta--apply"
                    >
                      Apply Now
                    </Link>
                  </div>
                  <div className="pd-contact-hub__social-block">
                    <div className="pd-share-links pd-contact-hub__share-links">
                      <a
                        href="https://www.facebook.com/purplehousing/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pd-share-link pd-share-link--facebook"
                        aria-label="Purple Housing on Facebook"
                      >
                        <i className="fab fa-facebook-f" />
                      </a>
                      <a
                        href="https://www.instagram.com/purplehousing/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pd-share-link pd-share-link--instagram"
                        aria-label="Purple Housing on Instagram"
                      >
                        <i className="fab fa-instagram" />
                      </a>
                      <a
                        href="https://linkedin.com/company-beta/24795419/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pd-share-link pd-share-link--linkedin"
                        aria-label="Purple Housing on LinkedIn"
                      >
                        <i className="fab fa-linkedin-in" />
                      </a>
                      <a
                        href="https://twitter.com/PurpleHousing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pd-share-link pd-share-link--twitter"
                        aria-label="Purple Housing on X"
                      >
                        <i className="fab fa-x-twitter" />
                      </a>
                    </div>
                  </div>
                  <div className="pd-contact-hub__footer">
                    <strong>Purple Housing.</strong>
                    <a href="tel:+18175851354">(817) 585-1354</a>
                    <Link href="/properties">View all listings</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
