/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable standalone output for Docker optimization
  output: 'standalone',
  // Configure for Replit environment - Next.js automatically allows all hosts in development
  // Configure hostname and port
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_URL || 'http://localhost:8000/api/:path*'
      }
    ]
  },
}

export default nextConfig
