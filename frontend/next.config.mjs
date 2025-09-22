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
  // Prevent Next.js from automatically redirecting trailing slashes
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  // Configure for Replit environment - Next.js automatically allows all hosts in development
  // Proxy API calls to local backend server
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*'
      }
    ]
  },
  // Increase header limits to prevent overflow
  serverRuntimeConfig: {
    // Increase max header size
    maxHeaderSize: 32768 // 32KB instead of default 8KB
  },
}

export default nextConfig
