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
        heading: ["Poppins", "system-ui", "sans-serif"],
        body: ["Lato", "system-ui", "sans-serif"],
      },
      colors: {
        gsic: {
          blue: "#3352CD",
          "blue-dark": "#1a2d7a",
          "blue-light": "#4a6cf7",
          mint: "#5CE3B6",
          "mint-dark": "#3ab88a",
          "mint-light": "#7ff0cc",
          cream: "#F2F8C9",
          "cream-dark": "#d4df9e",
          dark: "#0a0a2e",
          "dark-light": "#151545",
          glass: "rgba(255, 255, 255, 0.06)",
          "glass-border": "rgba(255, 255, 255, 0.10)",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-gradient":
          "linear-gradient(135deg, #0a0a2e 0%, #151545 30%, #1a1a55 60%, #0f0c29 100%)",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.25)",
        "glass-hover": "0 12px 48px rgba(0, 0, 0, 0.35)",
        glow: "0 0 30px rgba(51,82,205,0.3), 0 0 60px rgba(51,82,205,0.1)",
        "glow-mint": "0 0 30px rgba(92,227,182,0.3), 0 0 60px rgba(92,227,182,0.1)",
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
          "0%, 100%": { borderColor: "rgba(255,71,87,0.3)" },
          "50%": { borderColor: "rgba(255,71,87,0.8)" },
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
        glass: "16px",
      },
    },
  },
  plugins: [],
};

export default config;