import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    // Stamped into the bundle so the ?debug=video overlay can prove which commit the
    // browser in hand is actually running. Vercel sets VERCEL_GIT_COMMIT_SHA on every build.
    NEXT_PUBLIC_BUILD_ID: (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7)
  }
};

export default nextConfig;
