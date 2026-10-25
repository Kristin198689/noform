import localFont from "next/font/local";

// Self-hosted from the handoff package (OFL licences next to each file).
// next/font/local serves them from /_next/static/media — same origin, no third-party requests.

export const museo = localFont({
  src: "../fonts/museomoderno/MuseoModerno-Variable.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-museo",
  // Latin display face; Ukrainian headings switch to Golos via :lang(uk).
  fallback: ["Golos Text", "system-ui", "sans-serif"],
});

export const golos = localFont({
  src: "../fonts/golostext/GolosText-Variable.woff2",
  weight: "400 900",
  style: "normal",
  display: "swap",
  variable: "--font-golos",
  fallback: ["system-ui", "sans-serif"],
});

export const plex = localFont({
  src: "../fonts/ibmplexmono/IBMPlexMono-Regular.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-plex",
  fallback: ["ui-monospace", "monospace"],
});
