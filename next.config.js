// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.js'],
    };
    config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx', ...config.resolve.extensions];
    return config;
  },
};

module.exports = nextConfig;