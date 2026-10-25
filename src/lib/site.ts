// TODO(before public launch): set SITE_URL to the verified production domain.
// Until then canonical/hreflang URLs resolve against localhost.
export const siteUrl = process.env.SITE_URL?.trim() || "http://localhost:3000";

// TODO(before public launch): verified Volodina Web Studio URL. Not invented —
// while empty, the credit is rendered as plain text without a link.
export const studioUrl: string | null = null;
