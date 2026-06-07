import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171412",
        paper: "#fbf8f4",
        blush: "#f3b6a6",
        coral: "#e76f59",
        sage: "#7d9276",
        graphite: "#2f2b28"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(47, 43, 40, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
