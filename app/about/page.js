import Link from "next/link";

export const metadata = { title: "About Us - Purple Housing" };

export default function AboutPage() {
  return (
    <main className="ab-page">
      {/* ── Hero ── */}
      <section className="ph-page-shell">
        <div className="ph-page-hero">
          <div className="ph-page-hero__inner">
            <p className="ph-page-hero__title">About Us</p>
            <div className="ph-page-hero__crumbs">
              <span>Home</span>
              <i className="fas fa-angle-right"></i>
              <span>About Us</span>
            </div>
            <p className="ph-page-hero__sub">
              The trusted off-campus housing platform built for TCU students
            </p>
          </div>
        </div>
      </section>

      {/* ── Mission / Story ── */}
      <section className="ab-mission">
        <div className="ab-shell">
          <div className="ab-mission__grid">
            <div className="ab-mission__visual">
              <div className="ab-mission__img-wrap">
                <img src="/images/about-us.png" alt="About Purple Housing" />
                <div className="ab-mission__badge">
                  <span className="ab-mission__badge-num">1000+</span>
                  <span className="ab-mission__badge-text">
                    Students Helped
                  </span>
                </div>
              </div>
            </div>
            <div className="ab-mission__copy">
              <p className="ab-section-label">Our Story</p>
              <h2 className="ab-section-title">
                TCU Off-Campus Housing You Can Trust
              </h2>
              <div className="ab-divider"></div>
              <p className="ab-body-text">
                Finding reliable{" "}
                <strong>TCU Off Campus Housing for Rent</strong> can be
                challenging, especially when students need housing that aligns
                with academic schedules and group living needs.{" "}
                <strong>Purple Housing</strong> was created to simplify this
                process by offering a dedicated platform focused entirely on TCU
                rental homes, houses, and area properties.
              </p>
              <p className="ab-body-text">
                Founded by a TCU student who personally experienced the
                difficulty of finding off-campus housing, Purple Housing was
                built to solve a real problem — outdated listings, incorrect
                availability dates, and homes not close to campus.
              </p>
              <div className="ab-mission__highlights">
                <div className="ab-mission__highlight">
                  <i className="fas fa-check-circle"></i>
                  <span>Listings close to campus</span>
                </div>
                <div className="ab-mission__highlight">
                  <i className="fas fa-check-circle"></i>
                  <span>Accurate availability dates</span>
                </div>
                <div className="ab-mission__highlight">
                  <i className="fas fa-check-circle"></i>
                  <span>Student-focused pricing</span>
                </div>
                <div className="ab-mission__highlight">
                  <i className="fas fa-check-circle"></i>
                  <span>Easy online scheduling</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="ab-stats">
        <div className="ab-shell">
          <div className="ab-stats__grid">
            <div className="ab-stats__item">
              <span className="ab-stats__num">1000+</span>
              <span className="ab-stats__label">Students Helped</span>
            </div>
            <div className="ab-stats__item">
              <span className="ab-stats__num">300+</span>
              <span className="ab-stats__label">Active Listings</span>
            </div>
            <div className="ab-stats__item">
              <span className="ab-stats__num">13+</span>
              <span className="ab-stats__label">Years of Service</span>
            </div>
            <div className="ab-stats__item">
              <span className="ab-stats__num">4.9★</span>
              <span className="ab-stats__label">Student Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="ab-why">
        <div className="ab-shell">
          <div className="ab-why__head">
            <p className="ab-section-label">Why Choose Us</p>
            <h2 className="ab-section-title">
              Built Around TCU Students&apos; Needs
            </h2>
          </div>
          <div className="ab-why__grid">
            <div className="ab-why__card">
              <div className="ab-why__icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3 className="ab-why__card-title">Campus-Focused Listings</h3>
              <p className="ab-why__card-text">
                Every listing is hand-selected for proximity and relevance to
                TCU campus life — no generic nationwide results.
              </p>
            </div>
            <div className="ab-why__card">
              <div className="ab-why__icon">
                <i className="fas fa-handshake"></i>
              </div>
              <h3 className="ab-why__card-title">Local Landlord Network</h3>
              <p className="ab-why__card-text">
                We partner directly with local landlords for accurate, timely
                listings often unavailable on large national platforms.
              </p>
            </div>
            <div className="ab-why__card">
              <div className="ab-why__icon">
                <i className="fas fa-calendar-check"></i>
              </div>
              <h3 className="ab-why__card-title">Easy Scheduling</h3>
              <p className="ab-why__card-text">
                Book a showing directly through our website — no phone tag, no
                delays, no back-and-forth emails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Details ── */}
      <section className="ab-details">
        <div className="ab-shell">
          <div className="ab-details__grid">
            <div className="ab-details__item">
              <p className="ab-section-label">Our Speciality</p>
              <h3 className="ab-details__title">
                Specialized in TCU Area Home Rentals
              </h3>
              <p className="ab-body-text">
                Purple Housing focuses exclusively on{" "}
                <strong>TCU area house rentals</strong> and{" "}
                <strong>TCU area home rentals</strong>, making it easier for
                students to find housing close to Texas Christian University.
                Students can view homes, houses, and apartments near TCU all in
                one centralized location.
              </p>
              <p className="ab-body-text">
                Our listings are selected for students who want convenience,
                walkability, and access to campus life. By narrowing our focus
                to <strong>TCU area rental properties</strong>, every listing is
                relevant, timely, and aligned with student lease cycles.
              </p>
            </div>
            <div className="ab-details__item">
              <p className="ab-section-label">Our Process</p>
              <h3 className="ab-details__title">
                Accurate Listings From Local Partners
              </h3>
              <p className="ab-body-text">
                Our close collaboration with local landlords, property
                management companies, and apartment communities allows us to
                maintain accurate, up-to-date listings. Because we work directly
                with property owners, students gain access to listings often
                unavailable on large national platforms.
              </p>
              <p className="ab-body-text">
                This approach ensures availability dates reflect the typical
                June–August lease start periods that TCU students plan for
                months in advance.
              </p>
            </div>
            <div className="ab-details__item">
              <p className="ab-section-label">Our Students</p>
              <h3 className="ab-details__title">
                Built Around TCU Student Needs
              </h3>
              <p className="ab-body-text">
                Purple Housing is designed specifically for{" "}
                <strong>TCU students off campus housing</strong> needs. We
                understand group leasing, shared living arrangements, and the
                importance of finding housing that fits both budget and location
                preferences.
              </p>
              <p className="ab-body-text">
                Over the years, Purple Housing has helped hundreds of students
                secure <strong>homes for rent near TCU</strong>, and our goal is
                to continue providing dependable housing for future TCU classes.
              </p>
            </div>
            <div className="ab-details__item">
              <p className="ab-section-label">Stay Connected</p>
              <h3 className="ab-details__title">Follow Us for New Listings</h3>
              <p className="ab-body-text">
                We encourage students to explore the Properties section to view
                available <strong>TCU area house rentals</strong>, schedule
                showings, and{" "}
                <Link href="/contact" className="ab-inline-link">
                  contact us
                </Link>{" "}
                with any questions.
              </p>
              <p className="ab-body-text">
                You can also follow{" "}
                <a
                  href="https://www.instagram.com/purplehousing/"
                  target="_blank"
                  rel="noreferrer"
                  className="ab-inline-link"
                >
                  Purple Housing on Instagram
                </a>{" "}
                for updates on new listings and availability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="ab-cta">
        <div className="ab-shell ab-cta__inner">
          <div>
            <h2 className="ab-cta__title">
              Ready to Find Your Next Home Near TCU?
            </h2>
            <p className="ab-cta__sub">
              Browse current listings, schedule a showing, or reach out to our
              team.
            </p>
          </div>
          <div className="ab-cta__actions">
            <Link href="/properties" className="ab-btn ab-btn--white">
              Browse Properties
            </Link>
            <Link href="/contact" className="ab-btn ab-btn--outline">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
