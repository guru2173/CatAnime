import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {drawingIndex, noise} from '../engine/time';
import {FilmGrain} from './fx/Fx';

/**
 * RotoscopeCut — hard-cut, high-contrast black & white "rotoscoped" inserts
 * used at peak panic beats. Realistic-proportioned anatomy drawn as inked
 * vector shapes, boiled every drawing (12fps), trembling, with 16mm grain.
 *
 *  shot="hand-pole"  trembling hand gripping a subway pole
 *  shot="eyes"       wide darting eyes, extreme close-up
 *  shot="hand-door"  hand reaching through closing train doors (progress = door gap 1 → 0)
 */
export type RotoShot = 'hand-pole' | 'eyes' | 'hand-door';

const INK = '#0b0b0c';
const PAPER = '#f1ede4';

const Boil: React.FC<{frame: number; amount?: number; children: React.ReactNode; id: string}> = ({frame, amount = 5, children, id}) => {
  const seed = drawingIndex(frame) % 40;
  const fid = `roto-${id}-${seed}`;
  return (
    <g filter={`url(#${fid})`}>
      <defs>
        <filter id={fid} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale={amount} />
        </filter>
      </defs>
      {children}
    </g>
  );
};

/** Diagonal hatching inside a path (ink shading). */
const Hatch: React.FC<{d: string; id: string; spacing?: number; angle?: number; w?: number}> = ({d, id, spacing = 9, angle = 35, w = 2.4}) => (
  <g>
    <defs>
      <pattern id={`h-${id}`} width={spacing} height={spacing} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
        <line x1={0} y1={0} x2={0} y2={spacing} stroke={INK} strokeWidth={w} />
      </pattern>
    </defs>
    <path d={d} fill={`url(#h-${id})`} />
  </g>
);

const HandOnPole: React.FC<{frame: number; grip: number}> = ({frame, grip}) => {
  const tx = noise(`hp-x-${frame}`) * 6;
  const ty = noise(`hp-y-${frame}`) * 5;
  const fingers = [0, 1, 2, 3];
  return (
    <g>
      {/* pole */}
      <rect x={890} y={-20} width={150} height={1120} fill="#2a2a2c" />
      <rect x={905} y={-20} width={26} height={1120} fill={PAPER} />
      <rect x={950} y={-20} width={10} height={1120} fill="#8a8a8a" />
      <rect x={1010} y={-20} width={30} height={1120} fill="#000" />
      <g transform={`translate(${tx} ${ty})`}>
        {/* forearm + back of hand */}
        <path d="M 300 1100 L 520 760 Q 610 560 840 470 L 930 700 Q 860 820 760 880 L 620 1100 Z" fill={PAPER} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        <Hatch id="arm" d="M 300 1100 L 470 840 Q 520 900 620 1100 Z" spacing={10} />
        {/* tendons / veins */}
        <path d="M 560 760 Q 680 640 830 560" fill="none" stroke={INK} strokeWidth={4} />
        <path d="M 600 820 Q 720 700 860 640" fill="none" stroke={INK} strokeWidth={3} />
        <path d="M 520 900 Q 600 860 640 800" fill="none" stroke={INK} strokeWidth={3} />
        {/* fingers wrapping the pole */}
        {fingers.map((i) => {
          const y = 430 + i * 92 + (i === 3 ? 6 : 0);
          const len = 230 - i * 14 + grip * 10;
          const h = 78 - i * 4;
          const x0 = 820;
          const d = `M ${x0} ${y} L ${x0 + len - h / 2} ${y - 6} Q ${x0 + len + 6} ${y + h / 2 - 6} ${x0 + len - h / 2} ${y + h - 6} L ${x0} ${y + h}`;
          return (
            <g key={i} transform={`translate(${noise(`f${i}-${frame}`) * 3} 0)`}>
              <path d={d} fill={PAPER} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
              <Hatch id={`fs${i}`} d={`M ${x0 + 40} ${y + h - 22} L ${x0 + len - 30} ${y + h - 26} L ${x0 + len - h / 2} ${y + h - 6} L ${x0 + 40} ${y + h}`} spacing={7} angle={-30} />
              {/* knuckle creases */}
              <path d={`M ${x0 + 70} ${y + 14} q 10 ${h * 0.3} 0 ${h * 0.6}`} fill="none" stroke={INK} strokeWidth={4} />
              <path d={`M ${x0 + 150} ${y + 10} q 8 ${h * 0.3} 0 ${h * 0.6}`} fill="none" stroke={INK} strokeWidth={3.5} />
              {/* nail */}
              <path d={`M ${x0 + len - 58} ${y + 10} Q ${x0 + len - 22} ${y + 12} ${x0 + len - 20} ${y + h / 2 - 6} Q ${x0 + len - 30} ${y + h - 20} ${x0 + len - 58} ${y + h - 22} Z`} fill="#fff" stroke={INK} strokeWidth={4} />
            </g>
          );
        })}
        {/* thumb */}
        <path d="M 760 820 Q 860 800 960 830 Q 1010 860 980 900 Q 900 920 800 900 Z" fill={PAPER} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <Hatch id="th" d="M 780 880 Q 880 900 980 890 Q 900 920 800 900 Z" spacing={6} />
        {/* sweat beads */}
        {[0, 1, 2].map((i) => (
          <ellipse key={i} cx={640 + i * 60} cy={620 + i * 40 + ((frame * 2 + i * 7) % 30)} rx={7} ry={11} fill="#fff" stroke={INK} strokeWidth={3} />
        ))}
      </g>
    </g>
  );
};

const RealEye: React.FC<{cx: number; cy: number; lookX: number; lookY: number; side: -1 | 1; frame: number}> = ({cx, cy, lookX, lookY, side, frame}) => {
  const w = 300;
  const h = 150;
  const almond = `M ${cx - w / 2} ${cy + 6} Q ${cx - w * 0.1} ${cy - h * 0.95} ${cx + w / 2} ${cy - 8} Q ${cx + w * 0.05} ${cy + h * 0.8} ${cx - w / 2} ${cy + 6} Z`;
  const ix = cx + lookX * 70;
  const iy = cy + lookY * 22;
  const id = `eye${side}`;
  return (
    <g>
      <clipPath id={`c-${id}`}>
        <path d={almond} />
      </clipPath>
      <path d={almond} fill="#fbf8f2" />
      <g clipPath={`url(#c-${id})`}>
        <circle cx={ix} cy={iy} r={64} fill="#bdbab3" stroke={INK} strokeWidth={6} />
        {Array.from({length: 28}).map((_, i) => {
          const a = (i / 28) * Math.PI * 2;
          return <line key={i} x1={ix + Math.cos(a) * 18} y1={iy + Math.sin(a) * 18} x2={ix + Math.cos(a) * 60} y2={iy + Math.sin(a) * 60} stroke={INK} strokeWidth={2} opacity={0.75} />;
        })}
        <circle cx={ix} cy={iy} r={11} fill={INK} />
        <circle cx={ix - 22} cy={iy - 24} r={12} fill="#fff" />
        <Hatch id={`lid${side}`} d={`M ${cx - w / 2} ${cy - 80} L ${cx + w / 2} ${cy - 80} L ${cx + w / 2} ${cy - 30} Q ${cx} ${cy - 70} ${cx - w / 2} ${cy - 20} Z`} spacing={8} />
      </g>
      <path d={almond} fill="none" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      {/* upper lid crease + lashes */}
      <path d={`M ${cx - w / 2 + 10} ${cy - 30} Q ${cx - w * 0.05} ${cy - h * 1.15} ${cx + w / 2 - 10} ${cy - 40}`} fill="none" stroke={INK} strokeWidth={5} />
      {Array.from({length: 9}).map((_, i) => {
        const t = 0.1 + i * 0.1;
        const x = cx - w / 2 + w * t;
        const y = cy - h * 0.62 * Math.sin(Math.PI * t) + 4;
        return <line key={i} x1={x} y1={y} x2={x + side * 4 - 6 + i * 2} y2={y - 26 - Math.sin(Math.PI * t) * 10} stroke={INK} strokeWidth={4} strokeLinecap="round" />;
      })}
      {/* brow, raised in panic */}
      <path d={`M ${cx - w / 2 - 20} ${cy - 150 - side * 10} Q ${cx} ${cy - 230} ${cx + w / 2 + 20} ${cy - 160 + side * 10}`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <Hatch id={`bag${side}`} d={`M ${cx - w / 2} ${cy + 40} Q ${cx} ${cy + 110} ${cx + w / 2} ${cy + 30} Q ${cx} ${cy + 80} ${cx - w / 2} ${cy + 40} Z`} spacing={7} />
      <ellipse cx={cx + side * 190} cy={cy - 140 + ((frame * 3) % 50)} rx={10} ry={16} fill="#fff" stroke={INK} strokeWidth={3} />
    </g>
  );
};

const Eyes: React.FC<{frame: number}> = ({frame}) => {
  const k = Math.floor(frame / 4);
  const lookX = noise(`dx${k}`) * 0.95;
  const lookY = noise(`dy${k}`) * 0.6;
  const tx = noise(`ex${frame}`) * 4;
  return (
    <g transform={`translate(${tx} ${noise(`ey${frame}`) * 3})`}>
      <rect width={1920} height={1080} fill="#8f8c86" />
      <Hatch id="skin" d="M 0 0 L 1920 0 L 1920 1080 L 0 1080 Z" spacing={14} angle={60} w={1.2} />
      <g transform="translate(960 600) scale(1.75) translate(-960 -560)">
        <RealEye cx={660} cy={560} lookX={lookX} lookY={lookY} side={-1} frame={frame} />
        <RealEye cx={1260} cy={560} lookX={lookX} lookY={lookY} side={1} frame={frame} />
      </g>
    </g>
  );
};

const HandDoor: React.FC<{frame: number; progress: number}> = ({frame, progress}) => {
  const gap = 40 + 560 * progress; // closing
  const reach = 1 - progress; // hand extends as doors close
  const hx = 960 + noise(`hd${frame}`) * 6;
  const hy = 1150 - reach * 520;
  const fingerAngles = [-38, -16, 0, 16, 34];
  return (
    <g>
      <rect width={1920} height={1080} fill="#1a1a1a" />
      {/* platform glimpse through the gap */}
      <rect x={960 - gap / 2} y={0} width={gap} height={1080} fill={PAPER} />
      <Hatch id="plat" d={`M ${960 - gap / 2} 760 L ${960 + gap / 2} 760 L ${960 + gap / 2} 1080 L ${960 - gap / 2} 1080 Z`} spacing={12} angle={0} />
      {[-1, 1].map((sd) => {
        const edge = 960 + (sd * gap) / 2;
        const outer = sd < 0 ? -40 : 1960;
        return (
          <g key={sd}>
            <path d={`M ${outer} -20 L ${edge} -20 L ${edge} 1100 L ${outer} 1100 Z`} fill="#d8d6d0" stroke={INK} strokeWidth={8} />
            <rect x={sd < 0 ? edge - 360 : edge + 120} y={170} width={240} height={360} rx={18} fill="#55595f" stroke={INK} strokeWidth={8} />
            <Hatch id={`dw${sd}`} d={`M ${sd < 0 ? edge - 360 : edge + 120} 170 h 240 v 360 h -240 Z`} spacing={10} angle={45} />
            <rect x={sd < 0 ? edge - 34 : edge} y={-20} width={34} height={1120} fill={INK} />
            <Hatch id={`dd${sd}`} d={`M ${sd < 0 ? edge - 200 : edge + 34} -20 h 166 v 1120 h -166 Z`} spacing={9} angle={sd * 70} w={1.6} />
          </g>
        );
      })}
      {/* forearm + reaching hand */}
      <g transform={`translate(${hx} ${hy}) rotate(${noise(`hr${frame}`) * 2})`}>
        <path d="M -110 600 L -80 120 Q -70 40 0 30 Q 70 40 80 120 L 110 600 Z" fill={PAPER} stroke={INK} strokeWidth={9} />
        <Hatch id="fa" d="M 30 600 L 50 140 Q 70 160 80 120 L 110 600 Z" spacing={8} />
        <ellipse cx={0} cy={30} rx={95} ry={80} fill={PAPER} stroke={INK} strokeWidth={9} />
        {fingerAngles.map((a, i) => {
          const len = i === 0 ? 120 : 170 + (i === 2 ? 30 : 0) - Math.abs(i - 2) * 12;
          const spread = 1 + reach * 0.35;
          return (
            <g key={i} transform={`rotate(${a * spread} 0 20) translate(${(i - 2) * 30} ${i === 0 ? 40 : 0})`}>
              <path d={`M -19 0 L -15 ${-len} Q 0 ${-len - 26} 15 ${-len} L 19 0 Z`} fill={PAPER} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
              <path d={`M -10 ${-len * 0.45} q 10 -6 20 0 M -10 ${-len * 0.75} q 10 -5 20 0`} fill="none" stroke={INK} strokeWidth={3} />
              <path d={`M -10 ${-len + 2} Q 0 ${-len - 16} 10 ${-len + 2} Z`} fill="#fff" stroke={INK} strokeWidth={3} />
            </g>
          );
        })}
      </g>
    </g>
  );
};

export const RotoscopeCut: React.FC<{shot: RotoShot; frame: number; progress?: number; tint?: string}> = ({shot, frame, progress = 0, tint = 'rgba(0,0,0,0)'}) => {
  const flicker = 0.92 + random(`fl-${frame}`) * 0.12;
  return (
    <AbsoluteFill style={{background: '#000', filter: `grayscale(1) contrast(1.35) brightness(${flicker})`}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <Boil frame={frame} id={shot} amount={6}>
          {shot === 'hand-pole' ? <HandOnPole frame={frame} grip={progress} /> : shot === 'eyes' ? <Eyes frame={frame} /> : <HandDoor frame={frame} progress={progress} />}
        </Boil>
      </svg>
      <AbsoluteFill style={{background: tint, mixBlendMode: 'multiply'}} />
      <FilmGrain frame={frame} amount={0.55} id={`rg-${shot}`} />
    </AbsoluteFill>
  );
};
