// How a curtain ripples when tapped: a push that travels down the fabric and dies away (a
// hanging-string model, pinned at the rod, loosely held at the tie-back, free at the hem).
// The everyday breeze is a CSS sway on the GPU instead (see .curtain in globals.css).
import { CURTAIN } from './geom';

const N = 40;
const C2 = 58 * 58;
const REST = 9;
const DAMP = 3.4;
const TIE = 260;
const MAX = 60;
const DT = 1 / 240;

export class Tap {
  private u = new Float32Array(N + 1);
  private v = new Float32Array(N + 1);
  private acc = 0;
  private tieNode = Math.round(((CURTAIN.tie - CURTAIN.top) / (CURTAIN.floor - CURTAIN.top)) * N);
  active = false;

  at(y: number) {
    if (!this.active) return 0;
    const t = Math.max(0, Math.min(1, (y - CURTAIN.top) / (CURTAIN.floor - CURTAIN.top))) * N;
    const i = Math.floor(t);
    const f = t - i;
    return this.u[i] * (1 - f) + this.u[Math.min(N, i + 1)] * f;
  }

  kick(y: number, speed: number) {
    const c = ((y - CURTAIN.top) / (CURTAIN.floor - CURTAIN.top)) * N;
    for (let i = 1; i <= N; i++) this.v[i] += speed * Math.exp(-((i - c) ** 2) / 18);
    this.active = true;
  }

  advance(dt: number) {
    if (!this.active) return;
    this.acc += dt;
    const { u, v } = this;
    while (this.acc >= DT) {
      for (let i = 1; i <= N; i++) {
        const below = i === N ? u[i - 1] : u[i + 1];
        let a = C2 * (u[i - 1] - 2 * u[i] + below) - REST * u[i] - DAMP * v[i];
        const t = Math.abs(i - this.tieNode);
        if (t <= 1) a -= TIE * (t === 0 ? 1 : 0.5) * u[i];
        v[i] += a * DT;
      }
      for (let i = 1; i <= N; i++) u[i] = Math.max(-MAX, Math.min(MAX, u[i] + v[i] * DT));
      this.acc -= DT;
    }
    let e = 0;
    for (let i = 0; i <= N; i++) e += Math.abs(u[i]) + Math.abs(v[i]) * 0.02;
    if (e < 0.4) {
      u.fill(0);
      v.fill(0);
      this.active = false;
    }
  }
}
