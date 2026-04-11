import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    // Packages that use native Node modules must stay server-side only
    serverExternalPackages: [
        "better-sqlite3",
        "@prisma/adapter-better-sqlite3",
        "@prisma/client",
    ],
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
            { protocol: "https", hostname: "*.dexscreener.com" },
            { protocol: "https", hostname: "raw.githubusercontent.com" },
            { protocol: "https", hostname: "ipfs.io" },
            { protocol: "https", hostname: "*.ipfs.io" },
            { protocol: "https", hostname: "arweave.net" },
            { protocol: "https", hostname: "cdn.moralis.io" },
            { protocol: "https", hostname: "*.moralis.io" },
        ],
    },
};

export default nextConfig;
