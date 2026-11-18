import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

// Every colour comes from app/tokens.css. No hex codes here or in components.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (name: string, steps: (string | number)[]) => Object.fromEntries(steps.map((s) => [s, v(`${name}-${s}`)]));

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        heading: ["var(--font-display)", "Bricolage Grotesque", "var(--font-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Bricolage Grotesque", "system-ui", "sans-serif"],
        body: ["var(--font-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "ui-monospace", "monospace"],
      },
      colors: {
        brand: scale("brand", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        logo: scale("logo", ["indigo", "periwinkle", "teal", "emerald", "wordmark"]),
        mint: { DEFAULT: v("mint-400"), ...scale("mint", [50, 100, 200, 300, 400, 600, 700, 800, 900]) },
        cream: { DEFAULT: v("cream-100"), ...scale("cream", [50, 100, 200, 300, 700]) },
        paper: { DEFAULT: v("paper-1"), 2: v("paper-2") },
        ink: { DEFAULT: v("ink-1"), 2: v("ink-2"), 3: v("ink-3") },
        navy: { DEFAULT: v("navy-900"), 800: v("navy-800"), 700: v("navy-700") },
        success: { DEFAULT: v("success-500"), 50: v("success-50"), 700: v("success-700") },
        danger: { DEFAULT: v("danger-500"), 50: v("danger-50"), 700: v("danger-700") },
        warning: { DEFAULT: v("warning-500"), 50: v("warning-50"), 800: v("warning-800") },
        info: { DEFAULT: v("info-500"), 50: v("info-50"), 700: v("info-700") },
      },
      backgroundImage: { "logo-gradient": "var(--logo-gradient)" },
      boxShadow: { lift: "var(--shadow-lift)", pop: "var(--shadow-pop)" },
      transitionDuration: { fast: "var(--dur-fast)", base: "var(--dur-base)", slow: "var(--dur-slow)", "set-piece": "var(--dur-set-piece)" },
      transitionTimingFunction: { out: "var(--ease-out)" },
      fontSize: { label: ["var(--text-label)", { letterSpacing: "0.06em" }], figure: ["var(--text-figure)", { lineHeight: "1" }] },
    },
  },
  plugins: [typography],
};

export default config;
