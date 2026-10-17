import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal:   "#1C1C1E",
        surface:    "#2C2C2E",
        surfaceAlt: "#3A3A3C",
        amber:      "#FFB454",
        amberHover: "#E8A040",
        textPrimary:   "#FFFFFF",
        textSecondary: "#A1A1A3",
        textMuted:     "#636366",
        success: "#34C759",
        error:   "#FF453A",
      },
      fontFamily: {
        sans:      ["Inter", "system-ui", "sans-serif"],
        editorial: ["Oswald", "Barlow Condensed", "Inter", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
