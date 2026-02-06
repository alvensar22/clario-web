import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  serverActions: {
    bodySizeLimit: 5 * 1024 * 1024, // 5MB in bytes
  },
};

export default nextConfig;
