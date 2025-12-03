import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["subhawsbucketsumit.s3.ap-south-1.amazonaws.com"],
  },
  eslint:{
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
