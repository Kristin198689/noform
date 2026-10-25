/**
 * Parametric front view of the NØFORM hoodie (viewBox 0 0 1000 1000).
 * Every output path keeps the same command structure for any volume,
 * so the Form Lab can morph it continuously. VOLUME is a conditional 0–100 study value,
 * not a garment measurement.
 */
export type HoodieGeometry = {
  outline: string;
  hood: string;
  hoodOpening: string;
  seams: string;
  pocket: string;
  ribs: string;
  strings: string;
  anchors: {
    shoulder: [number, number];
    sleeve: [number, number];
    hemLeft: [number, number];
    hemRight: [number, number];
    hemBottom: number;
  };
};

type P = [number, number];
const CX = 500;
const f = (n: number) => n.toFixed(1);
const pt = ([x, y]: P) => `${f(x)} ${f(y)}`;
const mx = ([x, y]: P): P => [2 * CX - x, y];
function bezier(a: P, b: P, c: P, d: P, t: number): P {
  const u = 1 - t;
  const k = (i: 0 | 1) => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i];
  return [k(0), k(1)];
}

export function hoodie(volume: number): HoodieGeometry {
  const v = Math.min(1, Math.max(0, volume));
  const lerp = (a: number, b: number) => a + (b - a) * v;

  const bw = lerp(168, 236); // half chest
  const hw = lerp(160, 226); // half hem
  const drop = lerp(16, 96); // dropped shoulder
  const sv = lerp(26, 124); // sleeve volume
  const shY = 262;
  const hemY = 818;
  const rib = 46;

  const N: P = [CX + 84, 238];
  const q1: P = [CX + bw * 0.55, shY - 18];
  const ST: P = [CX + bw - 24, shY + drop * 0.1];
  const CO: P = [CX + bw + 96 + sv * 0.55, 766];
  const COb: P = [CO[0] - 6, 816];
  const CIb: P = [CO[0] - 90, 822];
  const CI: P = [CO[0] - 86, 770];
  const A: P = [CX + bw - 4, 428 + drop * 0.6];
  const H: P = [CX + hw, hemY];
  const Hb: P = [CX + hw - 10, hemY + rib];

  const o1: P = [ST[0] + 62 + sv * 0.55, shY + 18 + drop * 0.35];
  const o2: P = [CX + bw + 92 + sv, 470 + drop * 0.2];
  const o3: P = [CO[0] + 8, CO[1] - 120];
  const i1: P = [CI[0] - 12, 640];
  const i2: P = [A[0] + 30 + sv * 0.32, 560];
  const b1: P = [A[0] + 8 + v * 10, 560];
  const b2: P = [H[0] + 10, 700];

  const outline = [
    `M${pt(N)}`,
    `Q${pt(q1)} ${pt(ST)}`,
    `C${pt(o1)} ${pt(o2)} ${pt(o3)}`, // sleeve outer edge, straight run into the cuff
    `L${pt(CO)}`,
    `L${pt(COb)}`,
    `L${pt(CIb)}`,
    `L${pt(CI)}`,
    `C${pt(i1)} ${pt(i2)} ${pt(A)}`,
    `C${pt(b1)} ${pt(b2)} ${pt(H)}`,
    `L${pt(Hb)}`,
    `L${pt(mx(Hb))}`,
    `L${pt(mx(H))}`,
    `C${pt(mx(b2))} ${pt(mx(b1))} ${pt(mx(A))}`,
    `C${pt(mx(i2))} ${pt(mx(i1))} ${pt(mx(CI))}`,
    `L${pt(mx(CIb))}`,
    `L${pt(mx(COb))}`,
    `L${pt(mx(CO))}`,
    `L${pt(mx(o3))}`,
    `C${pt(mx(o2))} ${pt(mx(o1))} ${pt(mx(ST))}`,
    `Q${pt(mx(q1))} ${pt(mx(N))}`,
    "Z",
  ].join(" ");

  const hw2 = lerp(178, 198);
  const hood = [
    `M${pt(mx(N))}`,
    `C${f(CX - 84 - 58)} 170 ${f(CX - hw2)} 58 ${f(CX)} 44`,
    `C${f(CX + hw2)} 58 ${f(CX + 84 + 58)} 170 ${pt(N)}`,
  ].join(" ");
  const hoodOpening = [
    `M${f(CX - 66)} 254`,
    `C${f(CX - 100)} 170 ${f(CX - 66)} 102 ${f(CX)} 98`,
    `C${f(CX + 66)} 102 ${f(CX + 100)} 170 ${f(CX + 66)} 254`,
  ].join(" ");

  const seamTop: P = [ST[0] + 10 + drop * 0.32, ST[1] + 8 + drop * 0.55];
  const seamCtl: P = [seamTop[0] + 12, (seamTop[1] + A[1]) / 2];
  const seams = [
    `M${pt(seamTop)} Q${pt(seamCtl)} ${pt(A)}`,
    `M${pt(mx(seamTop))} Q${pt(mx(seamCtl))} ${pt(mx(A))}`,
  ].join(" ");

  const pw = lerp(128, 168);
  const pocket = [
    `M${f(CX - pw + 44)} 566 L${f(CX + pw - 44)} 566`,
    `Q${f(CX + pw - 6)} 610 ${f(CX + pw)} 724`,
    `L${f(CX - pw)} 724`,
    `Q${f(CX - pw + 6)} 610 ${f(CX - pw + 44)} 566 Z`,
  ].join(" ");

  const ribs = [
    `M${pt([CX - hw, hemY])} L${pt([CX + hw, hemY])}`,
    `M${pt(CO)} L${pt(CI)}`,
    `M${pt(mx(CO))} L${pt(mx(CI))}`,
  ].join(" ");

  const strings = `M${f(CX - 26)} 252 L${f(CX - 30)} 420 M${f(CX + 26)} 252 L${f(CX + 30)} 420`;

  return {
    outline,
    hood,
    hoodOpening,
    seams,
    pocket,
    ribs,
    strings,
    anchors: {
      shoulder: seamTop,
      sleeve: bezier(ST, o1, o2, o3, 0.55),
      hemLeft: [CX - hw, hemY],
      hemRight: [CX + hw, hemY],
      hemBottom: Hb[1],
    },
  };
}
