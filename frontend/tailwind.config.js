/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(222 47% 7%)",
        foreground: "hsl(210 40% 98%)",
        card: "hsl(222 40% 11%)",
        border: "hsl(217 33% 18%)",
        muted: "hsl(215 16% 47%)",
        primary: "hsl(199 89% 48%)",
        success: "hsl(142 76% 36%)",
        warning: "hsl(38 92% 50%)",
        danger: "hsl(0 72% 51%)"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(125,211,252,.12), 0 8px 40px rgba(14,165,233,.16)"
      }
    }
  },
  plugins: []
};
