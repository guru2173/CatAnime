#!/usr/bin/env node
// Procedural SFX synthesizer for CatAnime.
// Writes real 16-bit PCM .wav files into public/sfx/ — no samples, no downloads.
//   node scripts/generate-sfx.mjs
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  SR, buf, sine, saw, noiseBuf, bell, mixIn, lowpass, highpass, lowpassQ, bandpassSweep,
  drive, reverb, normalize, fade, makeLoop, shape, writeWav, midi, note,
} from './lib/dsp.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (name) => path.join(root, 'public', 'sfx', name);
const made = [];
const save = (name, x, peak = 0.89) => {
  writeWav(out(name), normalize(fade(x), peak));
  made.push(`${name.padEnd(24)} ${(x.length / SR).toFixed(2)}s`);
};

/* 1. heartbeat_sub — deep cinematic "lub-dub" bass thump */
const thump = (pitch, len, gain) => {
  const x = sine((t) => pitch * (0.45 + 0.55 * Math.exp(-t * 18)), len);
  shape(x, (t) => Math.min(1, t / 0.004) * Math.exp(-t * 9));
  const click = noiseBuf(0.03, 11);
  lowpass(click, 900);
  shape(click, (t) => Math.exp(-t * 160));
  mixIn(x, click, 0, 0.35);
  for (let i = 0; i < x.length; i++) x[i] *= gain;
  return x;
};
{
  const x = buf(1.1);
  mixIn(x, thump(95, 0.6, 1), 0.0);
  mixIn(x, thump(80, 0.7, 0.8), 0.27);
  drive(x, 2.4);
  lowpass(x, 400);
  save('heartbeat_sub.wav', x, 0.95);
}

/* 2. train_ambience — loopable rumble with rhythmic clack-clack over rail joints */
{
  const len = 4.4;
  const x = buf(len);
  const rumble = noiseBuf(len, 21);
  lowpass(lowpass(rumble, 140), 180);
  mixIn(x, rumble, 0, 6);
  // motor whine
  const whine = sine((t) => 310 + 6 * Math.sin(t * 1.3), len);
  mixIn(x, whine, 0, 0.012);
  const clack = (seed) => {
    const c = noiseBuf(0.18, seed);
    bandpassSweep(c, () => 1400, 3);
    shape(c, (t) => Math.exp(-t * 38));
    const body = sine((t) => 160 * (1 + Math.exp(-t * 40)), 0.18);
    shape(body, (t) => Math.exp(-t * 30));
    mixIn(c, body, 0, 0.8);
    return c;
  };
  // two bogies per rail joint: clack-clack ... clack-clack
  for (const t0 of [0.25, 2.25]) {
    mixIn(x, clack(31), t0, 0.55);
    mixIn(x, clack(32), t0 + 0.13, 0.45);
    mixIn(x, clack(33), t0 + 0.85, 0.5);
    mixIn(x, clack(34), t0 + 0.98, 0.4);
  }
  save('train_ambience.wav', makeLoop(x, 0.4), 0.7);
}

/* 3. door_chime — two-tone closing chime + pneumatic hiss + door thunk */
{
  const x = buf(3.0);
  const tone = (f, at) => {
    const b = bell(f, 1.4, SR, [1, 2, 3, 4.2], 0.9);
    mixIn(x, b, at, 0.6);
  };
  tone(midi(note('E5')), 0);
  tone(midi(note('C5')), 0.45);
  const hiss = noiseBuf(1.3, 41);
  highpass(hiss, 2500);
  shape(hiss, (t) => Math.min(1, t / 0.05) * Math.exp(-t * 2.6));
  mixIn(x, hiss, 1.2, 0.35);
  const thunk = sine((t) => 90 * (1 + Math.exp(-t * 30)), 0.35);
  shape(thunk, (t) => Math.exp(-t * 14));
  mixIn(x, thunk, 2.25, 0.9);
  reverb(x, {mix: 0.18});
  save('door_chime.wav', x);
}

/* 4. comic_bonk — pitched cartoon impact with a woodblock body and boing tail */
{
  const x = buf(0.9);
  const hit = sine((t) => 520 * Math.exp(-t * 9) + 170, 0.5);
  shape(hit, (t) => Math.exp(-t * 11));
  mixIn(x, hit, 0, 1);
  const wood = sine(1150, 0.12);
  shape(wood, (t) => Math.exp(-t * 60));
  mixIn(x, wood, 0, 0.6);
  const boing = sine((t) => 260 + 90 * Math.sin(t * 2 * Math.PI * 14) * Math.exp(-t * 4), 0.7);
  shape(boing, (t) => Math.exp(-t * 6));
  mixIn(x, boing, 0.06, 0.45);
  const crack = noiseBuf(0.03, 5);
  highpass(crack, 1500);
  mixIn(x, crack, 0, 0.5);
  drive(x, 1.6);
  save('comic_bonk.wav', x);
}

/* 5. earbud_pop — tiny plastic pop + diminishing bounces */
{
  const x = buf(1.2);
  const pop = sine((t) => 700 + 1400 * Math.min(1, t * 40), 0.07);
  shape(pop, (t) => Math.exp(-t * 55));
  mixIn(x, pop, 0, 1);
  const tick = (f) => {
    const b = bell(f, 0.12, SR, [1, 2.3, 3.9], 0.03);
    return b;
  };
  let at = 0.22, g = 0.7;
  for (let k = 0; k < 6; k++) {
    mixIn(x, tick(2600 - k * 120), at, g);
    at += 0.2 * Math.pow(0.7, k);
    g *= 0.72;
  }
  save('earbud_pop.wav', x);
}

/* 6. anime_whoosh — band-passed noise sweep for whip pans */
{
  const len = 0.75;
  const x = noiseBuf(len, 61);
  bandpassSweep(x, (t) => 350 + 3200 * Math.sin(Math.PI * Math.min(1, t / len)) ** 2, 1.4);
  shape(x, (t) => Math.sin(Math.PI * Math.min(1, t / len)) ** 1.6);
  save('anime_whoosh.wav', x);
}

/* 7. vine_boom — huge distorted sub boom sting for rotoscope cuts */
{
  const x = buf(2.8);
  const boom = sine((t) => 48 + 70 * Math.exp(-t * 7), 2.6);
  shape(boom, (t) => Math.min(1, t / 0.006) * Math.exp(-t * 1.6));
  mixIn(x, boom, 0, 1);
  const body = saw(55, 1.2, SR, 8);
  shape(body, (t) => Math.exp(-t * 4));
  lowpass(body, 300);
  mixIn(x, body, 0, 0.5);
  const att = noiseBuf(0.15, 71);
  lowpass(att, 2500);
  shape(att, (t) => Math.exp(-t * 30));
  mixIn(x, att, 0, 0.6);
  drive(x, 3.2);
  lowpass(x, 1800);
  reverb(x, {mix: 0.22, room: 0.86});
  save('vine_boom.wav', x, 0.97);
}

/* 8. tricycle_bell — thumb-bell "brring-brring" with inharmonic partials */
{
  const x = buf(1.6);
  const strike = (at, g) => mixIn(x, bell(2350, 0.9, SR, [1, 1.47, 2.09, 2.56, 3.9], 0.35), at, g);
  for (let k = 0; k < 6; k++) strike(k * 0.035, 0.6 - k * 0.06);
  for (let k = 0; k < 6; k++) strike(0.42 + k * 0.035, 0.6 - k * 0.06);
  shape(x, (t) => 1 + 0.25 * Math.sin(2 * Math.PI * 22 * t));
  reverb(x, {mix: 0.12});
  save('tricycle_bell.wav', x);
}

/* 9. footsteps_sprint — rapid sneaker footfalls (≈7 steps/s) */
{
  const len = 3.2;
  const x = buf(len);
  const step = (seed, pitch) => {
    const s = sine((t) => pitch * (1 + Math.exp(-t * 50)), 0.12);
    shape(s, (t) => Math.exp(-t * 45));
    const scuff = noiseBuf(0.09, seed);
    bandpassSweep(scuff, (t) => 2200 - t * 9000, 1.2);
    shape(scuff, (t) => Math.exp(-t * 50));
    mixIn(s, scuff, 0.005, 0.7);
    return s;
  };
  for (let k = 0, t = 0.02; t < len - 0.15; k++, t += 0.142) {
    mixIn(x, step(100 + k, k % 2 ? 105 : 125), t + (k % 2 ? 0.006 : 0), k % 2 ? 0.8 : 1);
  }
  save('footsteps_sprint.wav', x);
}

/* 10. romantic_sparkle — warm shimmering chime arpeggio over a soft Cmaj9 pad */
{
  const len = 5.0;
  const x = buf(len);
  const pad = ['C4', 'E4', 'G4', 'B4', 'D5'];
  for (const n of pad) {
    const v = saw(midi(note(n)), len, SR, 6, 0.004, 4.8);
    lowpass(v, 1400);
    shape(v, (t) => Math.min(1, t / 1.2) * Math.min(1, (len - t) / 1.5));
    mixIn(x, v, 0, 0.12);
  }
  const arp = ['C6', 'E6', 'G6', 'B6', 'D7', 'G6', 'B6', 'E7', 'C7', 'G7'];
  arp.forEach((n, k) => mixIn(x, bell(midi(note(n)), 2.2, SR, [1, 2.0, 3.0, 4.1], 0.8), 0.08 + k * 0.11, 0.32));
  const shimmer = noiseBuf(len, 91);
  highpass(highpass(shimmer, 7000), 7000);
  shape(shimmer, (t) => 0.15 * Math.exp(-t * 0.8) * (0.5 + 0.5 * Math.sin(t * 60)));
  mixIn(x, shimmer, 0, 1);
  reverb(x, {mix: 0.4, room: 0.88});
  lowpassQ(x, 9000);
  save('romantic_sparkle.wav', x);
}

console.log('🎧 Synthesized SFX → public/sfx/');
for (const m of made) console.log('  •', m);
