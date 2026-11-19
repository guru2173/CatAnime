// Tiny dependency-free DSP toolkit for procedural SFX / music synthesis.
import fs from 'node:fs';
import path from 'node:path';

export const SR = 44100;

export const buf = (seconds, sr = SR) => new Float32Array(Math.ceil(seconds * sr));

// Deterministic PRNG so every run produces identical files (stable git diffs).
export const rng = (seed = 1) => {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296) * 2 - 1;
  };
};

export const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const NOTE = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
/** "C#4" -> midi number */
export const note = (name) => {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  return 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
};

/** Add `src` into `dst` at time t (seconds) with gain. */
export const mixIn = (dst, src, t, gain = 1, sr = SR) => {
  const o = Math.round(t * sr);
  for (let i = 0; i < src.length; i++) {
    const j = o + i;
    if (j >= 0 && j < dst.length) dst[j] += src[i] * gain;
  }
  return dst;
};

/** ADSR-ish exponential envelope generator. */
export const env = (i, sr, {a = 0.005, d = 0.2, s = 0, r = 0.2, len}) => {
  const t = i / sr;
  if (t < a) return t / a;
  const td = t - a;
  const sustainLevel = s;
  const decayed = sustainLevel + (1 - sustainLevel) * Math.exp(-td / Math.max(1e-4, d / 5));
  if (len !== undefined && t > len) return decayed * Math.exp(-(t - len) / Math.max(1e-4, r / 5));
  return decayed;
};

/** One-pole low-pass in place. */
export const lowpass = (x, cutoff, sr = SR) => {
  const a = Math.exp((-2 * Math.PI * cutoff) / sr);
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    y = (1 - a) * x[i] + a * y;
    x[i] = y;
  }
  return x;
};

export const highpass = (x, cutoff, sr = SR) => {
  const a = Math.exp((-2 * Math.PI * cutoff) / sr);
  let lp = 0;
  for (let i = 0; i < x.length; i++) {
    lp = (1 - a) * x[i] + a * lp;
    x[i] = x[i] - lp;
  }
  return x;
};

/** RBJ biquad band-pass with per-sample center frequency function. */
export const bandpassSweep = (x, freqFn, q = 2, sr = SR) => {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const f = Math.min(sr * 0.45, Math.max(20, freqFn(i / sr)));
    const w = (2 * Math.PI * f) / sr;
    const alpha = Math.sin(w) / (2 * q);
    const b0 = alpha, b2 = -alpha, a0 = 1 + alpha, a1 = -2 * Math.cos(w), a2 = 1 - alpha;
    const y = (b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = y;
    x[i] = y;
  }
  return x;
};

/** Resonant low-pass biquad (static). */
export const lowpassQ = (x, f, q = 0.707, sr = SR) => {
  const w = (2 * Math.PI * f) / sr;
  const alpha = Math.sin(w) / (2 * q);
  const c = Math.cos(w);
  const b0 = (1 - c) / 2, b1 = 1 - c, b2 = (1 - c) / 2, a0 = 1 + alpha, a1 = -2 * c, a2 = 1 - alpha;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const y = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = y;
    x[i] = y;
  }
  return x;
};

/** Soft saturation. */
export const drive = (x, amount = 2) => {
  const n = Math.tanh(amount);
  for (let i = 0; i < x.length; i++) x[i] = Math.tanh(x[i] * amount) / n;
  return x;
};

/** Cheap Schroeder reverb (mono). */
export const reverb = (x, {mix = 0.25, room = 0.82, damp = 0.3} = {}, sr = SR) => {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((d) => Math.round((d * sr) / 44100));
  const aps = [225, 556, 441].map((d) => Math.round((d * sr) / 44100));
  const out = new Float32Array(x.length);
  for (const d of combs) {
    const line = new Float32Array(d);
    let idx = 0, filt = 0;
    for (let i = 0; i < x.length; i++) {
      const y = line[idx];
      filt = y * (1 - damp) + filt * damp;
      line[idx] = x[i] + filt * room;
      idx = (idx + 1) % d;
      out[i] += y / combs.length;
    }
  }
  for (const d of aps) {
    const line = new Float32Array(d);
    let idx = 0;
    for (let i = 0; i < out.length; i++) {
      const b = line[idx];
      const y = -out[i] + b;
      line[idx] = out[i] + b * 0.5;
      idx = (idx + 1) % d;
      out[i] = y;
    }
  }
  for (let i = 0; i < x.length; i++) x[i] = x[i] * (1 - mix) + out[i] * mix * 2.2;
  return x;
};

export const normalize = (x, peak = 0.89) => {
  let m = 0;
  for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
  if (m > 0) for (let i = 0; i < x.length; i++) x[i] *= peak / m;
  return x;
};

export const fade = (x, inS = 0.003, outS = 0.02, sr = SR) => {
  const fi = Math.round(inS * sr), fo = Math.round(outS * sr);
  for (let i = 0; i < fi && i < x.length; i++) x[i] *= i / fi;
  for (let i = 0; i < fo && i < x.length; i++) x[x.length - 1 - i] *= i / fo;
  return x;
};

/** Make a buffer loop seamlessly by crossfading its tail over its head. */
export const makeLoop = (x, xfadeS = 0.4, sr = SR) => {
  const n = Math.round(xfadeS * sr);
  const out = x.slice(0, x.length - n);
  for (let i = 0; i < n; i++) {
    const k = i / n;
    out[i] = x[i] * k + x[x.length - n + i] * (1 - k);
  }
  return out;
};

/** Write 16-bit PCM mono WAV. */
export const writeWav = (file, x, sr = SR) => {
  const data = Buffer.alloc(x.length * 2);
  for (let i = 0; i < x.length; i++) {
    const v = Math.max(-1, Math.min(1, x[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, Buffer.concat([h, data]));
  return file;
};

/* ---------------- voices ---------------- */

export const sine = (f, seconds, sr = SR, phase = 0) => {
  const x = buf(seconds, sr);
  let p = phase;
  for (let i = 0; i < x.length; i++) {
    const fi = typeof f === 'function' ? f(i / sr) : f;
    p += (2 * Math.PI * fi) / sr;
    x[i] = Math.sin(p);
  }
  return x;
};

/** Band-limited-ish saw via additive partials (cheap enough for short notes). */
export const saw = (f, seconds, sr = SR, partials = 12, vib = 0, vibRate = 5.5) => {
  const x = buf(seconds, sr);
  const n = Math.min(partials, Math.floor(sr / 2 / f));
  let p = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / sr;
    const fi = f * (1 + vib * Math.sin(2 * Math.PI * vibRate * t) * Math.min(1, t / 0.25));
    p += (2 * Math.PI * fi) / sr;
    let s = 0;
    for (let k = 1; k <= n; k++) s += Math.sin(p * k) / k;
    x[i] = s * 0.55;
  }
  return x;
};

export const noiseBuf = (seconds, seed = 7, sr = SR) => {
  const r = rng(seed);
  const x = buf(seconds, sr);
  for (let i = 0; i < x.length; i++) x[i] = r();
  return x;
};

/** Inharmonic bell / chime. */
export const bell = (f, seconds, sr = SR, ratios = [1, 2.0, 2.76, 4.07, 5.4], decay = 1.2) => {
  const x = buf(seconds, sr);
  ratios.forEach((r, k) => {
    const amp = 1 / (k + 1);
    const d = decay / (1 + k * 0.6);
    for (let i = 0; i < x.length; i++) {
      const t = i / sr;
      x[i] += Math.sin(2 * Math.PI * f * r * t) * amp * Math.exp(-t / d);
    }
  });
  for (let i = 0; i < Math.min(x.length, 40); i++) x[i] *= i / 40;
  return x;
};

/** Apply an envelope function in place. */
export const shape = (x, fn, sr = SR) => {
  for (let i = 0; i < x.length; i++) x[i] *= fn(i / sr, i);
  return x;
};
