import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep cool neutrals — near-black, faint blue cast (premium fintech dark)
        ink: {
          950: "#070810",
          900: "#0A0C15",
          850: "#0E111C",
          800: "#141826",
          700: "#1C2030",
          600: "#272C3D",
          500: "#3A4054",
        },
        // Semantic surfaces (use via .card classes; raw access for one-offs)
        surface: {
          DEFAULT: "#0E111C",
          raised: "#141826",
          inset: "#0A0C15",
        },
        // Primary — electric violet ("sealed / confidential"). Single brand accent.
        seal: {
          50: "#F1ECFF",
          100: "#E0D5FF",
          200: "#C4B0FF",
          300: "#A689FF",
          400: "#8E70FF",
          500: "#6E4CFF",
          600: "#5A37E8",
          700: "#4727BC",
          800: "#321A86",
          900: "#1E0F52",
        },
        // Positive — emerald (received / confirmed). Calm bank-green.
        emerald: {
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },
        // Secondary — cyan ("ciphertext / data flow"). Sparse.
        cipher: {
          300: "#7DEEE3",
          400: "#4FD1C5",
          500: "#27B6A8",
          600: "#138F84",
        },
        // Legacy iris references (kept so nothing breaks)
        iris: {
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        // Festive — red packet feature ONLY
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
        // Zama brand yellow — RARE accent (FHE badge only)
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
      letterSpacing: {
        tightest: "-0.03em",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.75rem",
      },
      boxShadow: {
        // Resting card — subtle depth, no glow
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 30px -18px rgba(0,0,0,0.7)",
        // Raised — sheets, nav, popovers
        lift: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 60px -24px rgba(0,0,0,0.85)",
        // Accent glow — primary CTA + balance only
        glow: "0 8px 30px -10px rgba(110,76,255,0.45)",
        "glow-lucky": "0 8px 30px -10px rgba(229,72,77,0.45)",
        "glow-zama": "0 0 0 1px rgba(255,210,8,0.28), 0 6px 22px -10px rgba(255,210,8,0.3)",
      },
      backgroundImage: {
        // Page ambience — very subtle, single soft violet bloom up top
        "page-glow":
          "radial-gradient(ellipse 90% 50% at 50% -15%, rgba(110,76,255,0.12), transparent 65%)",
        "seal-gradient": "linear-gradient(135deg, #8E70FF 0%, #6E4CFF 55%, #5A37E8 120%)",
        "lucky-gradient": "linear-gradient(150deg, #FF8585 0%, #E5484D 50%, #F5A623 130%)",
        "iris-gradient": "linear-gradient(135deg, #A689FF 0%, #5A37E8 100%)",
        "cipher-gradient": "linear-gradient(135deg, #7DEEE3 0%, #4FD1C5 60%, #6E4CFF 130%)",
        "sheen": "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "100%": { transform: "scale(1.7)", opacity: "0" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "spin-smooth": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 2.4s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.22,1,0.36,1) infinite",
        float: "float 6s ease-in-out infinite",
        "spin-smooth": "spin-smooth 0.85s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
