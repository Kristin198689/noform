import { WORDMARK_PATH, WORDMARK_VIEWBOX } from "@/lib/wordmark";

type WordmarkProps = {
  className?: string;
  viewBox?: string;
  variant?: "fill" | "outline";
  /** Accessible name; omit for decorative copies. */
  label?: string;
  pathClassName?: string;
};

/** The approved NØFORM wordmark (single SVG path, currentColor). */
export function Wordmark({ className, viewBox = WORDMARK_VIEWBOX, variant = "fill", label, pathClassName }: WordmarkProps) {
  return (
    <svg
      className={className}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        className={pathClassName}
        d={WORDMARK_PATH}
        fill={variant === "fill" ? "currentColor" : "none"}
        stroke={variant === "outline" ? "currentColor" : undefined}
        strokeWidth={variant === "outline" ? 1.4 : undefined}
        vectorEffect={variant === "outline" ? "non-scaling-stroke" : undefined}
        pathLength={variant === "outline" ? 1 : undefined}
      />
    </svg>
  );
}
