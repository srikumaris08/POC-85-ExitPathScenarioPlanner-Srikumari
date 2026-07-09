import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Leaflet and react-leaflet ship CommonJS bundles that Next.js / webpack
  // must transpile so they work correctly in the browser bundle.
  transpilePackages: ["leaflet", "react-leaflet"],
};

export default nextConfig;
