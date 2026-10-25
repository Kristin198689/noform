/** Vector study of the signature visor (front view). Shared by pause B and Design Code. */
export const VISOR_TOP = "M24 132 L128 118 Q500 50 872 118 L976 132";
export const VISOR_BOTTOM =
  "M128 118 L120 214 C232 236 322 246 372 240 C414 208 452 162 500 160 C548 162 586 208 628 240 C678 246 768 236 880 214 L872 118";
export const VISOR_LENS = "M150 136 Q500 82 850 136 L856 200 C760 220 680 226 640 224 C596 190 556 150 500 148 C444 150 404 190 360 224 C320 226 240 220 144 200 Z";

export function VisorOutline({ className, lens = true }: { className?: string; lens?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 1000 300" fill="none" aria-hidden="true" focusable="false">
      <path data-draw d={VISOR_TOP} stroke="currentColor" strokeWidth="1.4" vectorEffect="non-scaling-stroke" pathLength={1} />
      <path data-draw d={VISOR_BOTTOM} stroke="currentColor" strokeWidth="1.4" vectorEffect="non-scaling-stroke" pathLength={1} />
      {lens && (
        <path
          data-draw
          d={VISOR_LENS}
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
        />
      )}
    </svg>
  );
}
