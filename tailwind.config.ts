import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#090B16",
        panel: "#111528",
        violet: "#8B5CF6",
        cyan: "#22D3EE",
      },
      boxShadow: {
        glow: "0 0 40px rgba(139,92,246,.22)",
      },
    },
  },
  plugins: [],
};

export default config;
