/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better image handling
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Allow images from various sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
