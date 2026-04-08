"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";

function friendlyLabel(v) {
  return String(v || "")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PropertiesClient({
  properties = [],
  total = 0,
  page = 1,
  filters = {},
  filterOptions = {},
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState("grid");
  const [q, setQ] = useState(filters.q || "");
  const [city, setCity] = useState(filters.city || "");
  const [category, setCategory] = useState(filters.category || "");
  const [purpose, setPurpose] = useState(filters.purpose || "");

  const totalPages = Math.ceil(total / 9);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    if (purpose) params.set("purpose", purpose);
    router.push(`/properties?${params.toString()}`);
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
        <div className="propertiesList mt-5">
          {/* Filter Bar */}
          {/* <form
            onSubmit={handleSearch}
            className="ph-property-filter ph-property-filter--page mb-4"
          >
            <div className="ph-property-filter__card">
              <div className="ph-property-filter__row">
                <div className="ph-property-filter__field ph-property-filter__field--keyword">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by keyword, address, city..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <div className="ph-property-filter__field">
                  <select
                    className="form-select"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    <option value="">All Cities</option>
                    {(filterOptions.cities || []).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ph-property-filter__field">
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Property Type</option>
                    {(filterOptions.categories || []).map((c) => (
                      <option key={c} value={c}>
                        {friendlyLabel(c)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ph-property-filter__field">
                  <select
                    className="form-select"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  >
                    <option value="">Purpose</option>
                    {(filterOptions.purposes || []).map((p) => (
                      <option key={p} value={p}>
                        {friendlyLabel(p)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="btn ph-property-filter__submit"
                >
                  Search
                </button>
              </div>
            </div>
          </form> */}

          {/* Property Sort Bar */}
          <div className="propertySort d-flex justify-content-between align-items-center mb-3">
            <div className="left">
              <span className="propertyTag">{total} Properties Found</span>
            </div>
            <div className="right d-flex align-items-center gap-2">
              <button
                type="button"
                className={`btn ph-view-toggle${viewMode === "grid" ? " ph-view-toggle--active" : ""}`}
                onClick={() => setViewMode("grid")}
              >
                <i className="fa fa-table"></i>
              </button>
              <button
                type="button"
                className={`btn ph-view-toggle${viewMode === "list" ? " ph-view-toggle--active" : ""}`}
                onClick={() => setViewMode("list")}
              >
                <i className="fa fa-list"></i>
              </button>
            </div>
          </div>

          {/* Properties Grid */}
          <div
            className={`grid-container row ${viewMode === "grid" ? "grids" : "list-view"}`}
          >
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
            {properties.length === 0 && (
              <div className="col-12 text-center py-5">
                <h4>No properties found matching your criteria.</h4>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="my-pagination mt-4">
              <div className="my-page-numbers">
                {page > 1 && (
                  <Link
                    href={`/properties?${new URLSearchParams({ ...filters, page: page - 1 }).toString()}`}
                    className="my-page-btn"
                  >
                    <i className="fa fa-chevron-left"></i>
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <Link
                      key={p}
                      href={`/properties?${new URLSearchParams({ ...filters, page: p }).toString()}`}
                      className={`my-page-btn ${p === page ? "active" : ""}`}
                    >
                      {p}
                    </Link>
                  ),
                )}
                {page < totalPages && (
                  <Link
                    href={`/properties?${new URLSearchParams({ ...filters, page: page + 1 }).toString()}`}
                    className="my-page-btn"
                  >
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
