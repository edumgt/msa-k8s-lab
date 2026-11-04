/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Space Grotesk", "sans-serif"],
        display: ["Plus Jakarta Sans", "Space Grotesk", "sans-serif"],
        body: ["Plus Jakarta Sans", "Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81"
        },
        ink: "#0f172a",
        mint: "#0f766e",
        ember: "#ea580c",
        haze: "#ecfeff"
      }
    }
  },
  plugins: []
};

