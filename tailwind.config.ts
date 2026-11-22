import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Hệ màu Slush Design System (Refero Style 8b6b547f)
        slush: {
          bg: "#dceeff",        // Sky Wash (nền chính)
          paper: "#ffffff",     // Paper White
          carbon: "#000000",    // Solid Black cho viền 1px & chữ
          concrete: "#f1f3f6",  // Xám mềm phụ
          electric: "#4da2ff",  // 3D Ribbon Blue
          mint: "#55db9c",      // Fresh Mint (Cầu lông & Check-in)
          sunburst: "#ffd731",  // Sunburst Yellow (Nổi bật & Quỹ)
          violet: "#5c4ade",    // Voltage Violet (VietQR & Thanh toán)
          ember: "#fb4903",     // Ember Orange (Cảnh báo & Chi phí)
          lilac: "#e9ccff",     // Soft Lilac (Hội viên & Thống kê)
        },
      },
      boxShadow: {
        'hard-sm': '2px 2px 0px #000000',
        'hard': '4px 4px 0px #000000',
        'hard-lg': '6px 6px 0px #000000',
        'hard-xl': '8px 8px 0px #000000',
      },
      borderRadius: {
        'pill': '9999px',
        'sticker': '20px',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      keyframes: {
        'marquee-ltr': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        'marquee-rtl': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'marquee-ltr': 'marquee-ltr 32s linear infinite',
        'marquee-rtl': 'marquee-rtl 32s linear infinite',
        'float-slow': 'float-slow 3s ease-in-out infinite',
        'float-delayed': 'float-slow 3.6s ease-in-out 1.2s infinite',
      },
    },
  },
  plugins: [],
};
export default config;
