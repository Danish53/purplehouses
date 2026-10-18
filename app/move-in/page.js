import Link from "next/link";
import PropertyShowcaseCard from "@/components/PropertyShowcaseCard";
import { getMoveInGroups } from "@/lib/moveIn";

export const dynamic = "force-dynamic";
export const metadata = { title: "Available for Move-In - Purple Housing" };

const PREVIEW_COUNT = 3;

export default async function MoveInPage() {
  let groups = [];
  try {
    groups = await getMoveInGroups();
  } catch (err) {
    console.error("Move-in fetch error:", err);
  }

  return (
    <div className="ph-page-shell ph-movein-page">
      <div className="ph-page-hero">
        <div className="ph-page-hero__inner">
          <p className="ph-page-hero__title">Properties</p>
          <div className="ph-page-hero__crumbs">
            <span>Home</span>
            <i className="fas fa-angle-right"></i>
            <span>Properties</span>
          </div>
        </div>
      </div>

      <div className="ph-page-hero__content">
        {groups.length === 0 ? (
          <p className="text-center py-5">
            No upcoming move-in listings right now.
          </p>
        ) : (
          groups.map(({ year, properties }) => (
            <section key={year} className="ph-movein-section">
              <div className="ph-movein-head">
                <div>
                  <h2 className="ph-movein-title">
                    Available for Move-In in <span>{year}</span>
                  </h2>
                  <p className="ph-movein-sub">
                    Explore rental homes near TCU that will be available for the{" "}
                    {year} move-in period.
                  </p>
                </div>
                <div className="ph-movein-head__actions">
                  <span className="ph-movein-count">
                    {properties.length}{" "}
                    {properties.length === 1 ? "Property" : "Properties"}
                  </span>
                  <Link href={`/move-in/${year}`} className="ph-movein-btn">
                    View all {year} properties
                    <i className="fas fa-arrow-right" aria-hidden />
                  </Link>
                </div>
              </div>

              <div className="row g-4">
                {properties.slice(0, PREVIEW_COUNT).map((property) => (
                  <PropertyShowcaseCard
                    key={property.id}
                    property={property}
                    columnClass="col-lg-4 col-md-6 col-12"
                  />
                ))}
              </div>
            </section>
          ))
        )}

        <div className="ph-movein-cta">
          <div>
            <h3>Want to explore every available listing?</h3>
            <p>View all properties regardless of move-in year.</p>
          </div>
          <Link href="/properties" className="ph-movein-btn">
            View all properties
            <i className="fas fa-arrow-right" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}