import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        heading: ["var(--font-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Portal brand scale, anchored on the existing GSIC blue (#3352CD = 600).
        // Palette-aligned accents (same hues as gsic.mint #5CE3B6 / gsic.cream #F2F8C9 / gsic.navy #0B1120)
        mint: { DEFAULT: "#5CE3B6", 50: "#EEFBF6", 100: "#D5F6EA", 200: "#ADEFD5", 300: "#85E9C3", 400: "#5CE3B6", 600: "#1FA77F", 700: "#0F7E5E", 800: "#0B6049", 900: "#094A39" },
        cream: { DEFAULT: "#F2F8C9", 50: "#FAFCEA", 100: "#F2F8C9", 200: "#E6F0A1", 300: "#D4E274", 700: "#6B7A12" },
        navy: { DEFAULT: "#0B1120", 800: "#111C33", 700: "#16233F" },
        brand: {
          50: "#EFF3FD",
          100: "#DDE5FA",
          200: "#BDCBF5",
          300: "#93A8EE",
          400: "#6580E2",
          500: "#4465D6",
          600: "#3352CD",
          700: "#2943AD",
          800: "#233889",
          900: "#1F326E",
        },
        gsic: {
          navy: "#0B1120",
          slate: "#0F172A",
          blue: "#3352CD",
          "blue-light": "#60A5FA",
          cyan: "#06B6D4",
          "cyan-light": "#22D3EE",
          violet: "#8B5CF6",
          emerald: "#10B981",
          "emerald-light": "#34D399",
          mint: "#5CE3B6",
          cream: "#F2F8C9",
          dark: "#0B1120",
          "dark-light": "#111C33",
          glass: "rgba(255, 255, 255, 0.04)",
          "glass-border": "rgba(255, 255, 255, 0.08)",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-gradient":
          "linear-gradient(135deg, #0B1120 0%, #0F172A 30%, #111C33 60%, #0B1120 100%)",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
        "mesh-gradient":
          "radial-gradient(at 20% 20%, rgba(37, 99, 235, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(6, 182, 212, 0.12) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(139, 92, 246, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.08) 0px, transparent 50%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.3)",
        "glass-hover": "0 12px 48px rgba(0, 0, 0, 0.4)",
        glow: "0 0 30px rgba(37,99,235,0.25), 0 0 60px rgba(37,99,235,0.1)",
        "glow-cyan": "0 0 30px rgba(6,182,212,0.25), 0 0 60px rgba(6,182,212,0.1)",
        "glow-violet": "0 0 30px rgba(139,92,246,0.25), 0 0 60px rgba(139,92,246,0.1)",
        "glow-emerald": "0 0 30px rgba(16,185,129,0.25), 0 0 60px rgba(16,185,129,0.1)",
      },
      animation: {
        "float-blob": "floatBlob 30s ease-in-out infinite alternate",
        "pulse-border": "pulseBorder 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
      },
      keyframes: {
        floatBlob: {
          "0%": { transform: "translate(0,0) scale(1) rotate(0deg)" },
          "33%": { transform: "translate(60px,-40px) scale(1.15) rotate(5deg)" },
          "66%": { transform: "translate(-30px,20px) scale(0.95) rotate(-3deg)" },
          "100%": { transform: "translate(40px,-80px) scale(1.1) rotate(4deg)" },
        },
        pulseBorder: {
          "0%, 100%": { borderColor: "rgba(37,99,235,0.3)" },
          "50%": { borderColor: "rgba(6,182,212,0.8)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      backdropBlur: {
        glass: "20px",
      },
    },
  },
  plugins: [typography],
};

export default config;