import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans:     ["Inter", "sans-serif"],
        mono:     ["JetBrains Mono", "monospace"],
        "mono-ui":["IBM Plex Mono", "monospace"],
      },
      colors: {
        // Shadcn/Radix tokens — kept for UI component compatibility
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT:            "hsl(var(--sidebar-background))",
          foreground:         "hsl(var(--sidebar-foreground))",
          primary:            "hsl(var(--sidebar-primary))",
          "primary-foreground":"hsl(var(--sidebar-primary-foreground))",
          accent:             "hsl(var(--sidebar-accent))",
          "accent-foreground":"hsl(var(--sidebar-accent-foreground))",
          border:             "hsl(var(--sidebar-border))",
          ring:               "hsl(var(--sidebar-ring))",
        },

        // ── ZERØ MERIDIAN Design Tokens — rgba() only ─────────────
        zm: {
          blue:    "rgba(96,165,250,1)",
          cyan:    "var(--zm-cyan)",
          violet:  "var(--zm-violet)",
          emerald: "var(--zm-positive)",
          rose:    "var(--zm-negative)",
          amber:   "var(--zm-warning)",
          orange:  "rgba(251,146,60,1)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        // Radix
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },

        // ── ZM Keyframes ──────────────────────────────────────────
        "flash-pos": {
          "0%, 100%": { backgroundColor: "transparent" },
          "30%":      { backgroundColor: "rgba(52,211,153,0.22)", color: "rgba(16,130,80,1)" },
        },
        "flash-neg": {
          "0%, 100%": { backgroundColor: "transparent" },
          "30%":      { backgroundColor: "rgba(251,113,133,0.22)", color: "rgba(200,30,60,1)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(96,165,250,0.3)" },
          "50%":      { boxShadow: "0 0 40px rgba(96,165,250,0.6), 0 0 80px rgba(96,165,250,0.2)" },
        },
        "pulse-ring": {
          "0%":   { transform: "scale(1)",   opacity: "0.8" },
          "100%": { transform: "scale(2.2)", opacity: "0"   },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0"  },
        },
        "ticker-scroll": {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "aurora-shift": {
          "0%, 100%": { opacity: "0.7", transform: "scale(1) translateX(0)" },
          "50%":      { opacity: "1",   transform: "scale(1.08) translateX(20px)" },
        },
        "scan-sweep": {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(500%)"  },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)"   },
          "50%":      { transform: "translateY(-10px)" },
        },
        "gradient-text": {
          "0%":   { backgroundPosition: "0% 50%"   },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%"   },
        },
        "slide-in-right": {
          from: { transform: "translateX(12px)", opacity: "0" },
          to:   { transform: "translateX(0)",    opacity: "1" },
        },
        "slide-in-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to:   { transform: "translateY(0)",   opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to:   { transform: "scale(1)",    opacity: "1" },
        },
        "number-flip": {
          "0%":   { transform: "translateY(0)",    opacity: "1" },
          "40%":  { transform: "translateY(-8px)", opacity: "0" },
          "60%":  { transform: "translateY(8px)",  opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "flash-pos":       "flash-pos 300ms ease-out",
        "flash-neg":       "flash-neg 300ms ease-out",
        "pulse-glow":      "pulse-glow 4.5s ease-in-out infinite",
        "pulse-ring":      "pulse-ring 4.5s ease-out infinite",
        "shimmer":         "shimmer 1.8s ease infinite",
        "ticker-scroll":   "ticker-scroll 40s linear infinite",
        "aurora-shift":    "aurora-shift 12s ease-in-out infinite",
        "scan-sweep":      "scan-sweep 14s linear infinite 10s",
        "float":           "float 6s ease-in-out infinite",
        "gradient-text":   "gradient-text 4s ease infinite",
        "slide-right":     "slide-in-right 0.25s cubic-bezier(0.16,1,0.3,1)",
        "slide-up":        "slide-in-up 0.25s cubic-bezier(0.16,1,0.3,1)",
        "fade-in":         "fade-in 0.25s cubic-bezier(0.4,0,0.2,1)",
        "scale-in":        "scale-in 0.15s cubic-bezier(0.34,1.56,0.64,1)",
        "number-flip":     "number-flip 350ms cubic-bezier(0.34,1.56,0.64,1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
