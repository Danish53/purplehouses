"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PropertyMap from "@/components/PropertyMap";
import PropertyShowcaseCard from "@/components/PropertyShowcaseCard";
import { blogSlugFromTitle } from "@/lib/blogSlug";
import { formatPropertyCardAddress } from "@/lib/formatPropertyCardAddress";
import { useRouter } from "next/navigation";

export default function HomeClient({
  properties = [],
  sliderProperties = [],
  blogs = [],
  mapMarkers = [],
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Poll until both jQuery and Slick are ready (afterInteractive scripts may load after useEffect)
    let attempts = 0;
    const MAX = 50; // 5 seconds max
    const timer = setInterval(() => {
      attempts++;
      const $ = window.jQuery;
      if (!$ || !$.fn || !$.fn.slick) {
        if (attempts >= MAX) clearInterval(timer);
        return;
      }
      clearInterval(timer);

      // Hero slider
      const $heroSlider = $(".slick-slider");
      if ($heroSlider.length && !$heroSlider.hasClass("slick-initialized")) {
        $heroSlider.slick({
          dots: true,
          infinite: true,
          speed: 500,
          slidesToShow: 1,
          slidesToScroll: 1,
          autoplay: true,
          autoplaySpeed: 3000,
          arrows: false,
        });
      }

      // Blog carousel
      const $customSlider = $(".custom-slider");
      if (
        $customSlider.length &&
        !$customSlider.hasClass("slick-initialized")
      ) {
        $customSlider.slick({
          slidesToShow: 4,
          slidesToScroll: 1,
          infinite: true,
          arrows: true,
          dots: true,
          prevArrow: $(".custom-prev"),
          nextArrow: $(".custom-next"),
          responsive: [
            { breakpoint: 1200, settings: { slidesToShow: 3 } },
            { breakpoint: 992, settings: { slidesToShow: 2 } },
            { breakpoint: 768, settings: { slidesToShow: 1 } },
          ],
        });
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const [query, setQuery] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [homeType, setHomeType] = useState("");
  const [errors, setErrors] = useState({});
  const router = useRouter();

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

    const params = new URLSearchParams();

    if (query) params.set("q", query);

    if (priceRange && priceRange !== "any") {
      params.set("priceRange", priceRange);
    }

    if (beds && beds !== "Any") {
      params.set("beds", beds);
    }

    if (baths && baths !== "Any") {
      params.set("baths", baths);
    }

    if (homeType && homeType !== "Any Type") {
      params.set("homeType", homeType);
    }

    params.set("page", "1");

    router.push(`/properties?${params.toString()}`);
  }

  return (
    <>
      {/* Hero Slider */}
      <div className="slider-head">
        <div className="slick-slider">
          {sliderProperties.length > 0 ? (
            sliderProperties.map((property) => (
              <div className="slide-item" key={property.id}>
                <img
                  src={property.primary_image_url || "/images/1.jpg"}
                  alt={property.prop_title}
                />
                <div className="overlay"></div>
                <div className="slide-text">
                  <h2>{property.prop_title}</h2>
                  <p>
                    {formatPropertyCardAddress(property) ||
                      property.property_map_address}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="slide-item">
              <img src="/images/1.jpg" alt="Purple Housing" />
              <div className="overlay"></div>
              <div className="slide-text">
                <h2>TCU Area Rentals</h2>
                <p>Homes For Rent Near TCU</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSearch} className="ph-pill-filter ph-pill-filter-home">
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

      {/* Featured Properties */}
      <section>
        <div className="propertyShowWrapper">
          <div className="inner">
            <p className="m-0 title text-center">Our Featured Properties</p>
            <div className="divider"></div>

            <div className="ph-home-shell ph-home-shell--featured my-5">
              <div className="row g-5 justify-content-evenly">
                {properties.map((property) => (
                  <PropertyShowcaseCard
                    key={property.id}
                    property={property}
                    columnClass="col-md-5 col-12 justify-content-center"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Info */}
      <div className="aboutHome">
        <div className="ph-home-shell py-5">
          <div className="row align-items-stretch g-4">
            <div className="col-md-7">
              <h1 className="fw-bold aboutTitle">
                TCU Area Rentals | Homes For Rent Near TCU
              </h1>
              <hr className="my-3 custom-hr" />
              <p className="m-0 aboutPara">
                Purple Housing was created to make finding off-campus housing
                easier for TCU students. The creator of purple housing, a TCU
                student himself, recognized that TCU students didn&apos;t have
                an easy or efficient way to find{" "}
                <strong>Off-Campus Housing</strong>. It either involved driving
                around and calling off of rent signs or looking on Zillow and
                finding out that the house was available now, not for the
                June-August lease start dates that students start looking for as
                early as September.
              </p>
              <p className="m-0 aboutPara">
                Purple Housing has the most options for{" "}
                <em>
                  <strong>TCU Area Rental Properties</strong>
                </em>{" "}
                because we work with local landlords, property management
                companies, and apartments to notify the students of their
                properties&apos; availability. We have helped hundreds of TCU
                students find the perfect house and we look forward to doing the
                same for you.
              </p>
              <p className="m-0 aboutPara">
                Look through the available options in the PROPERTIES tab and see
                if there are any you and your group would like to see. Our
                website has a &quot;Schedule a Showing&quot; feature which
                allows you to schedule a time to see the specified house you and
                your group would like to see. Feel free to CONTACT US with any
                questions you may have.
              </p>
            </div>
            <div className="col-md-5 d-flex">
              <div className="aboutHome__visual">
                <img
                  src="/images/1.jpg"
                  alt="Purple Housing home exterior"
                  className="aboutHome__image"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Section */}
      <section>
        <div className="homeBlog">
          <div className="inner">
            <p className="m-0 title text-center">Our Blog</p>
            <div className="divider"></div>

            <div className="ph-home-shell">
              <div className="homeBlog__controls d-flex justify-content-end mb-3">
                <button className="btn btn-prev-carousal custom-prev me-2">
                  Prev
                </button>
                <button className="btn btn-next-carousal custom-next">
                  Next
                </button>
              </div>

              <div className="custom-slider">
                {blogs.map((blog) => (
                  <Link
                    href={`/blogs/${blogSlugFromTitle(blog.title)}`}
                    className="blog-card-link"
                    key={blog.id}
                  >
                    <div className="blog-card position-relative">
                      <div className="blog-thumb">
                        <img
                          src={blog.image_url || "/images/1.jpg"}
                          alt={blog.title}
                        />
                      </div>
                      <div className="blog-content">
                        <h4>
                          {blog.title?.substring(0, 60)}
                          {blog.title?.length > 60 ? "…" : ""}
                        </h4>
                        <p>
                          {(blog.description || "")
                            .replace(/<[^>]*>/g, "")
                            .substring(0, 100)}
                          {(blog.description || "").replace(/<[^>]*>/g, "")
                            .length > 100
                            ? "…"
                            : ""}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
                {blogs.length === 0 && <p>No blogs available.</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      {/* <section>
        <div className="homeMap">
          <div className="inner">
            <p className="m-0 title text-center pt-5">Map &amp; Directions</p>
            <div className="divider"></div>
          </div>
        </div>
      </section>

      <section className="my-5">
        <div className="homeMap__shell">
          <div className="homeMap__frame">
            <PropertyMap markers={mapMarkers} />
          </div>
        </div>
      </section> */}
    </>
  );
}
