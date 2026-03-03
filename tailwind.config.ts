import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
		mono: ["var(--font-mono)"],
      },
      // Здесь сохраняются настройки сгенерированные shadcn...
    },
  },
  plugins: [
	require("tailwindcss-animate"),
	require("@tailwindcss/typography")
  ],
};
export default config;