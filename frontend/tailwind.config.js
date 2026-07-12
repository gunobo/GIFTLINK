/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        accent: {
          400: "#fb7185",
          500: "#f43f5e",
        },
        gold: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 100%)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(17, 12, 46, 0.06), 0 1px 2px rgba(17, 12, 46, 0.04)",
        "card-hover": "0 8px 24px rgba(124, 58, 237, 0.12)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
