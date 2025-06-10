/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'export',
  trailingSlash: true,
  basePath: '/terminalgame',
  assetPrefix: '/terminalgame/',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
