import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./legacy-bridge.css";
import { AuthProvider } from "@/components/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

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
    <html lang="id" className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
