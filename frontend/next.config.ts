import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // 90 keeps the watercolor washes and fine line art clean.
    qualities: [75, 90],
  },
};

export default nextConfig;
