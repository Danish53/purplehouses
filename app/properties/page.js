// import PropertiesClient from "./PropertiesClient";
// import {
//   searchProperties,
//   getFilterOptions,
//   enrichProperty,
// } from "@/lib/queries";
// import { friendlyLabel } from "@/lib/constants";
// import { getSortedProperties } from "@/lib/queries";


// export const dynamic = "force-dynamic";
// export const metadata = { title: "All Properties - Purple Housing" };

// export default async function PropertiesPage({ searchParams }) {
//   const params = await searchParams;
//   const q = params?.q || "";
//   const city = params?.city || "";
//   const category = params?.category || "";
//   const purpose = params?.purpose || "";
//   const page = parseInt(params?.page || "1", 10);

//   // sort
//   const sort = params?.sort || "";

//   let properties = [];
//   let total = 0;
//   let filterOptions = { cities: [], categories: [], purposes: [] };

//   let result;

//   try {
//     if (sort) {
//       result = await getSortedProperties({
//         page,
//         limit: 9,
//         sort,
//       });
//     } else {
//        result = await searchProperties({
//         q,
//         city,
//         category,
//         purpose,
//         page,
//         limit: 9,
//       });
//     }
//       properties = result.rows.map(enrichProperty);
//       total = result.total;
//       filterOptions = await getFilterOptions();
//     } catch (err) {
//       console.error("Properties fetch error:", err);
//     }

//     return (
//       <PropertiesClient
//         properties={properties}
//         total={total}
//         page={page}
//         filters={{ q, city, category, purpose, sort }}
//         filterOptions={filterOptions}
//       />
//     );
//   }



import PropertiesClient from "./PropertiesClient";
import {
  searchPropertiesAdvanced,
  getFilterOptions,
  enrichProperty,
  getSortedProperties,
} from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "All Properties - Purple Housing" };

export default async function PropertiesPage({ searchParams }) {
  const params = await searchParams;

  const q = params?.q || "";
  const priceRange = params?.priceRange || "";
  const beds = params?.beds || "";
  const baths = params?.baths || "";
  const homeType = params?.homeType || "";

  const page = parseInt(params?.page || "1", 10);
  const sort = params?.sort || "";

  let properties = [];
  let total = 0;
  let filterOptions = { cities: [], categories: [], purposes: [] };

  try {
    let result;

    // ✅ CASE 1: SEARCH / FILTER APPLY
    // if (q || priceRange || beds || baths || homeType) {
      result = await searchPropertiesAdvanced({
        query: q,
        priceRange,
        beds,
        baths,
        homeType,
        page,
        limit: 9,
      });
    // }

    // // ✅ CASE 2: ONLY SORT (or default)
    // else {
    //   result = await getSortedProperties({
    //     page,
    //     limit: 9,
    //     sort, // empty ho to default LOW→HIGH
    //   });
    // }

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
      filters={{ q, priceRange, beds, baths, homeType, sort }}
      filterOptions={filterOptions}
    />
  );
}