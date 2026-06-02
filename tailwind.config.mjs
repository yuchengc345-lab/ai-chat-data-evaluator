/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/app/**/*.{js,jsx}", "./src/components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172026",
        mist: "#f6f8fb",
        line: "#d8e0ea",
        teal: "#0f766e",
        rose: "#be123c",
        amber: "#b45309",
      },
    },
  },
  plugins: [],
};

export default config;
