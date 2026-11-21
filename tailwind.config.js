/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        scrapbook: {
          bg: "#FCEEF2",        // Soft Pink kertas surat
          card: "#FFFFFF",      // Putih bersih bingkai Polaroid
          primary: "#E57399",   // Warm Berry Pink (tombol & banner)
          secondary: "#F8C8DC", // Cotton Candy Pink (chip kategori)
          sticky: "#FFF5D6",    // Soft Cream Yellow (On This Day)
          text: "#4A3B40",      // Warm Dark Brown-Grey (teks utama)
        },
      },
      fontFamily: {
        handwriting: ['"Caveat"', "cursive"],
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};