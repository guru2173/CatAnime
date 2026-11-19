#!/usr/bin/env node
// Procedural placeholder score for CatAnime episodes.
// The real soundtrack is meant to be dropped in from the YouTube Audio Library
// (see README → "Music drop-in"). Until then these synthesized renditions keep
// the film fully scored and beat-synced:
//   mvt1 — Mozart, Eine Kleine Nachtmusik (public-domain melody, chamber strings), 128 BPM
//   mvt2 — "Rush Hour Gallop" (original chase cue in D minor), 152 BPM
//   mvt3 — Beethoven, Symphony 9 "Ode to Joy" (public-domain melody, full orchestra), 150 BPM
//   node scripts/generate-music.mjs
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buf, saw, sine, noiseBuf, mixIn, lowpass, highpass, shape, reverb, normalize, fade, writeWav, midi, note} from './lib/dsp.mjs';

const SR = 32000;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ---------- instruments ---------- */
const strings = (n, dur, vel = 1, bright = 2200) => {
  const x = saw(midi(note(n)), dur + 0.25, SR, 10, 0.006, 5.2);
  lowpass(x, bright, SR);
  shape(x, (t) => vel * Math.min(1, t / 0.06) * (t > dur ? Math.exp(-(t - dur) * 14) : 1), SR);
  return x;
};
const pizz = (n, vel = 1) => {
  const x = saw(midi(note(n)), 0.35, SR, 8);
  lowpass(x, 1600, SR);
  shape(x, (t) => vel * Math.min(1, t / 0.003) * Math.exp(-t * 14), SR);
  return x;
};
const brass = (n, dur, vel = 1) => {
  const x = saw(midi(note(n)), dur + 0.15, SR, 14, 0.003, 5);
  lowpass(x, 2800, SR);
  shape(x, (t) => vel * Math.min(1, t / 0.03) * (1 + 0.3 * Math.exp(-t * 10)) * (t > dur ? Math.exp(-(t - dur) * 20) : 1), SR);
  return x;
};
const timp = (n, vel = 1) => {
  const f = midi(note(n));
  const x = sine((t) => f * (1 + 0.15 * Math.exp(-t * 20)), 1.2, SR);
  shape(x, (t) => vel * Math.exp(-t * 3.2), SR);
  const h = noiseBuf(0.08, 3, SR);
  lowpass(h, 600, SR);
  shape(h, (t) => Math.exp(-t * 60), SR);
  mixIn(x, h, 0, 0.6 * vel, SR);
  return x;
};
const snare = (vel = 1, seed = 1) => {
  const x = noiseBuf(0.14, seed, SR);
  highpass(x, 1800, SR);
  shape(x, (t) => vel * Math.exp(-t * 35), SR);
  return x;
};
const cymbal = (vel = 1) => {
  const x = noiseBuf(2.2, 77, SR);
  highpass(highpass(x, 5000, SR), 5000, SR);
  shape(x, (t) => vel * Math.min(1, t / 0.005) * Math.exp(-t * 1.6), SR);
  return x;
};

/* ---------- tiny sequencer ---------- */
const track = (bpm, bars, beatsPerBar = 4) => {
  const beat = 60 / bpm;
  const len = bars * beatsPerBar * beat + 3;
  const x = buf(len, SR);
  const at = (b) => b * beat;
  return {x, beat, at, add: (src, b, g = 1) => mixIn(x, src, at(b), g, SR)};
};
/** Parse "G4:1 r:.5 D4:.5" into [{n, d}] (durations in beats). */
const seq = (s) => s.trim().split(/\s+/).map((tok) => {
  const [n, d] = tok.split(':');
  return {n, d: Number(d)};
});
const play = (T, line, startBeat, inst, gain = 1) => {
  let b = startBeat;
  for (const {n, d} of seq(line)) {
    if (n !== 'r') T.add(inst(n, d * T.beat * 0.92), b, gain);
    b += d;
  }
  return b;
};
const transpose = (line, semis) => line.replace(/([A-G][#b]?)(-?\d)/g, (m) => {
  const v = note(m) + semis;
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return names[((v % 12) + 12) % 12] + (Math.floor(v / 12) - 1);
});

const finish = (T, file, rev = 0.22) => {
  reverb(T.x, {mix: rev, room: 0.84, damp: 0.35}, SR);
  normalize(T.x, 0.85);
  fade(T.x, 0.01, 1.5, SR);
  writeWav(path.join(root, 'public', 'music', file), T.x, SR);
  console.log(`  • ${file.padEnd(28)} ${(T.x.length / SR).toFixed(1)}s`);
};

console.log('🎼 Synthesizing placeholder score → public/music/');

/* ===== Movement 1 — Eine Kleine Nachtmusik (light, 128 BPM) ===== */
{
  const T = track(128, 30);
  const A = 'G4:1 r:.5 D4:.5 G4:1 r:.5 D4:.5 G4:.5 D4:.5 G4:.5 B4:.5 D5:2 C5:1 r:.5 A4:.5 C5:1 r:.5 A4:.5 C5:.5 A4:.5 F#4:.5 A4:.5 D4:2';
  const A2 = 'D5:1 r:.5 B4:.5 G4:1 r:.5 B4:.5 A4:.5 F#4:.5 D4:.5 F#4:.5 G4:2 B4:.5 C5:.5 D5:.5 E5:.5 D5:1 B4:1 A4:.5 B4:.5 C5:.5 A4:.5 G4:2';
  const bassBars = ['G2', 'G2', 'D2', 'D2', 'G2', 'D2', 'G2', 'G2'];
  const chordBars = [['B3', 'D4'], ['B3', 'D4'], ['A3', 'C4'], ['F#3', 'C4'], ['B3', 'D4'], ['A3', 'C4'], ['B3', 'D4'], ['B3', 'D4']];
  const accomp = (bar0, semis = 0, vel = 0.5) => {
    for (let k = 0; k < 8; k++) {
      for (let e = 0; e < 8; e++) {
        const b = (bar0 + k) * 4 + e * 0.5;
        T.add(pizz(transpose(bassBars[k], semis), vel), b, 0.55);
        if (e % 2 === 1) for (const c of chordBars[k]) T.add(pizz(transpose(c, semis), vel * 0.6), b, 0.35);
      }
    }
  };
  // A A' (B in D major) A''
  play(T, A + ' ' + A2, 0, strings, 0.55);
  accomp(0);
  play(T, transpose(A + ' ' + A2, 12), 32, (n, d) => strings(n, d, 1, 3000), 0.42);
  play(T, A + ' ' + A2, 32, strings, 0.3);
  accomp(8);
  play(T, transpose(A + ' ' + A2, 7), 64, strings, 0.5);
  accomp(16, 7);
  play(T, A + ' ' + A2, 96, strings, 0.55);
  play(T, transpose(A + ' ' + A2, 12), 96, (n, d) => strings(n, d, 1, 3000), 0.3);
  accomp(24, 0, 0.55);
  finish(T, 'placeholder_mvt1_nachtmusik.wav', 0.2);
}

/* ===== Movement 2 — Rush Hour Gallop (original chase cue, 152 BPM) ===== */
{
  const bars = 36;
  const T = track(152, bars);
  const prog = [['D', 0], ['Bb', -4], ['C', -2], ['A', -5]]; // i VI VII V (roots relative to D)
  for (let bar = 0; bar < bars; bar++) {
    const section = Math.floor(bar / 8);
    const up = bar >= 24 ? 1 : 0; // key lift for the final push
    const [, rel] = prog[bar % 4];
    const root3 = note('D3') + rel + up;
    const name = (m) => {
      const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return names[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
    };
    // galloping ostinato: 16ths  (root root fifth root | oct root fifth root)
    const pat = [0, 0, 7, 0, 12, 0, 7, 0, 0, 0, 7, 0, 12, 7, 3, 2];
    pat.forEach((iv, s) => T.add(pizz(name(root3 + iv), 0.9), bar * 4 + s * 0.25, s % 4 === 0 ? 0.55 : 0.38));
    // timpani on 1 & 3
    T.add(timp(name(root3 - 12), 1), bar * 4, 0.7);
    T.add(timp(name(root3 - 12 + 7), 0.8), bar * 4 + 2, 0.5);
    // snare 8ths rising with sections
    for (let e = 0; e < 8; e++) T.add(snare(0.5 + 0.15 * section, bar * 16 + e), bar * 4 + e * 0.5, 0.18 + section * 0.05);
    // brass stabs from section 2
    if (section >= 1) {
      for (const iv of [0, 3, 7]) T.add(brass(name(root3 + 12 + iv + (prog[bar % 4][0] === 'A' ? (iv === 3 ? 1 : 0) : 0)), 0.18), bar * 4, 0.3);
      T.add(brass(name(root3 + 12), 0.12), bar * 4 + 2.5, 0.22);
    }
    if (bar % 8 === 0 && bar > 0) T.add(cymbal(0.8), bar * 4, 0.35);
  }
  // original melody (sections 2-4)
  const mel = 'D5:.5 F5:.5 A5:1 G5:.5 F5:.5 E5:.5 D5:.5 Bb4:1 D5:.5 F5:.5 G5:1 r:.5 C5:.5 E5:.5 G5:.5 A5:1 C#5:.5 E5:.5 A5:2 r:.5 A4:.5';
  for (const start of [8, 12, 16, 20]) play(T, mel, start * 4, (n, d) => strings(n, d, 1, 3200), 0.4);
  for (const start of [24, 28, 32]) play(T, transpose(mel, 1), start * 4, (n, d) => brass(n, d, 1), 0.32);
  finish(T, 'placeholder_mvt2_chase.wav', 0.16);
}

/* ===== Movement 3 — Ode to Joy (epic, 150 BPM) ===== */
{
  const T = track(150, 34);
  const ode =
    'F#4:1 F#4:1 G4:1 A4:1 A4:1 G4:1 F#4:1 E4:1 D4:1 D4:1 E4:1 F#4:1 F#4:1.5 E4:.5 E4:2 ' +
    'F#4:1 F#4:1 G4:1 A4:1 A4:1 G4:1 F#4:1 E4:1 D4:1 D4:1 E4:1 F#4:1 E4:1.5 D4:.5 D4:2 ' +
    'E4:1 E4:1 F#4:1 D4:1 E4:1 F#4:.5 G4:.5 F#4:1 D4:1 E4:1 F#4:.5 G4:.5 F#4:1 E4:1 D4:1 E4:1 A3:2 ' +
    'F#4:1 F#4:1 G4:1 A4:1 A4:1 G4:1 F#4:1 E4:1 D4:1 D4:1 E4:1 F#4:1 E4:1.5 D4:.5 D4:2';
  const chords = ['D', 'A', 'D', 'A', 'D', 'A', 'D', 'D', 'A', 'D', 'A', 'A', 'D', 'A', 'D', 'D'];
  const triad = {D: ['D3', 'F#3', 'A3'], A: ['C#3', 'E3', 'A3']};
  const bass = {D: 'D2', A: 'A1'};
  // pass 1: strings (bars 0-15), pass 2: tutti (bars 16-31)
  play(T, ode, 0, (n, d) => strings(n, d, 1, 2600), 0.5);
  play(T, transpose(ode, 12), 64, (n, d) => strings(n, d, 1, 3400), 0.42);
  play(T, ode, 64, (n, d) => brass(n, d, 1), 0.4);
  for (let bar = 0; bar < 32; bar++) {
    const c = chords[bar % 16];
    const tutti = bar >= 16;
    for (let q = 0; q < 4; q++) {
      for (const n of triad[c]) T.add(strings(n, T.beat * 0.8, 0.7, 1800), bar * 4 + q, tutti ? 0.16 : 0.1);
      T.add(pizz(bass[c], 1), bar * 4 + q, tutti ? 0.5 : 0.35);
    }
    if (tutti || bar % 2 === 0) T.add(timp(bass[c].replace(/\d/, '2'), 1), bar * 4, tutti ? 0.65 : 0.4);
    if (tutti) T.add(timp(bass[c].replace(/\d/, '2'), 0.7), bar * 4 + 2, 0.4);
    if (bar === 16 || bar === 24) T.add(cymbal(1), bar * 4, 0.5);
  }
  // final cadence: D major hits
  for (const [b, g] of [[128, 1], [130, 1], [132, 1.2]]) {
    for (const n of ['D3', 'F#3', 'A3', 'D4', 'F#4', 'A4', 'D5']) T.add(brass(n, b === 132 ? 2.5 : 0.4), b, 0.2 * g);
    T.add(timp('D2', 1), b, 0.8);
  }
  T.add(cymbal(1), 132, 0.7);
  finish(T, 'placeholder_mvt3_ode.wav', 0.25);
}
