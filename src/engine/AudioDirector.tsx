import React from 'react';
import {getStaticFiles, Html5Audio, interpolate, Sequence, staticFile} from 'remotion';
import {beatFrame, FPS} from './time';

/**
 * AudioDirector
 * -------------
 * Declarative sound design for a zero-dialogue episode:
 *  - Music "movements" (drop-in licensed track, with procedural fallback)
 *  - One-shot SFX cues (optionally snapped to the movement's beat grid)
 *  - Looping ambience beds
 *  - Ducking windows that pull music/ambience down under big SFX or silence beats
 */

export type MusicMovement = {
  id: string;
  title: string;
  /** Preferred file in /public (e.g. "music/mvt1.mp3"), dropped in by the user. */
  file: string;
  /** Procedurally generated fallback in /public so the film always has a score. */
  fallback: string;
  from: number;
  to: number;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
  /** Seconds into the source track to start from. */
  startAt?: number;
  bpm: number;
};

export type SfxCue = {
  src: string;
  at: number;
  volume?: number;
  /** Optional max duration (frames). */
  duration?: number;
  playbackRate?: number;
  label?: string;
};

export type AmbienceBed = {
  src: string;
  from: number;
  to: number;
  volume: number;
  fade?: number;
};

export type DuckWindow = {from: number; to: number; amount: number; ramp?: number};

export type AudioPlan = {
  music: MusicMovement[];
  sfx: SfxCue[];
  ambience: AmbienceBed[];
  ducks: DuckWindow[];
};

const fileExists = (() => {
  let cache: Set<string> | null = null;
  return (name: string) => {
    if (!cache) {
      try {
        cache = new Set(getStaticFiles().map((f) => f.name));
      } catch {
        cache = new Set();
      }
    }
    return cache.has(name);
  };
})();

/** Resolve the music file to use: licensed drop-in if present, else procedural fallback. */
export const resolveMusic = (m: MusicMovement) => (fileExists(m.file) ? m.file : m.fallback);

/** Multiplier 0..1 from all duck windows at a global frame. */
export const duckGain = (frame: number, ducks: DuckWindow[]) =>
  ducks.reduce((g, d) => {
    const r = d.ramp ?? 8;
    const k = interpolate(frame, [d.from - r, d.from, d.to, d.to + r], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return g * (1 - d.amount * k);
  }, 1);

/** Snap a cue to the nearest beat of a movement (keeps hits musical). */
export const onBeat = (m: MusicMovement, approxFrame: number) => {
  const beatLen = (60 * FPS) / m.bpm;
  const beat = Math.round((approxFrame - m.from) / beatLen);
  return beatFrame(m.bpm, beat, m.from);
};

export const AudioDirector: React.FC<{plan: AudioPlan}> = ({plan}) => {
  return (
    <>
      {plan.music.map((m) => {
        const src = resolveMusic(m);
        if (!fileExists(src)) return null;
        const dur = m.to - m.from;
        const fi = m.fadeIn ?? 15;
        const fo = m.fadeOut ?? 30;
        return (
          <Sequence key={m.id} from={m.from} durationInFrames={dur} name={`♪ ${m.title}`} layout="none">
            <Html5Audio
              src={staticFile(src)}
              trimBefore={Math.round((m.startAt ?? 0) * FPS)}
              volume={(f) => {
                const env = interpolate(f, [0, fi, dur - fo, dur], [0, 1, 1, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
                return m.volume * env * duckGain(f + m.from, plan.ducks);
              }}
            />
          </Sequence>
        );
      })}
      {plan.ambience.map((a, i) => {
        if (!fileExists(a.src)) return null;
        const dur = a.to - a.from;
        const fade = a.fade ?? 20;
        return (
          <Sequence key={`amb-${i}`} from={a.from} durationInFrames={dur} name={`~ ${a.src}`} layout="none">
            <Html5Audio
              src={staticFile(a.src)}
              loop
              volume={(f) =>
                a.volume *
                interpolate(f, [0, fade, dur - fade, dur], [0, 1, 1, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }) *
                (0.35 + 0.65 * duckGain(f + a.from, plan.ducks))
              }
            />
          </Sequence>
        );
      })}
      {plan.sfx.map((c, i) => {
        if (!fileExists(c.src)) return null;
        return (
          <Sequence
            key={`sfx-${i}`}
            from={c.at}
            durationInFrames={c.duration ?? 6 * FPS}
            name={`♦ ${c.label ?? c.src}`}
            layout="none"
          >
            <Html5Audio src={staticFile(c.src)} volume={c.volume ?? 1} playbackRate={c.playbackRate ?? 1} />
          </Sequence>
        );
      })}
    </>
  );
};
