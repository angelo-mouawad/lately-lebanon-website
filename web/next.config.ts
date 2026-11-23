import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@latelylebanon/shared"],
  images: {
    // Uploads are already stored as WebP at 400, 800 and 1600 px. The custom loader picks
    // the right file for each screen, so the server never re-encodes images and no image
    // cache piles up on disk (which matters with Hostinger's inode limit).
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: [400, 800, 1200, 1600],
    imageSizes: [96, 200, 400],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default config;
