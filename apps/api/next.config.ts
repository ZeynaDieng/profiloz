import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@profiloz/shared', '@profiloz/validators'],
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
