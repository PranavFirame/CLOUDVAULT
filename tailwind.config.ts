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
          50: "rgb(254 246 238)",
          100: "rgb(253 234 214)",
          200: "rgb(250 210 172)",
          300: "rgb(246 182 125)",
          400: "rgb(243 170 102)",
          500: "rgb(240 158 79)", // Requested button & brand primary: rgb(240 158 79)
          600: "rgb(222 136 53)",
          700: "rgb(186 104 38)",
          800: "rgb(150 82 34)",
          900: "rgb(122 68 31)",
          950: "rgb(66 33 13)",
        },
        accent: {
          green: "rgb(100 215 113)", // Requested green replacement: rgb(100 215 113)
        },
        cyber: {
          amber: "rgb(240 158 79)",
          emerald: "rgb(100 215 113)", // Requested green: rgb(100 215 113)
          cyan: "#06b6d4",
          blue: "rgb(100 215 113)",
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
        glow: "0 0 24px -4px rgba(240, 158, 79, 0.25)",
        emerald: "0 0 24px -4px rgba(100, 215, 113, 0.25)",
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
