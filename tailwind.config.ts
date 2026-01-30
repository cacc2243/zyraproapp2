import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1080px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Alexandria', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(168, 85, 247, 0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(168, 85, 247, 0.8)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        "sound-wave": {
          "0%, 100%": { 
            transform: "scale(1)",
            boxShadow: "0 0 0 0 rgba(34, 197, 94, 0.4), 0 0 0 0 rgba(34, 197, 94, 0.2)"
          },
          "50%": { 
            transform: "scale(1.03)",
            boxShadow: "0 0 20px 10px rgba(34, 197, 94, 0.3), 0 0 40px 20px rgba(34, 197, 94, 0.1)"
          },
        },
        "sound-ring": {
          "0%": { 
            transform: "scale(1)",
            opacity: "0.6"
          },
          "100%": { 
            transform: "scale(1.8)",
            opacity: "0"
          },
        },
        "equalizer-bar": {
          "0%, 100%": { height: "20%" },
          "50%": { height: "100%" },
        },
        "confetti": {
          "0%": { 
            transform: "translateY(0) rotate(0deg)",
            opacity: "1"
          },
          "100%": { 
            transform: "translateY(100vh) rotate(720deg)",
            opacity: "0"
          },
        },
        "audio-wave": {
          "0%, 100%": { height: "20%" },
          "25%": { height: "80%" },
          "50%": { height: "40%" },
          "75%": { height: "100%" },
        },
        "slide-in-notification": {
          "0%": { 
            transform: "translateX(-50%) translateY(-100%)",
            opacity: "0"
          },
          "100%": { 
            transform: "translateX(-50%) translateY(0)",
            opacity: "1"
          },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "shimmer": {
          "0%, 100%": { opacity: "0.15", transform: "translateX(-5%)" },
          "50%": { opacity: "0.3", transform: "translateX(5%)" },
        },
        "slow-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)", filter: "brightness(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.03)", filter: "brightness(1.15)" },
        },
        "float-particle": {
          "0%, 100%": { 
            transform: "translateY(0) translateX(0)",
            opacity: "0.6"
          },
          "25%": { 
            transform: "translateY(-20px) translateX(10px)",
            opacity: "1"
          },
          "50%": { 
            transform: "translateY(-10px) translateX(-5px)",
            opacity: "0.8"
          },
          "75%": { 
            transform: "translateY(-25px) translateX(15px)",
            opacity: "0.4"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow": "glow 2s ease-in-out infinite",
        "shake": "shake 0.5s ease-in-out",
        "sound-wave": "sound-wave 0.8s ease-in-out infinite",
        "sound-ring": "sound-ring 1.5s ease-out infinite",
        "equalizer-bar": "equalizer-bar 0.5s ease-in-out infinite",
        "confetti": "confetti 3s ease-in-out forwards",
        "audio-wave": "audio-wave 0.5s ease-in-out infinite",
        "slide-in-notification": "slide-in-notification 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "gradient-shift": "gradient-shift 4s ease infinite",
        "scan": "scan 3s linear infinite",
        "shimmer": "shimmer 4s ease-in-out infinite",
        "slow-pulse": "slow-pulse 6s ease-in-out infinite",
        "float-particle": "float-particle 8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
