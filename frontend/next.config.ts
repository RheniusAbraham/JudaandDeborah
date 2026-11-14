import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // hide the Next.js dev toolbar badge (it only ever shows during `npm run dev`; errors still show)
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // 90 keeps the watercolor washes and fine line art clean.
    qualities: [75, 90],
  },
};

export default nextConfig;
