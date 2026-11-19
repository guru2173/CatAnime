import {Easing, interpolate, random} from 'remotion';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Anime / flipnote "on twos-and-a-half": 30fps timeline held to 12 drawings per second. */
export const ANIME_STEP = 2.5;

/** Quantise a frame to 12fps stepped holds. */
export const stepped = (frame: number, step = ANIME_STEP) => Math.floor(frame / step) * step;

/** Index of the current drawing (changes 12x per second). Useful as a random seed for line boil. */
export const drawingIndex = (frame: number, step = ANIME_STEP) => Math.floor(frame / step);

export const sec = (s: number) => Math.round(s * FPS);

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Clamped interpolate with optional easing. */
export const ramp = (
  frame: number,
  range: [number, number],
  out: [number, number] = [0, 1],
  easing: (t: number) => number = Easing.inOut(Easing.cubic),
) =>
  interpolate(frame, range, out, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

/** Multi-keyframe clamped interpolate. */
export const keys = (frame: number, input: number[], output: number[], easing?: (t: number) => number) =>
  interpolate(frame, input, output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easing ?? Easing.inOut(Easing.quad),
  });

/** Deterministic noise in [-1, 1]. */
export const noise = (seed: string | number) => random(seed) * 2 - 1;

/** Line-boil jitter: tiny random offset that changes once per drawing (12fps). */
export const boil = (frame: number, seed: string, amp = 1.2) => {
  const i = drawingIndex(frame);
  return {x: noise(`${seed}-x-${i}`) * amp, y: noise(`${seed}-y-${i}`) * amp};
};

/** Smooth value-noise (for handheld cameras etc.). */
export const smoothNoise = (t: number, seed: string) => {
  const i = Math.floor(t);
  const f = t - i;
  const a = noise(`${seed}-${i}`);
  const b = noise(`${seed}-${i + 1}`);
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};

/** 0..1 progress inside a window; <0 before, >1 after (unclamped). */
export const progress = (frame: number, start: number, end: number) => (frame - start) / (end - start);

/** Is frame inside [start, end). */
export const within = (frame: number, start: number, end: number) => frame >= start && frame < end;

/** Damped bounce for impacts: returns offset that decays. */
export const impact = (frame: number, at: number, amp = 1, decay = 0.12, freq = 0.9) => {
  const t = frame - at;
  if (t < 0) return 0;
  return amp * Math.exp(-decay * t) * Math.cos(freq * t);
};

/** Follow-through: how much a value lags behind its driver (for tails / hoodie strings). */
export const followThrough = (fn: (f: number) => number, frame: number, lag = 4) => fn(frame - lag) - fn(frame);

/** Beat helpers for music sync. */
export const beatFrame = (bpm: number, beat: number, offsetFrame = 0) =>
  Math.round(offsetFrame + (beat * 60 * FPS) / bpm);

export const beatPulse = (frame: number, bpm: number, offsetFrame = 0, sharpness = 6) => {
  const beatLen = (60 * FPS) / bpm;
  const ph = ((frame - offsetFrame) % beatLen) / beatLen;
  return Math.exp(-sharpness * ph);
};
