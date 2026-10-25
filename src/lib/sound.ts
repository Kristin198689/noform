"use client";

/**
 * Synthesised mechanical tick (Web Audio, no files, no external music).
 * The AudioContext is only created after the user switches SOUND ON.
 */
export class TickSound {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private last = 0;

  enable(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      const length = Math.floor(this.ctx.sampleRate * 0.03);
      this.noise = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    }
    void this.ctx.resume();
  }

  disable(): void {
    void this.ctx?.suspend();
  }

  /** Throttled: at most one tick every 70 ms. */
  tick(): void {
    const ctx = this.ctx;
    if (!ctx || !this.noise || ctx.state !== "running") return;
    const now = performance.now();
    if (now - this.last < 70) return;
    this.last = now;

    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 2400 + Math.random() * 500;
    band.Q.value = 3.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    src.connect(band).connect(gain).connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.035);
  }
}
