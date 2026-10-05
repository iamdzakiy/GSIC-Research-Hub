import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./legacy-bridge.css";
import { AuthProvider } from "@/components/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

/** A malformed NEXT_PUBLIC_SITE_URL (e.g. missing "https://") must never take the whole site down at module load. */
function siteBase(): URL {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  for (const candidate of [raw, raw && `https://${raw}`, "http://localhost:3000"]) {
    try { if (candidate) return new URL(candidate); } catch { /* try next */ }
  }
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: siteBase(),
  title: "GSIC Hub · Ganesha Students Innovation Center",
  description:
    "Scholarships, competitions, research grants and careers for ITB students, plus the GSIC PKM Bootcamp and Sandbox.",
  authors: [{ name: "GSIC Hub" }],
  openGraph: {
    title: "GSIC Hub · Ganesha Students Innovation Center",
    description: "Scholarships, competitions, research grants and careers for ITB students.",
    type: "website",
    locale: "en_US",
  },
  // PNG only. A leftover favicon.svg in the list wins in Chrome and keeps showing the old icon.
  // "?v=" busts the browser's very sticky favicon cache; bump it when the file changes.
  icons: {
    icon: [{ url: "/favicon.png?v=2", type: "image/png" }],
    shortcut: [{ url: "/favicon.png?v=2" }],
    apple: [{ url: "/favicon.png?v=2" }],
  },
};

// Route groups own their shell:
//   (portal) -> light directory/blog/auth experience
//   (legacy) -> existing dark pages (home, events, dashboard, admin, documents)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
