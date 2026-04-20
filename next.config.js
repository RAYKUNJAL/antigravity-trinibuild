/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdprbbyptjdntcrhmwxf.supabase.co'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
  },
}

module.exports = nextConfig
