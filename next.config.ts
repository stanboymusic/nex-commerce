import type { NextConfig } from "next";

const pbUrl =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://nexcommerce.fly.dev";
const pbHost = (() => {
  try {
    return new URL(pbUrl.startsWith("http") ? pbUrl : `https://${pbUrl}`).hostname;
  } catch {
    return "nexcommerce.fly.dev";
  }
})();

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@prisma/client"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: pbHost, pathname: "/**" },
      { protocol: "https", hostname: "nexcommerce.fly.dev", pathname: "/**" },
      { protocol: "https", hostname: "nex-pb.fly.dev", pathname: "/**" }
    ],
  },
};

export default nextConfig;
