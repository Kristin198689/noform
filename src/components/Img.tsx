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

/** AVIF/WebP picture with intrinsic size (no CLS); lazy unless it is the hero. */
export function Img({ id, alt, sizes, className, priority = false, style, draggable }: ImgProps) {
  const { width, height } = media[id];
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(id, "avif")} sizes={sizes} />
      {/* Derivatives are pre-built (scripts/build-images.mjs); no runtime optimizer needed. */}
      <img
        src={mediaSrc(id, 960)}
        srcSet={srcSet(id, "webp")}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt}
        className={className}
        style={style}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        draggable={draggable}
      />
    </picture>
  );
}
