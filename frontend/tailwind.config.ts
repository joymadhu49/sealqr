import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#08090D",
          900: "#0B0D14",
          850: "#10131C",
          800: "#161A26",
          700: "#1E2331",
          600: "#2A3043",
          500: "#3D4459",
        },
        // Primary — electric violet ("sealed / confidential")
        seal: {
          50: "#EFEAFF",
          100: "#DCD0FF",
          200: "#BCA8FF",
          300: "#9C82FF",
          400: "#8466FF",
          500: "#6E4CFF",
          600: "#5B36F0",
          700: "#4724C2",
          800: "#311785",
          900: "#1C0C4F",
        },
        // Secondary — cyan ("ciphertext / data flow")
        cipher: {
          300: "#7DEEE3",
          400: "#4FD1C5",
          500: "#27B6A8",
          600: "#138F84",
        },
        // Tertiary — kept for legacy iris references
        iris: {
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        // Festive — red packet
        lucky: {
          300: "#FF9595",
          400: "#FF6B6B",
          500: "#E5484D",
          600: "#C2353A",
        },
        gold: {
          300: "#FFE08A",
          400: "#FFD05A",
          500: "#F5A623",
        },
        // Zama brand yellow — RARE accent only (FHE badges, "Powered by Zama")
        zama: {
          400: "#FFE04D",
          500: "#FFD208",
          600: "#E6BC00",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.75rem",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(110,76,255,0.22), 0 10px 44px -10px rgba(110,76,255,0.45)",
        "glow-cipher": "0 0 0 1px rgba(79,209,197,0.22), 0 10px 44px -10px rgba(79,209,197,0.42)",
        "glow-zama": "0 0 0 1px rgba(255,210,8,0.32), 0 8px 30px -10px rgba(255,210,8,0.35)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 22px 56px -22px rgba(0,0,0,0.85)",
        float: "0 28px 70px -26px rgba(0,0,0,0.9)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(110,76,255,0.14), transparent 60%), radial-gradient(ellipse 60% 50% at 100% 0%, rgba(79,209,197,0.09), transparent 55%)",
        "seal-gradient": "linear-gradient(135deg, #8466FF 0%, #6E4CFF 50%, #4FD1C5 140%)",
        "lucky-gradient": "linear-gradient(150deg, #FF8585 0%, #E5484D 45%, #F5A623 120%)",
        "iris-gradient": "linear-gradient(135deg, #9C82FF 0%, #5B36F0 100%)",
        "cipher-gradient": "linear-gradient(135deg, #7DEEE3 0%, #4FD1C5 60%, #6E4CFF 130%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "spin-smooth": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 2s infinite",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.16,1,0.3,1) infinite",
        float: "float 5s ease-in-out infinite",
        "spin-smooth": "spin-smooth 0.9s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
