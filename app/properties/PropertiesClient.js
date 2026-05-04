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

  const [query, setQuery] = useState(filters.q || "");
  const [priceRange, setPriceRange] = useState(filters.priceRange || "");
  const [beds, setBeds] = useState(filters.beds || "");
  const [baths, setBaths] = useState(filters.baths || "");
  const [homeType, setHomeType] = useState(filters.homeType || "");
  const [errors, setErrors] = useState({});

  const priceRanges = [
    { label: "Any Price", value: "any" },
    { label: "$1000 - $1500", value: "1000-1500" },
    { label: "$1500 - $2000", value: "1500-2000" },
    { label: "$2000 - $2500", value: "2000-2500" },
    { label: "$2500 - $3000", value: "2500-3000" },
    { label: "$3000+", value: "3000+" },
  ];

  // const bedOptions = ["Any", "1 Bedroom", "2 Bedrooms", "3 Bedrooms", "4 Bedrooms", "5+ Bedrooms"];
  // const bathOptions = ["Any", "1 Bathroom", "2 Bathrooms", "3 Bathrooms", "4 Bathrooms", "5 Bathrooms"];
  const bedOptions = [
  { label: "Any", value: "any" },
  { label: "1 Bedroom", value: "1" },
  { label: "2 Bedrooms", value: "2" },
  { label: "3 Bedrooms", value: "3" },
  { label: "4 Bedrooms", value: "4" },
  { label: "5+ Bedrooms", value: "5+" },
];

const bathOptions = [
  { label: "Any", value: "any" },
  { label: "1 Bathroom", value: "1" },
  { label: "2 Bathrooms", value: "2" },
  { label: "3 Bathrooms", value: "3" },
  { label: "4 Bathrooms", value: "4" },
  { label: "5 Bathrooms", value: "5" },
];
  // const homeTypes = ["Any Type", "House", "Townhouse", "Apartment", "Duplex"];
  const homeTypes = [
    { label: "Any Type", value: "any" },
    { label: "House", value: "house" },
    { label: "Townhouse", value: "town_house" },
    { label: "Apartment", value: "apartment" },
    { label: "Duplex", value: "duplex" },
  ];

  // function handleSearch(e) {
  //   e.preventDefault();
  //   const payload = { query, priceRange, beds, baths, homeType };
  //   onSearch?.(payload);
  // }

  function handleSearch(e) {
    e.preventDefault();

    // let newErrors = {};

    // if (!query) newErrors.query = "Enter keyword";
    // if (!priceRange) newErrors.priceRange = "Select price";
    // if (!beds) newErrors.beds = "Select bedrooms";
    // if (!baths) newErrors.baths = "Select bathrooms";
    // if (!homeType) newErrors.homeType = "Select home type";

    // setErrors(newErrors);

    // if (Object.keys(newErrors).length > 0) return;

    const params = new URLSearchParams(window.location.search);

    if (query) params.set("q", query);
    else params.delete("q");

    if (priceRange) params.set("priceRange", priceRange);
    else params.delete("priceRange");

    if (beds) params.set("beds", beds);
    else params.delete("beds");

    if (baths) params.set("baths", baths);
    else params.delete("baths");

    if (homeType) params.set("homeType", homeType);
    else params.delete("homeType");

    params.set("page", "1"); // reset page

    router.push(`/properties?${params.toString()}`);
  }


  function handleClearFilters() {
    setQuery("");
    setPriceRange("");
    setBeds("");
    setBaths("");
    setHomeType("");

    router.push("/properties");
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
          <form onSubmit={handleSearch} className="ph-pill-filter">
            <div className="ph-pill-filter__pill">
              {/* Address / keyword */}
              <div className="ph-pill-filter__item ph-pill-filter__item--keyword">
                {errors.query && (
                  <span className="error-text-search">{errors.query}</span>
                )}
                <span className="ph-pill-filter__icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>

                <input
                  type="text"
                  className="ph-pill-filter__input"
                  placeholder="Address, neighborhood, city, ZIP"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />

                <button type="submit" className="ph-pill-filter__iconBtn" aria-label="Search">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 21l-4.3-4.3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              </div>

              {/* Price Range */}
              <div className="ph-pill-filter__item ph-pill-filter__select">
                <select
                  className={`ph-pill-filter__selectEl ${errors.priceRange ? "error" : ""}`}
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                >
                  <option value="" disabled>Price Range</option>
                  {priceRanges.map((pr) => (
                    <option key={pr.value} value={pr.value}>
                      {pr.label}
                    </option>
                  ))}
                </select>

                {errors.priceRange && (
                  <span className="error-text">{errors.priceRange}</span>
                )}
              </div>

              {/* Bedrooms */}
              <div className="ph-pill-filter__item ph-pill-filter__select">
                <select
                  className="ph-pill-filter__selectEl"
                  value={beds}
                  onChange={(e) => setBeds(e.target.value)}
                >
                  <option value="" disabled>Bedrooms</option>
                  {bedOptions
                    .filter((x) => x !== "")
                    .map((b) => (
                      <option key={b.value} value={b.value}>
      {b.label}
    </option>
                    ))}
                </select>

                {errors.beds && (
                  <span className="error-text">{errors.beds}</span>
                )}
              </div>

              {/* Bathrooms */}
              <div className="ph-pill-filter__item ph-pill-filter__select">
                <select
                  className="ph-pill-filter__selectEl"
                  value={baths}
                  onChange={(e) => setBaths(e.target.value)}
                >
                  <option value="" disabled>
                    Bathrooms
                  </option>
                  {bathOptions
                    .filter((x) => x !== "")
                    .map((b) => (
                      <option key={b.value} value={b.value}>
      {b.label}
    </option>
                    ))}
                </select>

                {errors.baths && (
                  <span className="error-text">{errors.baths}</span>
                )}
              </div>

              {/* Home Type */}
              <div className="ph-pill-filter__item ph-pill-filter__select">
                <select
                  className="ph-pill-filter__selectEl"
                  value={homeType}
                  onChange={(e) => setHomeType(e.target.value)}
                >
                  <option value="" disabled>
                    Home Type
                  </option>
                  {homeTypes
                    // .filter((x) => x !== "")
                    .map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                </select>

                {errors.homeType && (
                  <span className="error-text">{errors.homeType}</span>
                )}
              </div>

              {/* Search button */}
              <button type="submit" className="ph-pill-filter__btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-1">
                  <path
                    d="M21 21l-4.3-4.3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                </svg>
                Search
              </button>
            </div>
          </form>

          {/* Property Sort Bar */}
          <div className="propertySort d-lg-flex justify-content-between align-items-end mt-4 mb-5 ">
            <div className="left">
              <span className="propertyTag"><span style={{ color: "#43086b", fontWeight: "bold" }}>{total}</span> Properties Found</span>
            </div>
            <div className="right d-flex align-items-center gap-2 sort-by pe-3 mt-lg-0 mt-2">
              <div className="pe-5">
                <span className="sort_by me-2 sm_none">Sort By:</span>
                <select
                  value={filters.sort || "price_low_high"}
                  onChange={(e) => {
                    const params = new URLSearchParams(window.location.search);
                    params.set("sort", e.target.value);
                    window.location.search = params.toString();
                  }}
                >
                  <option value="price_low_high">Lowest to Highest</option>
                  <option value="price_high_low">Highest to Lowest</option>
                </select>
              </div>
              <div className="view-toggle d-flex align-items-center gap-2">
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
                {/* clear filter button that resets all filters and goes back to page 1 */}
                <button
                  onClick={handleClearFilters}
                  className="btn btn-primary mt-3"
                >
                  Clear Filters
                </button>
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
