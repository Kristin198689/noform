import media from "@/lib/media.json";

export type MediaId = keyof typeof media;

type ImgProps = {
  id: MediaId;
  alt: string;
  /** CSS `sizes` for responsive selection. */
  sizes: string;
  className?: string;
  priority?: boolean;
  style?: React.CSSProperties;
  draggable?: boolean;
};

export function mediaSrc(id: MediaId, width?: number, ext: "webp" | "avif" = "webp"): string {
  const entry = media[id];
  const w = width && entry.widths.includes(width) ? width : entry.widths[entry.widths.length - 1];
  return `/media/${id}-${w}.${ext}`;
}

function srcSet(id: MediaId, ext: "webp" | "avif"): string {
  return media[id].widths.map((w) => `/media/${id}-${w}.${ext} ${w}w`).join(", ");
}

/**
 * AVIF/WebP picture with intrinsic size (no CLS). Lazy unless it is the hero;
 * <ScenePreloader> upgrades the next scene's images to eager before the reader arrives.
 * Opaque photos carry a 20px blurred placeholder so a slow network never shows an empty field.
 */
export function Img({ id, alt, sizes, className, priority = false, style, draggable }: ImgProps) {
  const entry = media[id];
  const lqip = "lqip" in entry ? entry.lqip : undefined;
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(id, "avif")} sizes={sizes} />
      {/* Derivatives are pre-built (scripts/build-images.mjs); no runtime optimizer needed. */}
      <img
        src={mediaSrc(id, 960)}
        srcSet={srcSet(id, "webp")}
        sizes={sizes}
        width={entry.width}
        height={entry.height}
        alt={alt}
        className={className}
        style={lqip ? { backgroundImage: `url("${lqip}")`, backgroundSize: "cover", backgroundPosition: "center", ...style } : style}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        draggable={draggable}
        data-lazy={priority ? undefined : ""}
      />
    </picture>
  );
}
