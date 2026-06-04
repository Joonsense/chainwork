import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Bare collection-index URLs only exist as dynamic children
     (/ecosystems/[eco], /roles/[role]) or as the agent index (/llms.txt).
     Send the bare paths somewhere real instead of 404-ing crawlers/agents. */
  async redirects() {
    return [
      { source: "/ecosystems", destination: "/directory", permanent: false },
      { source: "/roles", destination: "/directory", permanent: false },
      { source: "/llms", destination: "/llms.txt", permanent: false },
    ];
  },
};

export default nextConfig;
