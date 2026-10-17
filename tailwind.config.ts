import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Sistema de diseño Códigos
        vino:          "#7A1C38",
        frambuesa:     "#A12B52",
        rosa:          "#E8557F",
        "rosa-claro":  "#F6A9BE",
        oro:           "#C9A86A",
        "rosa-palido": "#F6C6D3",
        rubor:         "#FFF1F4",
        nube:          "#FBF6F7",
        borde:         "#F1DCE2",
        tinta:         "#4E0F22",
        "texto-suave": "#7A4A58",
        noche:         "#2B1A20",
        "noche-texto": "#F6E4E9",
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
        sans:      ["Nunito", "system-ui", "sans-serif"],
        display:   ["Fraunces", "Georgia", "serif"],
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
