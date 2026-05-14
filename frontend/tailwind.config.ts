import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: "#0f172a",
          hover: "#1e293b",
          active: "#1e40af",
          text: "#94a3b8",
          "text-active": "#f1f5f9",
        },
        status: {
          hot: "#ef4444",
          "hot-bg": "#fef2f2",
          warm: "#f59e0b",
          "warm-bg": "#fffbeb",
          cold: "#3b82f6",
          "cold-bg": "#eff6ff",
          unqualified: "#6b7280",
          "unqualified-bg": "#f9fafb",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
