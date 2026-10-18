"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";

export default function PropertiesClient({
  properties = [],
  total = 0,
  page = 1,
  filters = {},
  moveInYears = [],
}) {
  const router = useRouter();
  const totalPages = Math.ceil(total / 9);

  function pageHref(targetPage) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, String(value));
    }
    params.set("page", String(targetPage));
    return `/properties?${params.toString()}`;
  }

  return (
    <div className="ph-page-shell allProperties">
      <div className="ph-page-hero">
        <div className="ph-page-hero__inner">
          <p className="ph-page-hero__title">All Properties</p>
          <div className="ph-page-hero__crumbs">
            <span>Home</span>
            <i className="fas fa-angle-right"></i>
            <span>All Properties</span>
          </div>
        </div>
      </div>
      <div className="inner">
        <div className="propertiesList">
          <div className="propertySort d-lg-flex justify-content-between align-items-end mt-4 mb-5">
            <div className="left">
              <span className="propertyTag">
                <span style={{ color: "#43086b", fontWeight: "bold" }}>
                  {total}
                </span>{" "}
                Properties Found
              </span>
            </div>
            <div className="right d-flex align-items-center gap-2 sort-by pe-3 mt-lg-0 mt-2">
              <div className="ph-year-select">
                <select
                  aria-label="Select move-in year"
                  defaultValue=""
                  disabled={moveInYears.length === 0}
                  onChange={(event) => {
                    const year = event.target.value;
                    if (year) router.push(`/move-in/${year}`);
                  }}
                >
                  <option value="" disabled>
                    Select year
                  </option>
                  {moveInYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid-container row grids">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
            {properties.length === 0 && (
              <div className="col-12 text-center py-5">
                <h4>No properties found matching your criteria.</h4>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="my-pagination mt-4">
              <div className="my-page-numbers">
                {page > 1 && (
                  <Link href={pageHref(page - 1)} className="my-page-btn">
                    <i className="fa fa-chevron-left"></i>
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (pageNumber) => (
                    <Link
                      key={pageNumber}
                      href={pageHref(pageNumber)}
                      className={`my-page-btn ${pageNumber === page ? "active" : ""}`}
                    >
                      {pageNumber}
                    </Link>
                  ),
                )}
                {page < totalPages && (
                  <Link href={pageHref(page + 1)} className="my-page-btn">
                    <i className="fa fa-chevron-right"></i>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
