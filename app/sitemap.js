export default function sitemap() {
  const baseUrl = "https://purplehousing.com";

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date("2026-04-23"),
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date("2026-04-23"),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/applying`,
      lastModified: new Date("2026-04-23"),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: new Date("2026-04-23"),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/booking`,
      lastModified: new Date("2026-04-23"),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date("2026-04-23"),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date("2026-04-23"),
      priority: 0.8,
    },
  ];
}