import React from 'react';
import {CamParams, place, project} from '../../engine/CinematicCamera';
import {crowdLook} from '../../components/cats/Cast';
import {SEAT_XS, SEAT_Z} from '../../components/world/MetroInterior';
import {CatRig, rigHead} from '../../components/cats/CatRig';

/** Camera across the car toward the bench (the "two-shot" angle). */
export const sideCam = (push = 0, x = 0, y = 1.32, fov = 60): CamParams => ({
  position: [x, y, 2.0 - push],
  lookAt: [x, y - 0.32, -2],
  fov,
});

/** Close-up camera on a character's head (head at ~1.35m for a 1.5m rig). */
export const faceCam = (x: number, z: number, dist = 1.4, fov = 40, headY = 1.35, sideOffset = 0): CamParams => ({
  position: [x + sideOffset, headY + 0.08, z + dist],
  lookAt: [x, headY - 0.02, z],
  fov,
});

/** Screen position of the head of a placed rig (accounts for lean around the hips). */
export const headScreen = (pl: {x: number; y: number; scale: number}, lean = 0, facing: 1 | -1 = 1, sit = false) => {
  const {hip: hipY, headCY: headY} = rigHead(sit);
  const a = (lean * Math.PI) / 180;
  const dx = Math.sin(a) * (hipY - headY);
  const dy = hipY - Math.cos(a) * (hipY - headY);
  return {x: pl.x + dx * pl.scale * facing, y: pl.y + dy * pl.scale, r: 62 * pl.scale};
};

/** 2D chrome pole drawn over rigs so a cat can be "behind" (and bonk into) a 3D pole. */
export const OverlayPole: React.FC<{cam: CamParams; x: number; z: number; top?: number}> = ({cam, x, z, top = 2.55}) => {
  const a = project(cam, [x, 0, z]);
  const b = project(cam, [x, top, z]);
  const w = Math.max(6, 0.062 * a.pxPerUnit);
  const id = `pole-${Math.round(a.x)}`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          <stop offset="0" stopColor="#9aa6b2" />
          <stop offset="0.35" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#d5dde4" />
          <stop offset="1" stopColor="#7f8b97" />
        </linearGradient>
      </defs>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#1d1a1f" strokeWidth={w + 6} />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={`url(#${id})`} strokeWidth={w} />
    </g>
  );
};

/** Cartoon bump that grows after a bonk. */
export const Bump: React.FC<{x: number; y: number; s: number; grow: number}> = ({x, y, s, grow}) =>
  grow <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s * grow})`}>
      <path d="M -26 8 Q -24 -34 0 -36 Q 24 -34 26 8 Z" fill="#ffb59a" stroke="#1d1a1f" strokeWidth={6} />
      <path d="M -10 -22 Q -4 -28 4 -26" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" />
    </g>
  );

/** Little white earbud prop in screen space. */
export const Earbud: React.FC<{x: number; y: number; s?: number; rot?: number; glint?: number}> = ({x, y, s = 1, rot = 0, glint = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={12} ry={10} fill="#fff" stroke="#1d1a1f" strokeWidth={4} />
    <rect x={-4} y={5} width={8} height={18} rx={4} fill="#fff" stroke="#1d1a1f" strokeWidth={3.5} />
    {glint > 0 ? (
      <path
        d="M 18 -24 Q 18 -14 28 -14 Q 18 -14 18 -4 Q 18 -14 8 -14 Q 18 -14 18 -24 Z"
        fill="#fff6b0"
        stroke="#1d1a1f"
        strokeWidth={2}
        transform={`scale(${glint})`}
      />
    ) : null}
  </g>
);


const CROWD_FACES = ['dot', 'dot', 'half', 'dot', 'shut', 'dot', 'normal', 'dot'] as const;

/** Flat 2D commuter cats sitting on the bench (background extras, like a flipnote crowd). */
export const SeatedCrowd: React.FC<{cam: CamParams; frame: number; empty?: number[]; skip?: number[]; moving?: boolean; opacity?: number}> = ({
  cam,
  frame,
  empty = [4],
  skip = [],
  moving = false,
  opacity = 1,
}) => (
  <g opacity={opacity}>
    {SEAT_XS.map((x, i) => {
      if (empty.includes(i) || skip.includes(i)) return null;
      const pl = place(cam, [x, 0.44, SEAT_Z + 0.05], 1.15);
      const nod = moving ? Math.sin(frame / 16 + i) * 3 : 0;
      return (
        <CatRig
          key={i}
          look={crowdLook(i)}
          seed={`crowd-${i}`}
          {...pl}
          frame={frame}
          noWobble
          pose={{sit: true, headTilt: nod + (i % 3 === 0 ? 6 : 0), armL: 4, armR: i % 4 === 1 ? -35 : 4, tail: -20}}
          holdingR={i % 4 === 1 ? 'phone' : 'none'}
          face={{eyes: CROWD_FACES[i % CROWD_FACES.length], mouth: 'flat', lookY: 0.6}}
        />
      );
    })}
  </g>
);
