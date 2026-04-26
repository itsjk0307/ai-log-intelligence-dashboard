import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b1020",
        panel: "#131b34",
        border: "#24304f",
        accent: "#38bdf8",
      },
      boxShadow: {
        panel: "0 10px 35px rgba(3, 10, 28, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
