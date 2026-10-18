import Link from "next/link";
import { notFound } from "next/navigation";
import PropertyShowcaseCard from "@/components/PropertyShowcaseCard";
import { getMoveInGroups } from "@/lib/moveIn";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { year } = await params;
  return { title: `Move-In ${year} - Purple Housing` };
}

export default async function MoveInYearPage({ params }) {
  const { year: yearParam } = await params;
  const year = Number(yearParam);
  if (!Number.isInteger(year)) notFound();

  let groups = [];
  try {
    groups = await getMoveInGroups();
  } catch (err) {
    console.error("Move-in year fetch error:", err);
  }
  const properties = groups.find((g) => g.year === year)?.properties || [];
  if (properties.length === 0) notFound();

  return (
    <div className="ph-page-shell ph-movein-page">
      <div className="ph-page-hero">
        <div className="ph-page-hero__inner">
          <p className="ph-page-hero__title">Move-In {year}</p>
          <div className="ph-page-hero__crumbs">
            <span>Home</span>
            <i className="fas fa-angle-right"></i>
            <Link href="/move-in" style={{ color: "inherit" }}>
              Properties
            </Link>
            <i className="fas fa-angle-right"></i>
            <span>{year}</span>
          </div>
        </div>
      </div>

      <div className="ph-page-hero__content">
        <section className="ph-movein-section">
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
              <Link href="/move-in" className="ph-movein-btn">
                Back to all years
                <i className="fas fa-arrow-right" aria-hidden />
              </Link>
            </div>
          </div>
          <div className="row g-4">
            {properties.map((property) => (
              <PropertyShowcaseCard
                key={property.id}
                property={property}
                columnClass="col-lg-4 col-md-6 col-12"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}