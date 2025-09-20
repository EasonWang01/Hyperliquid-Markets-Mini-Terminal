/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA configuration
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
  // Enable experimental features for PWA
  experimental: {
    webpackBuildWorker: true,
  },
};

module.exports = nextConfig;
