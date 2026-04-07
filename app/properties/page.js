import PropertiesClient from "./PropertiesClient";
import {
  searchProperties,
  getFilterOptions,
  enrichProperty,
} from "@/lib/queries";
import { friendlyLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "All Properties - Purple Housing" };

export default async function PropertiesPage({ searchParams }) {
  const params = await searchParams;
  const q = params?.q || "";
  const city = params?.city || "";
  const category = params?.category || "";
  const purpose = params?.purpose || "";
  const page = parseInt(params?.page || "1", 10);

  let properties = [];
  let total = 0;
  let filterOptions = { cities: [], categories: [], purposes: [] };

  try {
    const result = await searchProperties({
      q,
      city,
      category,
      purpose,
      page,
      limit: 9,
    });
    properties = result.rows.map(enrichProperty);
    total = result.total;
    filterOptions = await getFilterOptions();
  } catch (err) {
    console.error("Properties fetch error:", err);
  }

  return (
    <PropertiesClient
      properties={properties}
      total={total}
      page={page}
      filters={{ q, city, category, purpose }}
      filterOptions={filterOptions}
    />
  );
}
