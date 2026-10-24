import type { NextConfig } from "next";

// The account API (../play-and-learn-backend). Proxying it under /api keeps the browser on one origin,
// so its httpOnly session cookies are first-party and no CORS is needed.
const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
  // Recorded voice clips (scripts/voice) rarely change: browsers keep them for a week instead of re-asking every time.
  async headers() {
    return [{ source: "/voice/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] }];
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
