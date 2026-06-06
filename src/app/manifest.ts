import type { MetadataRoute } from "next";

/* Web app manifest — drives the Android/PWA install icon, name, and the
   mobile browser chrome color. Icons reuse the generated icon routes so the
   identity stays in one place. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chainwork — registry for AI × crypto roles",
    short_name: "Chainwork",
    description:
      "Salary-transparent, agent-native job registry for AI × crypto roles, indexed daily from real ATS feeds.",
    start_url: "/",
    display: "standalone",
    background_color: "#08080b",
    theme_color: "#08080b",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
