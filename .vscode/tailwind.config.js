/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        fadeSlideIn: {
          "0%": { opacity: 0, transform: "translateY(6px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        feedIn: {
          "0%": { opacity: 0, transform: "translateX(-8px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.4, transform: "scale(0.8)" },
        },
        stampPop: {
          "0%": { transform: "scale(0.5) rotate(-8deg)", opacity: 0 },
          "60%": { transform: "scale(1.08) rotate(2deg)", opacity: 1 },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: 1 },
        },
        drawerSlide: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        toastIn: {
          "0%": { opacity: 0, transform: "translateY(10px) scale(0.98)" },
          "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "fade-slide-in": "fadeSlideIn 0.35s ease-out both",
        "feed-in": "feedIn 0.4s ease-out both",
        "pulse-dot": "pulseDot 1.6s ease-in-out infinite",
        "stamp-pop": "stampPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        "drawer-slide": "drawerSlide 0.25s ease-out both",
        "toast-in": "toastIn 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};
