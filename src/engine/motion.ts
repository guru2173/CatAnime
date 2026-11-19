import type {CatPose} from '../components/cats/CatRig';

/**
 * Pose generators for the CatRig. All take an (already stepped) frame so
 * limbs snap at 12fps like hand-drawn flipnote animation.
 */

export const idle = (f: number, seed = 0): CatPose => ({
  squash: 1 + Math.sin(f / 14 + seed) * 0.012,
  tail: Math.sin(f / 18 + seed) * 10,
  strings: Math.sin(f / 20 + seed) * 3,
  armL: 8,
  armR: 8,
});

export const walk = (f: number, speed = 1, amp = 1): CatPose => {
  const ph = f * 0.32 * speed;
  const s = Math.sin(ph);
  return {
    legL: 26 * s * amp,
    legR: -26 * s * amp,
    armL: 8 + 22 * s * amp,
    armR: 8 + 22 * s * amp,
    hop: -Math.abs(Math.cos(ph)) * 10 * amp,
    squash: 1 + Math.abs(Math.cos(ph)) * 0.03 * amp,
    tail: Math.sin(ph + 1.2) * 16,
    strings: -Math.sin(ph) * 10,
    lean: 4 * amp,
    headTurn: 0.55,
  };
};

export const run = (f: number, speed = 1): CatPose & {smear: number} => {
  const ph = f * 0.55 * speed;
  const s = Math.sin(ph);
  return {
    legL: 55 * s,
    legR: -55 * s,
    liftL: s > 0 ? 30 * s : 0,
    liftR: s < 0 ? -30 * s : 0,
    armL: 10 + 70 * s,
    armR: 10 - 70 * s + 60,
    hop: -Math.abs(Math.cos(ph)) * 26,
    squash: 1 + Math.cos(ph * 2) * 0.06,
    tail: 30 + Math.sin(ph) * 20,
    strings: -40,
    lean: 16,
    headTurn: 0.8,
    smear: Math.abs(Math.cos(ph)) > 0.92 ? 0.85 : 0,
  };
};

/** Panting exhaustion. */
export const pant = (f: number): CatPose => ({
  lean: 26 + Math.sin(f / 4) * 4,
  squash: 0.94 + Math.sin(f / 4) * 0.03,
  armL: 14,
  armR: 14,
  legL: -10,
  legR: 10,
  tail: -20,
  strings: 10 + Math.sin(f / 4) * 6,
  headTilt: 6,
});
