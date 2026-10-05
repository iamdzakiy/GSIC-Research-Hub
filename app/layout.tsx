import type { Metadata } from "next";
import "./globals.css";
import "./legacy-bridge.css";
import { AuthProvider } from "@/components/AuthContext";

// NOTE: `next/font/google` requires network access to fonts.googleapis.com at
// build time. The build environment is offline (ENOTFOUND), so we use
// system font stacks instead. CSS variables below keep
// `var(--font-inter)` / `var(--font-jakarta)` working with Tailwind.
// To restore Google Fonts when online, re-add:
//   import { Inter, Plus_Jakarta_Sans } from "next/font/google";
//   const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
//   const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
// and set <html className={`${inter.variable} ${jakarta.variable}`}>

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "GSIC Hub · Ganesha Students Innovation Center",
  description:
    "Pusat peluang, riset, dan inovasi KM ITB: beasiswa, kompetisi, research grant, dan PKM Bootcamp.",
  authors: [{ name: "GSIC Hub" }],
  openGraph: {
    title: "GSIC Hub · Ganesha Students Innovation Center",
    description: "Pusat peluang, riset, dan inovasi KM ITB.",
    type: "website",
    locale: "id_ID",
  },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }, { url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

// Route groups own their shell:
//   (portal) -> light directory/blog/auth experience
//   (legacy) -> existing dark pages (home, events, dashboard, admin, documents)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
