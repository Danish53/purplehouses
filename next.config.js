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
};

module.exports = nextConfig;
