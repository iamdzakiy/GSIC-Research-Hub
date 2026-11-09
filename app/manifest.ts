import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GSIC Hub",
    short_name: "GSIC Hub",
    description: "Opportunities, teams and events for ITB students.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#3352CD",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
