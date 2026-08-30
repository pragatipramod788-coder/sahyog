import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef3fb", 100: "#d6e2f4", 200: "#adc5ea", 300: "#7fa3dc",
          400: "#4d7bc9", 500: "#2c5aab", 600: "#193f85", 700: "#123069",
          800: "#0d234e", 900: "#0B3D91", 950: "#081b38",
        },
        saffron: {
          50: "#fff8ed", 100: "#ffedc7", 200: "#ffd98a", 300: "#ffbf4d",
          400: "#ff9f1c", 500: "#f78310", 600: "#e0640a", 700: "#b9480c",
          800: "#953910", 900: "#7a3010",
        },
        forest: {
          50: "#edf9f0", 100: "#d1f0da", 200: "#a3e0b6", 300: "#6cc98d",
          400: "#3fac6b", 500: "#268f54", 600: "#1a7444", 700: "#155c38",
          800: "#134930", 900: "#0f3c29",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        devanagari: ["var(--font-deva)", "sans-serif"],
      },
      backgroundImage: {
        "chakra-pattern": "radial-gradient(circle at 1px 1px, rgba(11,61,145,0.08) 1px, transparent 0)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(11, 61, 145, 0.15)",
        "glass-sm": "0 4px 16px 0 rgba(11, 61, 145, 0.10)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(24px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out forwards",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
