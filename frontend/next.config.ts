import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Accept URLs with or without trailing slashes — don't redirect them.
  // Without this, POST /api/upload/ gets 308'd before the proxy runs.
  trailingSlash: true,
  experimental: {
    // Raise the body size limit for file uploads going through the proxy (default is 1 MB)
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
