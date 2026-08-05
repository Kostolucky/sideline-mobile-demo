/**
 * Design tokens ported from the web mockup (`sideline-mobile-mockup`).
 *
 * The mockup expresses colour in oklch CSS custom properties, which React
 * Native can't parse — these are the sRGB conversions of those exact values.
 * The mockup is dark-only by design (`color-scheme: dark`, no light palette),
 * so there is deliberately no light variant here.
 */

export const colors = {
  /** Matte black app background. */
  background: "#0D0D0D",
  foreground: "#F8F8F8",

  /** Dark charcoal — cards, sheets, the recording surface. */
  card: "#181818",
  cardForeground: "#F8F8F8",

  /** Restrained off-white for general (non-brand) actions. */
  primary: "#EBEBEB",
  primaryForeground: "#0D0D0D",

  secondary: "#262626",
  secondaryForeground: "#F8F8F8",

  muted: "#262626",
  /** Secondary text. */
  mutedForeground: "#989898",

  /** Muted green — subtle "ready" success indicators. */
  accent: "#43B966",
  accentForeground: "#0D0D0D",

  destructive: "#E64343",

  /** Vivid red, reserved for record controls. */
  record: "#DF2225",
  recordForeground: "#F8F8F8",

  /** Electric green — the Sideline accent: logo, new-call FAB, recording bar. */
  brand: "#49F860",
  brandForeground: "#0D0D0D",

  /** Hairline borders and input outlines. */
  border: "rgba(255,255,255,0.12)",
  input: "rgba(255,255,255,0.14)",

  /** Scrim behind sheets and dialogs. */
  scrim: "rgba(0,0,0,0.6)",
  scrimStrong: "rgba(0,0,0,0.7)",
} as const;

/**
 * Derived from the mockup's `--radius: 0.9rem` (14.4px) and its scale
 * multipliers, rounded to whole pixels.
 */
export const radius = {
  sm: 9,
  md: 12,
  lg: 14,
  xl: 20,
  "2xl": 26,
  "3xl": 32,
  /** Pills and circles. */
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
} as const;

/**
 * Type scale lifted from the mockup's Tailwind classes. `relaxed` line heights
 * use Tailwind's 1.625 ratio, rounded to whole pixels.
 */
export const type = {
  /** Header wordmark — text-xl semibold. */
  wordmark: { fontSize: 20, fontWeight: "600", letterSpacing: -0.3 },
  /** Recording-screen title input — text-[2rem] semibold. */
  titleLarge: { fontSize: 32, fontWeight: "600", lineHeight: 38, letterSpacing: -0.5 },
  /** Call detail heading — text-[1.75rem] semibold. */
  title: { fontSize: 28, fontWeight: "600", lineHeight: 33, letterSpacing: -0.4 },
  /** Section subheadings — text-base semibold. */
  subheading: { fontSize: 16, fontWeight: "600" },
  /** Call row name — text-base medium. */
  rowTitle: { fontSize: 16, fontWeight: "500" },
  /** Control-bar labels — text-base semibold. */
  control: { fontSize: 16, fontWeight: "600" },
  /** Body copy — text-[0.9375rem] leading-relaxed. */
  body: { fontSize: 15, lineHeight: 24 },
  /** Date group headings, date chip, tab labels — text-sm. */
  label: { fontSize: 14 },
  /** ALL-CAPS section labels — text-xs semibold tracking-wider. */
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  /** Timestamps and meta — text-[0.6875rem]. */
  meta: { fontSize: 11 },
} as const;

/** Monospaced digits, for timers and playback positions. */
export const tabularNums = { fontVariant: ["tabular-nums" as const] };

/** Standard pressed-state feedback — the mockup's `active:scale-95`. */
export const PRESSED_OPACITY = 0.7;

/** Minimum comfortable tap target. */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
