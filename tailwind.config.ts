import type { Config } from "tailwindcss";

/**
 * Charte Dahu Sound System — reprise exacte du site vitrine (css/style.css).
 * Violet néon UV sur fond noir violacé.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        violet: {
          DEFAULT: "#7c3aed", // violet principal
          light: "#a78bfa",   // accents, liens
          glow: "#8b5cf6",    // violet lumineux
          deep: "#4c1d95",    // violet profond
        },
        link: "#5eb3ff",      // bleu clair (liens)
        bg: "#0a0710",        // noir très légèrement violacé
        card: "#120d1c",
        "card-border": "#241a38",
        "text-main": "#f2eefb",
        "text-muted": "#9a8fb0",
        // États de stock (code couleur)
        stock: {
          ok: "#22c55e",      // vert
          low: "#f59e0b",     // orange
          out: "#ef4444",     // rouge
        },
      },
      fontFamily: {
        display: ["var(--font-bebas)", "Bebas Neue", "sans-serif"],
        sans: ["var(--font-rajdhani)", "Rajdhani", "sans-serif"],
        mono: ["var(--font-ubuntu-mono)", "Ubuntu Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 22px rgba(124,58,237,0.45)",
        "glow-lg": "0 0 30px rgba(167,139,250,0.6)",
        card: "0 8px 30px rgba(124,58,237,0.18)",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.35s ease",
        pop: "pop 0.18s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
