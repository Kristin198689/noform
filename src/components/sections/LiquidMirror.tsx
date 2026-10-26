"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { WORDMARK_PATH } from "@/lib/wordmark";

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Silver lens surface: height field → normals → a studio-light environment; the wordmark emerges
// from the reflection as the surface calms. No textures except the wordmark mask.
const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
uniform float uAmp;
uniform float uReveal;
uniform vec2 uMouse;
uniform sampler2D uLogo;
uniform float uLogoAspect;

// soft value noise for a free, uneven silver pool (no hard outline)
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float height(vec2 p) {
  float d = length(p - uMouse);
  // a local wave around the cursor / scroll point, fading with distance
  float local = sin(d * 20.0 - uTime * 3.0) * exp(-d * 4.5);
  float slow = noise(p * 2.2 + uTime * 0.08) * 0.6 + noise(p * 4.5 - uTime * 0.05) * 0.25;
  return uAmp * local * 0.8 + slow * 0.08;
}
void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  vec2 extent = vec2(min(0.5 * aspect, 2.0), 0.46);

  // free-form edge: an ellipse whose border breathes with noise and dissolves softly
  float r = length(p / extent);
  float edge = 0.98 + (noise(p * 3.0 + 4.0) - 0.5) * 0.16;
  float alpha = smoothstep(edge, edge - 0.38, r);

  float e = 0.004;
  float h = height(p);
  vec2 n = vec2(height(p + vec2(e, 0.0)) - h, height(p + vec2(0.0, e)) - h) / e * 0.05;

  // muted studio reflections: wide soft bands, no hard glints
  vec2 rr = p * vec2(0.5, 1.0) + n;
  float bands = 0.5 + 0.5 * sin(rr.y * 4.2 + 1.2 + rr.x * 0.6);
  float light = smoothstep(0.16, 0.0, abs(rr.y - 0.16 + 0.05 * sin(rr.x * 2.0)));
  vec3 chrome = vec3(0.1) + vec3(0.36) * pow(bands, 2.2) + vec3(0.32) * light;
  // soft iridescence: a cool/warm drift that follows the surface normal
  vec3 tint = vec3(0.96 + 0.05 * n.x, 0.98, 1.03 - 0.05 * n.x) + 0.03 * vec3(sin(rr.x * 3.0 + uTime * 0.2), 0.0, cos(rr.y * 3.0));
  chrome *= tint;

  // the wordmark rises from the reflection; once calm it is flat, crisp and high-contrast
  float logoW = extent.x * 1.28;
  vec2 luv = vec2(p.x / logoW + 0.5, 0.5 - p.y * uLogoAspect / logoW);
  float wobble = (1.0 - smoothstep(0.7, 1.0, uReveal)) * min(1.0, uAmp * 1.5);
  luv += n * 0.05 * wobble;
  float logo = texture2D(uLogo, luv).a;
  float show = smoothstep(0.05, 0.7, uReveal);
  vec3 behind = chrome * mix(1.0, 0.55, show); // calm the silver behind the letters
  vec3 letters = mix(chrome * 0.35, vec3(0.965, 0.96, 0.95), smoothstep(0.45, 1.0, uReveal));
  vec3 col = mix(behind, letters, logo * show);
  // the letters stay fully opaque, even where the silver dissolves into black
  float a = max(alpha, logo * show);
  if (a <= 0.001) { gl_FragColor = vec4(0.0); return; }
  gl_FragColor = vec4(col, a);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

/** The wordmark, white on transparent, as a texture mask (same approved path as the SVG). */
function logoCanvas(): HTMLCanvasElement {
  const vb = { x: 40, y: 222, w: 4697, h: 756 };
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = Math.round((2048 * vb.h) / vb.w);
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.scale(c.width / vb.w, c.height / vb.h);
    ctx.translate(-vb.x, -vb.y);
    ctx.fillStyle = "#fff";
    ctx.fill(new Path2D(WORDMARK_PATH));
  }
  return c;
}

/**
 * Liquid mirror: a silver lens-shaped surface; a soft wave crosses it and NØFORM surfaces from the
 * reflection; the cursor bends it on desktop, scroll sends the wave on touch screens; then it calms.
 * Renders only while on screen. Without WebGL or with reduced motion the outline wordmark stays.
 */
export function LiquidMirror({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = el.getContext("webgl", { premultipliedAlpha: false, antialias: true });
    if (!gl || gl.isContextLost()) return;
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const logo = logoCanvas();
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, logo);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes"), uTime = u("uTime"), uAmp = u("uAmp"), uReveal = u("uReveal"), uMouse = u("uMouse");
    gl.uniform1f(u("uLogoAspect"), logo.width / logo.height);
    gl.uniform1i(u("uLogo"), 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const state = { amp: 0.9, reveal: 0, mx: -0.6, my: 0.1, tx: -0.6, ty: 0.1 };
    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      el.width = Math.round(el.clientWidth * dpr);
      el.height = Math.round(el.clientHeight * dpr);
      gl.viewport(0, 0, el.width, el.height);
      gl.uniform2f(uRes, el.width, el.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let raf = 0;
    let visible = false;
    const t0 = performance.now();
    const frame = () => {
      raf = 0;
      state.mx += (state.tx - state.mx) * 0.08;
      state.my += (state.ty - state.my) * 0.08;
      state.amp *= 0.978; // the mirror calms down by itself
      gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl.uniform1f(uAmp, state.amp);
      gl.uniform1f(uReveal, state.reveal);
      gl.uniform2f(uMouse, state.mx, state.my);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (visible && (state.amp > 0.004 || Math.abs(state.tx - state.mx) > 0.001)) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    // Reveal follows the scroll into the finale; the entering wave starts on its own.
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      end: "center 55%",
      scrub: true,
      onUpdate: (self) => {
        state.reveal = self.progress;
        // touch screens: scroll speed sends the wave across
        const v = Math.abs(self.getVelocity());
        if (v > 50) {
          state.amp = Math.min(1, Math.max(state.amp, v / 2600));
          state.tx = -0.9 + self.progress * 1.8;
          state.ty = 0;
        }
        kick();
      },
      onToggle: (self) => {
        visible = self.isActive || self.progress >= 1;
        if (visible) kick();
      },
    });
    const vis = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => {
        visible = self.isActive;
        if (visible) {
          state.amp = Math.max(state.amp, 0.6);
          kick();
        }
      },
    });

    // Desktop: the surface bends after the cursor.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const a = r.width / r.height;
      state.tx = ((e.clientX - r.left) / r.width - 0.5) * a;
      state.ty = -((e.clientY - r.top) / r.height - 0.5);
      state.amp = Math.min(0.75, state.amp + 0.06);
      kick();
    };
    if (fine) el.addEventListener("pointermove", onMove);

    const onLost = () => {
      el.dataset.gl = "off"; // the outline wordmark shows again
    };
    el.addEventListener("webglcontextlost", onLost);
    el.dataset.gl = "on";
    kick();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      st.kill();
      vis.kill();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("webglcontextlost", onLost);
      // keep the context: React may re-run this effect on the same canvas (StrictMode)
      el.dataset.gl = "off";
    };
  }, []);

  return <canvas ref={canvas} className={className} data-gl="off" aria-hidden="true" />;
}
