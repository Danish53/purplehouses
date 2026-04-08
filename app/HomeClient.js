"use client";
import { useEffect } from "react";
import Link from "next/link";
import PropertyMap from "@/components/PropertyMap";
import PropertyShowcaseCard from "@/components/PropertyShowcaseCard";
import { formatPropertyCardAddress } from "@/lib/formatPropertyCardAddress";

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
                    href={`/blog_detail/${blog.id}`}
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
