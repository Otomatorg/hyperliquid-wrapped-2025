import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@heroui/react'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'otomato-sdk-images.s3.eu-west-1.amazonaws.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for HeroUI chunk loading issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    // Optimize chunk splitting for HeroUI
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          heroui: {
            test: /[\\/]node_modules[\\/]@heroui[\\/]/,
            name: 'heroui',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    }

    return config
  },
}

export default nextConfig
