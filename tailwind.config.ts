import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        "surface-border": "var(--surface-border)",
        brand: {
          50: "#fdf8ee",
          100: "#fbf0d8",
          200: "#f6deb1",
          300: "#f0ca85",
          400: "#ebb45b",
          500: "#e5a93c", // Accent Gold from portfolio
          600: "#ce8f28",
          700: "#aa6e21",
          800: "#895620",
          900: "#71461e",
          950: "#41240c",
        },
        cyber: {
          amber: "#e5a93c",
          emerald: "#10b981",
          cyan: "#06b6d4",
          blue: "#3b82f6",
          rose: "#f43f5e",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Inter",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        subtle: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
        card: "0 12px 32px -4px rgba(0, 0, 0, 0.08)",
        glow: "0 0 24px -4px rgba(229, 169, 60, 0.25)",
        emerald: "0 0 24px -4px rgba(16, 185, 129, 0.25)",
      },
      borderRadius: {
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
