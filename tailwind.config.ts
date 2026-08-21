import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        gsic: {
          navy: "#0B1120",
          slate: "#0F172A",
          blue: "#2563EB",
          "blue-light": "#60A5FA",
          cyan: "#06B6D4",
          "cyan-light": "#22D3EE",
          violet: "#8B5CF6",
          emerald: "#10B981",
          "emerald-light": "#34D399",
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
  plugins: [],
};

export default config;