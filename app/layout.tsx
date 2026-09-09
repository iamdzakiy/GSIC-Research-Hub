import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";
import AnimatedMeshBackground from "@/components/ui/AnimatedMeshBackground";
import BackToTop from "@/components/ui/BackToTop";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "GSIC Hub · Ganesha Students Innovation Center",
  description:
    "The central ecosystem for opportunities, research, and innovation at KM ITB. Explore research, scholarships, careers, competitions, and PKM Bootcamp.",
  keywords: [
    "GSIC",
    "Ganesha Students Innovation Center",
    "KM ITB",
    "research",
    "innovation",
    "bootcamp",
    "PKM",
    "scholarship",
    "competition",
    "The Sandbox",
  ],
  authors: [{ name: "GSIC Hub" }],
  openGraph: {
    title: "GSIC Hub · Ganesha Students Innovation Center",
    description:
      "The central ecosystem for opportunities, research, and innovation at KM ITB.",
    type: "website",
    locale: "en_US",
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[2000] focus:px-4 focus:py-2 focus:rounded-full focus:bg-[#3352CD] focus:text-white focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        <AnimatedMeshBackground />
        <AuthProvider>{children}</AuthProvider>
        <BackToTop />
        <Footer />
      </body>
    </html>
  );
}
