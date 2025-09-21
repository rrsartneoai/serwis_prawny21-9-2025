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
  // Enable experimental features for Replit environment
  experimental: {
    allowedHosts: true, // Allow all hosts for Replit proxy
  },
  // Configure hostname and port
  async rewrites() {
    return []
  },
}

export default nextConfig
