"use client";

/**
 * NØFORM sound system — everything is synthesised locally with Web Audio (no files, no music, no network).
 * One master gain, so a single toggle silences everything. One-shots are throttled per cue;
 * only one ambient bed (the tunnel) can run at a time and it always ramps out when its scene ends.
 * The AudioContext is created only after the user turns SOUND ON.
 */
export type Cue =
  | "tick" // lookbook ring step (the approved carousel click)
  | "chime" // hero appears
  | "click" // text transitions
  | "shimmer" // floating visor
  | "pulse" // technical drawings
  | "sweep" // scanner line passing a word
  | "lab" // form lab change
  | "snap" // outfit assembled: one quiet muffled click
  | "final"; // finale

/**
 * Audible cues. The visor shimmer is retired (it read as notifications); every recipe below is
 * low-passed and short — no hiss, no high pings. Silence is better than an irritating effect.
 */
const APPROVED = new Set<Cue>(["tick", "snap", "chime", "click", "pulse", "sweep", "lab", "final"]);
const AMBIENT_APPROVED = true;

const THROTTLE: Record<Cue, number> = {
  tick: 70,
  chime: 2500,
  click: 140,
  shimmer: 600,
  pulse: 160,
  sweep: 350,
  lab: 55,
  snap: 800,
  final: 4000,
};

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private last = new Map<Cue, number>();
  private ambient: { oscs: OscillatorNode[]; gain: GainNode; filter: BiquadFilterNode } | null = null;

  get running(): boolean {
    return this.ctx?.state === "running";
  }

  enable(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      const length = Math.floor(this.ctx.sampleRate * 2);
      this.noise = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    void this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master?.gain.cancelScheduledValues(t);
    this.master?.gain.setTargetAtTime(1, t, 0.05);
  }

  disable(): void {
    if (!this.ctx || !this.master) return;
    this.stopAmbient();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0, t, 0.04);
    window.setTimeout(() => void this.ctx?.suspend(), 260);
  }

  play(cue: Cue, intensity = 1): void {
    const ctx = this.ctx;
    if (!APPROVED.has(cue) || !ctx || !this.master || ctx.state !== "running") return;
    const now = performance.now();
    if (now - (this.last.get(cue) ?? 0) < THROTTLE[cue]) return;
    this.last.set(cue, now);
    const t = ctx.currentTime;
    const v = Math.max(0.2, Math.min(1, intensity));
    switch (cue) {
      case "tick": // the approved carousel click — unchanged
        return this.noiseBurst(t, 2400 + Math.random() * 500, 3.5, 0.05, 0.03);
      case "click": // text transitions: very quiet muffled click
        return this.tone(t, 220, "sine", 0.02 * v, 0.002, 0.03, 900);
      case "pulse": // technical drawings: short precise pulse, low-passed
        return this.tone(t, 880, "triangle", 0.012 * v, 0.001, 0.014, 1400);
      case "lab": // form lab: delicate tick that follows the volume
        return this.tone(t, 1100 + v * 300, "sine", 0.01, 0.001, 0.01, 2200);
      case "snap": // outfit assembled: one quiet muffled click
        return this.tone(t, 180, "sine", 0.05, 0.003, 0.06, 600);
      case "chime": // hero: soft appearance signal
        this.tone(t, 392, "sine", 0.03, 0.06, 0.7, 1800);
        this.tone(t + 0.09, 587.33, "sine", 0.016, 0.08, 0.8, 1800);
        return;
      case "sweep": // scanner: soft pass of the line, kept under 1.6 kHz
        return this.filteredSweep(t, 0.5);
      case "final": // finale: short closing tone
        this.tone(t, 392, "sine", 0.03, 0.04, 1.0, 1500);
        this.tone(t + 0.14, 587.33, "sine", 0.017, 0.05, 1.1, 1500);
        this.tone(t + 0.28, 783.99, "sine", 0.01, 0.06, 1.2, 1500);
        return;
      case "shimmer":
        return; // retired
    }
  }

  /** Tunnel: a quiet low tone that swells and fades with the flight (`level` 0–1). No noise. */
  setAmbient(level: number): void {
    const ctx = this.ctx;
    if (!AMBIENT_APPROVED || !ctx || !this.master || ctx.state !== "running") return;
    if (!this.ambient) {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 320;
      filter.Q.value = 0.4;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      filter.connect(gain).connect(this.master);
      const oscs = [
        { f: 55, g: 1 },
        { f: 82.41, g: 0.5 },
        { f: 110, g: 0.22 },
      ].map(({ f, g }) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        const og = ctx.createGain();
        og.gain.value = g;
        o.connect(og).connect(filter);
        o.start();
        return o;
      });
      this.ambient = { oscs, gain, filter };
    }
    const t = ctx.currentTime;
    const l = Math.max(0, Math.min(1, level));
    // slow time constants: the tone can only swell and fade, never jump
    this.ambient.gain.gain.setTargetAtTime(l * 0.09, t, 0.6);
    this.ambient.filter.frequency.setTargetAtTime(240 + l * 260, t, 0.8);
  }

  stopAmbient(): void {
    const ctx = this.ctx;
    const a = this.ambient;
    if (!ctx || !a) return;
    this.ambient = null;
    const t = ctx.currentTime;
    a.gain.gain.cancelScheduledValues(t);
    a.gain.gain.setTargetAtTime(0, t, 0.5);
    a.oscs.forEach((o) => o.stop(t + 3));
  }

  private noiseBurst(t: number, freq: number, q: number, peak: number, dur: number): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = freq;
    band.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(band).connect(gain).connect(this.master!);
    src.start(t, Math.random());
    src.stop(t + dur + 0.02);
  }

  private tone(t: number, freq: number, type: OscillatorType, peak: number, attack: number, dur: number, lowpass?: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = osc;
    if (lowpass) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = lowpass;
      osc.connect(lp);
      node = lp;
    }
    node.connect(gain).connect(this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private filteredSweep(t: number, dur: number): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 2.2;
    band.frequency.setValueAtTime(500, t);
    band.frequency.exponentialRampToValueAtTime(1400, t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.018, t + dur * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(band).connect(gain).connect(this.master!);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }
}

/** Fire-and-forget cue from any scene; the provider decides whether sound is on. */
export function cue(name: Cue, intensity?: number): void {
  window.dispatchEvent(new CustomEvent("noform:cue", { detail: { name, intensity } }));
}
export function ambient(level: number | null): void {
  window.dispatchEvent(new CustomEvent("noform:ambient", { detail: { level } }));
}
