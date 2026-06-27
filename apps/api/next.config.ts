import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@profiloz/shared', '@profiloz/validators'],
  output: 'standalone',
  serverExternalPackages: [
    '@napi-rs/canvas',
    'tesseract.js',
    'puppeteer',
    'pdfjs-dist',
    'pdf-parse',
    'mammoth',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
