/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "purplehousing.com",
      },
    ],
  },
  experimental: {
    // Allow larger property video uploads via API formData
    serverActions: {
      bodySizeLimit: "150mb",
    },
  },
};

module.exports = nextConfig;
