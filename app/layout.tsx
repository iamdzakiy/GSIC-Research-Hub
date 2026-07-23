import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";

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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
