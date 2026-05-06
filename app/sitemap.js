export default function sitemap() {
  const baseUrl = "https://purplehousing.com";

  const staticPages = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date("2026-04-23T06:06:40+00:00"),
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date("2026-04-23T06:06:40+00:00"),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/applying`,
      lastModified: new Date("2026-04-23T06:06:40+00:00"),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: new Date("2026-04-23T06:06:40+00:00"),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/booking`,
      lastModified: new Date("2026-04-23T06:06:40+00:00"),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date("2026-04-23T06:06:40+00:00"),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date("2026-04-23T06:06:40+00:00"),
      priority: 0.8,
    },

    // extra pages
    {
      url: `${baseUrl}/iab`,
      lastModified: new Date("2026-04-23T06:06:40+00:00"),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/consumer-prediction`,
      lastModified: new Date("2026-04-23T06:06:40+00:00"),
      priority: 0.8,
    },
  ];

  const blogPages = [
    "tcu-rental-homes-for-students-the-smart-way-to-find-your-perfect-off-campus-living",
    "how-purple-housing-became-the-most-trusted-platform-for-students-looking-for-houses-near-tcu",
    "how-to-secure-tcu-students-off-campus-housing-fast",
    "best-time-to-book-tcu-off-campus-housing-for-rent",
    "what-to-look-for-in-tcu-rental-houses-before-signing-a-lease",
    "student-guide-to-tcu-area-rentals-in-fort-worth",
    "why-tcu-off-campus-housing-is-better-than-dorm-living",
    "how-to-find-verified-tcu-rental-properties-without-getting-scammed",
    "affordable-houses-for-rent-near-tcu-students-can-actually-afford",
    "complete-guide-to-finding-houses-for-rent-near-tcu",
    "top-areas-for-tcu-rental-homes-near-campus-in-2026",
    "best-tcu-off-campus-housing-options-for-students-in-2026",
    "purple-housing-the-ultimate-guide-to-finding-the-best-tcu-off-campus-housing-in-2026",
  ].map((slug) => ({
    url: `${baseUrl}/blogs/${slug}`,
    lastModified: new Date("2026-05-05T05:26:16+00:00"),
    priority: slug.includes("complete") || slug.includes("ultimate") ? 0.64 : 0.8,
  }));

  const pdfFiles = [
    "1776282038940_a1a768b4.pdf",
    "1776282206116_ddf05b2b.pdf",
    "1775807352705_51aec9d6.pdf",
    "1775807352728_f6372158.pdf",
    "1776292108617_6b98f57a.pdf",
    "1776292216322_3565e5b8.pdf",
    "1775807156478_566961e8.pdf",
    "1776292485497_8c69b416.pdf",
    "1776292590681_dd4a0644.pdf",
    "1775807136354_dc00735c.pdf",
  ].map((file) => ({
    url: `${baseUrl}/media/property_attachments/${file}`,
    lastModified: new Date("2026-05-05T05:26:16+00:00"),
    priority: 0.4,
  }));

  return [...staticPages, ...blogPages, ...pdfFiles];
}