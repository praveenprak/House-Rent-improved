/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#05070f",
          900: "#0a0e1a",
          800: "#111726",
          700: "#1a2236",
        },
        accent: {
          500: "#f59e0b",
          600: "#d97706",
          400: "#fbbf24",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(245,158,11,0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "ring-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(245,158,11,0.55)" },
          "70%": { boxShadow: "0 0 0 16px rgba(245,158,11,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(245,158,11,0)" },
        },
        blink: {
          "0%, 80%, 100%": { opacity: "0.25" },
          "40%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "slide-in": "slide-in 0.35s ease-out both",
        "pop-in": "pop-in 0.25s ease-out both",
        shimmer: "shimmer 1.4s linear infinite",
        "ring-pulse": "ring-pulse 2.4s ease-out infinite",
        blink: "blink 1.2s infinite both",
      },
    },
  },
  plugins: [],
};
