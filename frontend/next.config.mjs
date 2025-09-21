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
  // Configure for Replit environment - Next.js automatically allows all hosts in development
  // Configure hostname and port
  async rewrites() {
    return []
  },
}

export default nextConfig
