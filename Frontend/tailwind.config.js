/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      "colors": {
          "secondary-fixed": "rgb(var(--color-secondary-fixed) / <alpha-value>)",
          "surface-dim": "rgb(var(--color-surface-dim) / <alpha-value>)",
          "on-tertiary-container": "rgb(var(--color-on-tertiary-container) / <alpha-value>)",
          "on-surface": "rgb(var(--color-on-surface) / <alpha-value>)",
          "tertiary": "rgb(var(--color-tertiary) / <alpha-value>)",
          "surface-bright": "rgb(var(--color-surface-bright) / <alpha-value>)",
          "surface-container-low": "rgb(var(--color-surface-container-low) / <alpha-value>)",
          "surface-container-highest": "rgb(var(--color-surface-container-highest) / <alpha-value>)",
          "tertiary-container": "rgb(var(--color-tertiary-container) / <alpha-value>)",
          "tertiary-fixed": "rgb(var(--color-tertiary-fixed) / <alpha-value>)",
          "secondary-fixed-dim": "rgb(var(--color-secondary-fixed-dim) / <alpha-value>)",
          "surface-tint": "rgb(var(--color-surface-tint) / <alpha-value>)",
          "background": "rgb(var(--color-background) / <alpha-value>)",
          "on-secondary-fixed-variant": "rgb(var(--color-on-secondary-fixed-variant) / <alpha-value>)",
          "on-primary": "rgb(var(--color-on-primary) / <alpha-value>)",
          "secondary-container": "rgb(var(--color-secondary-container) / <alpha-value>)",
          "on-tertiary": "rgb(var(--color-on-tertiary) / <alpha-value>)",
          "surface": "rgb(var(--color-surface) / <alpha-value>)",
          "primary-fixed": "rgb(var(--color-primary-fixed) / <alpha-value>)",
          "error-container": "rgb(var(--color-error-container) / <alpha-value>)",
          "on-primary-container": "rgb(var(--color-on-primary-container) / <alpha-value>)",
          "on-surface-variant": "rgb(var(--color-on-surface-variant) / <alpha-value>)",
          "on-secondary-fixed": "rgb(var(--color-on-secondary-fixed) / <alpha-value>)",
          "primary": "rgb(var(--color-primary) / <alpha-value>)",
          "error": "rgb(var(--color-error) / <alpha-value>)",
          "outline": "rgb(var(--color-outline) / <alpha-value>)",
          "inverse-surface": "rgb(var(--color-inverse-surface) / <alpha-value>)",
          "on-error": "rgb(var(--color-on-error) / <alpha-value>)",
          "on-error-container": "rgb(var(--color-on-error-container) / <alpha-value>)",
          "surface-variant": "rgb(var(--color-surface-variant) / <alpha-value>)",
          "secondary": "rgb(var(--color-secondary) / <alpha-value>)",
          "inverse-primary": "rgb(var(--color-inverse-primary) / <alpha-value>)",
          "inverse-on-surface": "rgb(var(--color-inverse-on-surface) / <alpha-value>)",
          "on-primary-fixed": "rgb(var(--color-on-primary-fixed) / <alpha-value>)",
          "on-tertiary-fixed": "rgb(var(--color-on-tertiary-fixed) / <alpha-value>)",
          "on-background": "rgb(var(--color-on-background) / <alpha-value>)",
          "on-primary-fixed-variant": "rgb(var(--color-on-primary-fixed-variant) / <alpha-value>)",
          "on-tertiary-fixed-variant": "rgb(var(--color-on-tertiary-fixed-variant) / <alpha-value>)",
          "primary-container": "rgb(var(--color-primary-container) / <alpha-value>)",
          "surface-container-lowest": "rgb(var(--color-surface-container-lowest) / <alpha-value>)",
          "primary-fixed-dim": "rgb(var(--color-primary-fixed-dim) / <alpha-value>)",
          "tertiary-fixed-dim": "rgb(var(--color-tertiary-fixed-dim) / <alpha-value>)",
          "outline-variant": "rgb(var(--color-outline-variant) / <alpha-value>)",
          "surface-container": "rgb(var(--color-surface-container) / <alpha-value>)",
          "on-secondary-container": "rgb(var(--color-on-secondary-container) / <alpha-value>)",
          "surface-container-high": "rgb(var(--color-surface-container-high) / <alpha-value>)",
          "on-secondary": "rgb(var(--color-on-secondary) / <alpha-value>)"
      },
      "borderRadius": {
          "DEFAULT": "0.25rem",
          "lg": "0.5rem",
          "xl": "0.75rem",
          "full": "9999px",
          "2xl": "1rem"
      },
      "spacing": {
          "stack-sm": "8px",
          "unit": "8px",
          "gutter": "16px",
          "stack-lg": "24px",
          "touch-target-min": "48px",
          "margin-mobile": "20px",
          "stack-md": "16px"
      },
      "fontFamily": {
          "body-md": ["Public Sans"],
          "h1": ["Public Sans"],
          "caption": ["Public Sans"],
          "body-sm": ["Public Sans"],
          "h3": ["Public Sans"],
          "h2": ["Public Sans"],
          "label-bold": ["Public Sans"],
          "body-lg": ["Public Sans"]
      },
      "fontSize": {
          "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
          "h1": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
          "caption": ["12px", {"lineHeight": "16px", "fontWeight": "500"}],
          "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
          "h3": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
          "h2": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "700"}],
          "label-bold": ["14px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
          "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}]
      },
      "keyframes": {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "loading-bar": {
          "0%": { width: "0%", opacity: "1" },
          "50%": { width: "50%", opacity: "1" },
          "100%": { width: "100%", opacity: "0" }
        }
      },
      "animation": {
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        "fade-in": "fade-in 0.8s ease-out forwards",
        "loading-bar": "loading-bar 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite"
      }
    }
  },
  plugins: [],
}
