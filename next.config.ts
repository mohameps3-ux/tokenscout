import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // better-sqlite3 is a native Node module — must run server-side only
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        // Railway / custom domain — set NEXT_PUBLIC_APP_URL in Railway env vars
        ...(process.env.NEXT_PUBLIC_APP_URL
          ? [new URL(process.env.NEXT_PUBLIC_APP_URL).host]
          : []),
      ],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.coingecko.com" },
      { protocol: "https", hostname: "dd.dexscreener.com" },
    ],
  },
};

export default nextConfig;
