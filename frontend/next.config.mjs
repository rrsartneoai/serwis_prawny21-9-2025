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
  // Remove standalone output for development
  // Configure for Replit environment - Next.js automatically allows all hosts in development
  // Configure hostname and port
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:8000'}/api`;
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`
      }
    ]
  },
}

export default nextConfig
