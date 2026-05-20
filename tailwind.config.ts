import type { Config } from "tailwindcss";

/**
 * Chainwork — Tailwind config (dark-native v2).
 *
 * Tailwind v4 reads its theme from CSS, but the design-token → utility
 * mapping is kept here per spec §2.1 / §2.3. globals.css loads this file
 * via `@config`. Colors point at the CSS variables defined in
 * src/styles/tokens.css, so the single source of truth stays in one place.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        /* surfaces */
        base: "var(--cw-base)",
        surface: {
          DEFAULT: "var(--cw-surface)",
          "2": "var(--cw-surface-2)",
          "3": "var(--cw-surface-3)",
        },
        elevated: "var(--cw-elevated)",

        /* glass fills */
        glass: {
          DEFAULT: "var(--cw-glass)",
          hi: "var(--cw-glass-hi)",
        },

        /* borders — used as border-subtle / border-line / border-strong */
        subtle: "var(--cw-border-subtle)",
        line: "var(--cw-border-line)",
        strong: "var(--cw-border-strong)",

        /* text — used as text-text-primary, text-text-secondary … */
        text: {
          primary: "var(--cw-text-primary)",
          bright: "var(--cw-text-bright)",
          secondary: "var(--cw-text-secondary)",
          tertiary: "var(--cw-text-tertiary)",
          muted: "var(--cw-text-muted)",
        },

        /* accents */
        accent: {
          blue: "var(--cw-accent-blue)",
          "blue-deep": "var(--cw-accent-blue-deep)",
          purple: "var(--cw-accent-purple)",
          cyan: "var(--cw-accent-cyan)",
          green: "var(--cw-accent-green)",
          amber: "var(--cw-accent-amber)",
          pink: "var(--cw-accent-pink)",
        },
      },

      /* typography scale — spec §2.3. [size, { lineHeight, letterSpacing, fontWeight }] */
      fontSize: {
        h1: ["3.5rem", { lineHeight: "1.04", letterSpacing: "-0.035em", fontWeight: "600" }],
        h2: ["1.625rem", { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "600" }],
        h3: ["1rem", { lineHeight: "1.3", letterSpacing: "-0.015em", fontWeight: "600" }],
        "body-lg": ["0.9375rem", { lineHeight: "1.6" }],
        body: ["0.875rem", { lineHeight: "1.6" }],
        caption: ["0.75rem", { lineHeight: "1.45" }],
        eyebrow: ["0.65625rem", { lineHeight: "1.4", letterSpacing: "0.06em", fontWeight: "500" }],
      },

      backgroundImage: {
        "gradient-brand": "var(--cw-gradient-brand)",
      },
    },
  },
  plugins: [],
};

export default config;
