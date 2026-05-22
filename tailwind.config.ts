import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#070B12",
        panel: "#10151F",
        line: "rgba(148, 163, 184, 0.18)",
        acid: "#B7F34C",
        cyan: "#35D7FF",
        violet: "#9A7CFF",
        ember: "#FF8A4C",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(183, 243, 76, 0.12), 0 24px 80px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
