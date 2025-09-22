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
    // Allow overriding backend via env; fall back to IPv4 localhost for non-Docker/dev to avoid ::1 issues
    const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000'
    const backendUrl = rawBackendUrl.replace(/\/$/, '')
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`
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
