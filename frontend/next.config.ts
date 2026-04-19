import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable Turbopack — it has a known bug in Next.js 16 dev mode where
    // router.push() throws "Cannot read properties of null (reading 'dispatchEvent')"
    // via History.pushState. Production builds are unaffected.
    turbopack: false,
  },
};

export default nextConfig;
