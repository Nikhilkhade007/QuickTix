import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
        {
            protocol: 'https',
            hostname: 'youthful-lion-547.convex.cloud',
            port: '',
            pathname: '/api/storage/**', // Adjust this path as necessary
        },
    ],
},
};

export default nextConfig;
