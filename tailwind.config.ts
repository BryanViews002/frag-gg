import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#06060E",
        "bg-secondary": "#0C0C18",
        "bg-card": "#10101E",
        "bg-card-hover": "#141428",
        accent: "#FF4500",
        "accent-2": "#FF6B00",
        "neon-green": "#00FF87",
        "neon-blue": "#00D4FF",
        gold: "#FFD700",
        silver: "#C0C0C0",
        bronze: "#CD7F32",
        "text-primary": "#FFFFFF",
        "text-secondary": "#8B8FA8",
        "text-muted": "#4A4D6B",
      },
      fontFamily: {
        rajdhani: ["Rajdhani", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        orbitron: ["Orbitron", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        badge: "6px",
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        float: "float 3s ease-in-out infinite",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.35s ease-out",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "stagger-in": "staggerIn 0.5s ease-out",
        "count-up": "countUp 0.6s ease-out",
        "spin-slow": "spin 3s linear infinite",
        "bounce-subtle": "bounceSuble 1.5s ease-in-out infinite",
        scanline: "scanline 8s linear infinite",
        "draw-line": "drawLine 1s ease-out forwards",
        "bar-fill": "barFill 0.8s ease-out forwards",
        "live-pulse": "livePulse 1.5s ease-in-out infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(255,69,0,0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(255,69,0,0.7), 0 0 40px rgba(255,69,0,0.3)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        staggerIn: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        countUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        bounceSuble: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        drawLine: {
          from: { strokeDashoffset: "1000" },
          to: { strokeDashoffset: "0" },
        },
        barFill: {
          from: { width: "0%" },
          to: { width: "var(--bar-width, 100%)" },
        },
        livePulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.3)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        "accent-glow": "0 0 20px rgba(255,69,0,0.35)",
        "accent-dim": "0 0 20px rgba(255,69,0,0.12)",
        "card-hover": "0 8px 32px rgba(255,69,0,0.15), 0 0 0 1px rgba(255,69,0,0.3)",
        "neon-green": "0 0 20px rgba(0,255,135,0.35)",
        "neon-blue": "0 0 20px rgba(0,212,255,0.35)",
        gold: "0 0 20px rgba(255,215,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
