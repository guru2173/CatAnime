import React from 'react';
import {boil, drawingIndex} from '../../engine/time';

/**
 * CatRig — lanky, thick-outlined flipnote cat puppet (SVG).
 *
 * Style: tall noodle bodies, small heads with tall pointy ears and jagged cheek
 * fluff, big oval eyes with pinprick pupils, boiling wobbly ink lines.
 * Local space: origin at the feet, y up is negative, 350 units ≈ rig height.
 */

export type EyeShape = 'normal' | 'wide' | 'shut' | 'happy' | 'spiral' | 'heart' | 'dot' | 'half' | 'sparkle' | 'angry' | 'x';
export type MouthShape = 'neutral' | 'smile' | 'smirk' | 'o' | 'wobble' | 'grin' | 'open' | 'frown' | 'pant' | 'flat' | 'shout';
export type EarShape = 'up' | 'flat' | 'perk' | 'droop';

export type CatFace = {
  eyes?: EyeShape;
  lookX?: number;
  lookY?: number;
  mouth?: MouthShape;
  ears?: EarShape;
  blush?: number;
  redFace?: number;
  sweat?: number;
  tears?: boolean;
  brow?: number;
};

export type CatPose = {
  lean?: number;
  headTilt?: number;
  headTurn?: number;
  armL?: number;
  armR?: number;
  legL?: number;
  legR?: number;
  liftL?: number;
  liftR?: number;
  sit?: boolean;
  squash?: number;
  tail?: number;
  strings?: number;
  hop?: number;
};

export type CatLook = {
  fur: string;
  furShade: string;
  outfit: string;
  outfitShade: string;
  outfitKind: 'hoodie' | 'cardigan' | 'tee' | 'shawl' | 'none';
  innerEar: string;
  markings: 'tabby' | 'calico' | 'plain' | 'socks';
  patchA?: string;
  patchB?: string;
  headphones?: string | null;
  cap?: string | null;
  glasses?: boolean;
  backpack?: string | null;
  scaleHead?: number;
  /** Accent colour on ear tips / tail tip. */
  earTip?: string | null;
  tailTip?: string | null;
  /** Mitten-paw / foot colour (defaults to fur). */
  paw?: string | null;
  /** Optional little scarf / tie accent. */
  accent?: string | null;
};

export type Holding = 'none' | 'book' | 'earbud' | 'cane' | 'phone' | 'backpack';

export type CatRigProps = {
  look: CatLook;
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1;
  pose?: CatPose;
  face?: CatFace;
  frame: number;
  seed?: string;
  holdingL?: Holding;
  holdingR?: Holding;
  earbud?: boolean;
  smear?: number;
  opacity?: number;
  headphonesMode?: 'on' | 'off' | 'one-side' | 'neck';
  borrowedCup?: string | null;
  /** Disable the ink-wobble filter (cheap background extras). */
  noWobble?: boolean;
};

const INK = '#141214';
const W = 5;

/** Rig geometry, exported so scenes can find the head for FX placement. */
export const RIG = {
  hipStand: -150,
  hipSit: -78,
  torso: 112,
  headAboveShoulder: 52,
  headRx: 60,
  headRy: 50,
};

export const rigHead = (sit = false) => {
  const hip = sit ? RIG.hipSit : RIG.hipStand;
  const shoulder = hip - RIG.torso;
  return {hip, shoulder, headCY: shoulder - RIG.headAboveShoulder};
};


type P2 = [number, number];
/** Quadratic/cubic-ish polyline → closed tapered ribbon (width w0 → w1). */
const taper = (pts: P2[], w0: number, w1: number, steps = 14) => {
  const bez = (t: number): P2 => {
    if (pts.length === 3) {
      const [a, b, c] = pts;
      const u = 1 - t;
      return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]];
    }
    const [a, b, c, d] = pts;
    const u = 1 - t;
    return [
      u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
      u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
    ];
  };
  const L: P2[] = [];
  const R: P2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = bez(t);
    const q = bez(Math.min(1, t + 0.01));
    const p0 = bez(Math.max(0, t - 0.01));
    const dx = q[0] - p0[0];
    const dy = q[1] - p0[1];
    const n = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * t) / 2;
    L.push([p[0] - (dy / n) * w, p[1] + (dx / n) * w]);
    R.push([p[0] + (dy / n) * w, p[1] - (dx / n) * w]);
  }
  const end = bez(1);
  const endR = (w1 / 2) * 1.0;
  const f = (p: P2) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  return `M ${f(L[0])} ${L.slice(1).map((p) => `L ${f(p)}`).join(' ')} A ${endR} ${endR} 0 0 0 ${f(R[R.length - 1])} ${R.slice(0, -1)
    .reverse()
    .map((p) => `L ${f(p)}`)
    .join(' ')} Z` + (end ? '' : '');
};

/** Simple pointed cartoon foot. */
const footPath = (fx: number, fy: number, dir: 1 | -1) =>
  `M ${fx - 12 * dir} ${fy + 2} Q ${fx - 13 * dir} ${fy - 12} ${fx} ${fy - 12} Q ${fx + 20 * dir} ${fy - 8} ${fx + 22 * dir} ${fy + 2} Z`;

const Eye: React.FC<{cx: number; cy: number; shape: EyeShape; lookX: number; lookY: number; side: -1 | 1; lid: string}> = ({
  cx,
  cy,
  shape,
  lookX,
  lookY,
  side,
  lid,
}) => {
  const s = {stroke: INK, strokeWidth: W, fill: 'none', strokeLinecap: 'round' as const};
  switch (shape) {
    case 'shut':
      return <path d={`M ${cx - 13} ${cy + 2} Q ${cx} ${cy + 9} ${cx + 13} ${cy + 2}`} {...s} />;
    case 'happy':
      return <path d={`M ${cx - 13} ${cy + 5} Q ${cx} ${cy - 12} ${cx + 13} ${cy + 5}`} {...s} />;
    case 'dot':
      return <ellipse cx={cx + lookX * 3} cy={cy + lookY * 3} rx={5} ry={10} fill={INK} />;
    case 'x':
      return (
        <g {...s}>
          <line x1={cx - 10} y1={cy - 10} x2={cx + 10} y2={cy + 10} />
          <line x1={cx + 10} y1={cy - 10} x2={cx - 10} y2={cy + 10} />
        </g>
      );
    case 'spiral': {
      let d = `M ${cx} ${cy}`;
      for (let a = 0; a < Math.PI * 5; a += 0.35) {
        const r = 1.25 * a;
        d += ` L ${cx + Math.cos(a * side) * r} ${cy + Math.sin(a * side) * r * 1.2}`;
      }
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx={18} ry={23} fill="#fff" stroke={INK} strokeWidth={W} />
          <path d={d} stroke={INK} strokeWidth={3} fill="none" />
        </g>
      );
    }
    case 'heart':
      return (
        <path
          d={`M ${cx} ${cy + 13} C ${cx - 24} ${cy - 3} ${cx - 13} ${cy - 21} ${cx} ${cy - 8} C ${cx + 13} ${cy - 21} ${cx + 24} ${cy - 3} ${cx} ${cy + 13} Z`}
          fill="#ff4d7a"
          stroke={INK}
          strokeWidth={4}
        />
      );
    case 'angry':
      return (
        <g>
          <ellipse cx={cx + lookX * 3} cy={cy + 4} rx={5} ry={7} fill={INK} />
          <line x1={cx - 13 * side} y1={cy - 15} x2={cx + 11 * side} y2={cy - 6} {...s} />
        </g>
      );
    case 'half':
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx={18} ry={23} fill="#fff" stroke={INK} strokeWidth={W} />
          <circle cx={cx + lookX * 6} cy={cy + 7 + lookY * 3} r={3.4} fill={INK} />
          <path d={`M ${cx - 21} ${cy} A 21 26 0 0 1 ${cx + 21} ${cy} Z`} fill={lid} />
          <line x1={cx - 20} y1={cy} x2={cx + 20} y2={cy} {...s} />
        </g>
      );
    case 'sparkle':
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx={18} ry={23} fill="#fff" stroke={INK} strokeWidth={W} />
          <ellipse cx={cx + lookX * 4} cy={cy + 3} rx={10} ry={13} fill="#2b2238" />
          <circle cx={cx + lookX * 4 - 4} cy={cy - 3} r={4} fill="#fff" />
          <circle cx={cx + lookX * 4 + 4} cy={cy + 8} r={2} fill="#fff" />
        </g>
      );
    case 'wide':
      return (
        <g>
          <ellipse cx={cx + side * 4} cy={cy - 4} rx={27} ry={34} fill="#fff" stroke={INK} strokeWidth={W} />
          <circle cx={cx + side * 4 + lookX * 12} cy={cy - 4 + lookY * 14} r={2.4} fill={INK} />
        </g>
      );
    default:
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx={18} ry={23} fill="#fff" stroke={INK} strokeWidth={W} />
          <circle cx={cx + lookX * 8} cy={cy + lookY * 10} r={3.4} fill={INK} />
        </g>
      );
  }
};

const Mouth: React.FC<{x: number; y: number; shape: MouthShape}> = ({x, y, shape}) => {
  const s = {stroke: INK, strokeWidth: 4, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  switch (shape) {
    case 'smile':
      return <path d={`M ${x - 10} ${y - 2} Q ${x} ${y + 8} ${x + 10} ${y - 2}`} {...s} />;
    case 'smirk':
      return <path d={`M ${x - 8} ${y + 2} Q ${x + 2} ${y + 5} ${x + 11} ${y - 4}`} {...s} />;
    case 'o':
      return <ellipse cx={x} cy={y + 3} rx={5} ry={7} fill={INK} />;
    case 'wobble':
      return <path d={`M ${x - 13} ${y + 2} l 5 -4 l 5 4 l 5 -4 l 5 4 l 5 -4`} {...s} />;
    case 'grin':
      return <path d={`M ${x - 14} ${y - 3} Q ${x} ${y + 18} ${x + 14} ${y - 3} Z`} fill="#fff" stroke={INK} strokeWidth={4} strokeLinejoin="round" />;
    case 'open':
    case 'shout':
      return (
        <g>
          <path
            d={`M ${x - (shape === 'shout' ? 14 : 10)} ${y} Q ${x} ${y - 6} ${x + (shape === 'shout' ? 14 : 10)} ${y} Q ${x + 8} ${y + (shape === 'shout' ? 22 : 14)} ${x} ${y + (shape === 'shout' ? 22 : 14)} Q ${x - 8} ${y + (shape === 'shout' ? 22 : 14)} ${x - (shape === 'shout' ? 14 : 10)} ${y} Z`}
            fill="#3a1520"
            stroke={INK}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <ellipse cx={x} cy={y + (shape === 'shout' ? 16 : 10)} rx={5} ry={3} fill="#ff8fa3" />
        </g>
      );
    case 'pant':
      return (
        <g>
          <path d={`M ${x - 10} ${y} Q ${x} ${y + 14} ${x + 10} ${y} Z`} fill="#3a1520" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d={`M ${x - 4} ${y + 6} Q ${x} ${y + 18} ${x + 5} ${y + 6}`} fill="#ff8fa3" stroke={INK} strokeWidth={2.5} />
        </g>
      );
    case 'frown':
      return <path d={`M ${x - 9} ${y + 5} Q ${x} ${y - 4} ${x + 9} ${y + 5}`} {...s} />;
    case 'flat':
      return <line x1={x - 7} y1={y + 1} x2={x + 7} y2={y + 1} {...s} />;
    default:
      return <path d={`M ${x - 6} ${y + 1} Q ${x} ${y + 4} ${x + 6} ${y + 1}`} {...s} />;
  }
};

const earRot = (ears: EarShape, side: -1 | 1) => (ears === 'flat' ? side * 70 : ears === 'droop' ? side * 34 : ears === 'perk' ? side * -4 : 0);

const HeldProp: React.FC<{kind: Holding; x: number; y: number}> = ({kind, x, y}) => {
  switch (kind) {
    case 'book':
      return (
        <g transform={`translate(${x} ${y}) rotate(-8)`}>
          <rect x={-26} y={-22} width={52} height={38} rx={3} fill="#c94f4f" stroke={INK} strokeWidth={4} />
          <rect x={-21} y={-17} width={42} height={30} fill="#fff8ea" stroke={INK} strokeWidth={2.5} />
          <line x1={0} y1={-17} x2={0} y2={13} stroke={INK} strokeWidth={2.5} />
        </g>
      );
    case 'earbud':
      return (
        <g transform={`translate(${x} ${y - 14})`}>
          <ellipse cx={0} cy={0} rx={8} ry={7} fill="#fff" stroke={INK} strokeWidth={3} />
          <rect x={-2.5} y={3} width={5} height={11} rx={2.5} fill="#fff" stroke={INK} strokeWidth={2.5} />
        </g>
      );
    case 'cane':
      return (
        <g>
          <path d={`M ${x} ${y} L ${x + 4} ${y + 160} M ${x} ${y} Q ${x - 2} ${y - 22} ${x - 20} ${y - 16}`} stroke={INK} strokeWidth={12} fill="none" strokeLinecap="round" />
          <path d={`M ${x} ${y} L ${x + 4} ${y + 160} M ${x} ${y} Q ${x - 2} ${y - 22} ${x - 20} ${y - 16}`} stroke="#8b5a2b" strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
      );
    case 'phone':
      return <rect x={x - 9} y={y - 22} width={18} height={32} rx={4} fill="#c08ad8" stroke={INK} strokeWidth={4} />;
    case 'backpack':
      return (
        <g transform={`translate(${x} ${y + 8})`}>
          <rect x={-30} y={-6} width={60} height={70} rx={16} fill="#f5c26b" stroke={INK} strokeWidth={W} />
          <rect x={-19} y={24} width={38} height={24} rx={6} fill="#e2a94c" stroke={INK} strokeWidth={3} />
          <path d="M -14 -6 Q 0 -24 14 -6" stroke={INK} strokeWidth={4} fill="none" />
        </g>
      );
    default:
      return null;
  }
};

export const CatRig: React.FC<CatRigProps> = (props) => {
  const {smear = 0} = props;
  if (smear > 0.05) {
    const dir = props.facing ?? 1;
    const s = props.scale ?? 1;
    return (
      <g>
        {[3, 2, 1].map((k) => (
          <CatRigInner key={k} {...props} noWobble x={props.x - dir * k * 34 * smear * s * 1.4} opacity={(props.opacity ?? 1) * 0.14 * (4 - k)} smear={0} />
        ))}
        <g transform={`translate(${props.x} ${props.y}) scale(${1 + smear * 0.22} ${1 - smear * 0.06}) translate(${-props.x} ${-props.y})`}>
          <CatRigInner {...props} />
        </g>
        {[0, 1, 2, 3, 4].map((k) => {
          const yy = props.y - (40 + k * 70) * s;
          const len = (110 + ((k * 53) % 80)) * smear * s;
          return (
            <line key={`s${k}`} x1={props.x - dir * 50 * s} y1={yy} x2={props.x - dir * (50 * s + len)} y2={yy} stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.65} />
          );
        })}
      </g>
    );
  }
  return <CatRigInner {...props} />;
};

const CatRigInner: React.FC<CatRigProps> = ({
  look,
  x,
  y,
  scale = 1,
  facing = 1,
  pose = {},
  face = {},
  frame,
  seed = 'cat',
  holdingL = 'none',
  holdingR = 'none',
  earbud = false,
  opacity = 1,
  headphonesMode = 'on',
  borrowedCup = null,
  noWobble = false,
}) => {
  const {lean = 0, headTilt = 0, headTurn = 0, armL = 6, armR = 6, legL = 0, legR = 0, liftL = 0, liftR = 0, sit = false, squash = 1, tail = 0, strings = 0, hop = 0} = pose;
  const {eyes = 'normal', lookX = 0, lookY = 0, mouth = 'neutral', ears = 'up', blush = 0, redFace = 0, sweat = 0, tears = false, brow = 0} = face;

  const b = boil(frame, seed, 1.0);
  const bh = boil(frame, seed + 'h', 0.9);
  const {hip: hipY, shoulder: shoulderY, headCY} = rigHead(sit);
  const hs = (look.scaleHead ?? 1) * 1.4;
  const turn = headTurn * 14;
  const fid = `${seed}-${Math.round(x)}-${Math.round(y)}`;
  const di = drawingIndex(frame);
  const hrx = RIG.headRx;
  const hry = RIG.headRy;

  /* ---- legs: tapered, growing straight out of the body (no pants, no seams) ---- */
  const legShapes = sit
    ? [-1, 1].map((side) => ({
        d: taper([[side * 16, hipY - 4], [side * 22, hipY + 36], [side * 22, hipY + 72]], 30, 20),
        foot: footPath(side * 22, hipY + 76, 1),
      }))
    : [
        {side: -1, ang: legL, lift: liftL},
        {side: 1, ang: legR, lift: liftR},
      ].map(({side, ang, lift}) => {
        const hx = side * 15;
        const a = (ang * Math.PI) / 180;
        const len = -hipY - 6 - lift;
        const kx = hx + Math.sin(a) * len * 0.5 + (lift > 0 ? 16 : 0);
        const ky = hipY + Math.cos(a) * len * 0.5;
        const fx = hx + Math.sin(a) * len;
        const fy = hipY + Math.cos(a) * len;
        return {d: taper([[hx, hipY - 10], [kx, ky], [fx, fy - 4]], 34, 20), foot: footPath(fx, fy, 1)};
      });

  /* ---- tail ---- */
  const tailPts: [number, number][] = [[-20, hipY + 4], [-80, hipY + 6], [-78, hipY - 62], [-56, hipY - 112]];
  const tailD = taper(tailPts, 14, 9);
  const tailEl = (
    <g transform={`rotate(${tail - 8} -20 ${hipY + 4})`}>
      <clipPath id={`tail-${fid}`}>
        <path d={tailD} />
      </clipPath>
      <path d={tailD} fill={look.fur} />
      {look.tailTip ? <circle cx={-56} cy={hipY - 112} r={30} fill={look.tailTip} clipPath={`url(#tail-${fid})`} /> : null}
      <path d={tailD} fill="none" stroke={INK} strokeWidth={W} strokeLinejoin="round" />
    </g>
  );

  /* ---- arms: noodle arms with mitten hands (thumb bump) ---- */
  const sleeve = look.outfitKind === 'hoodie' || look.outfitKind === 'cardigan';
  const arm = (side: -1 | 1, ang: number, hold: Holding) => {
    const sx = side * 26;
    const sy = shoulderY + 10;
    const a = (ang * Math.PI) / 180;
    const len = 112;
    const ex = sx + side * Math.sin(a) * len;
    const ey = sy + Math.cos(a) * len;
    const mx = sx + side * Math.sin(a) * len * 0.5 + side * 6;
    const my = sy + Math.cos(a) * len * 0.5;
    const d = taper([[sx, sy], [mx, my], [ex, ey]], 17, 12);
    const handAng = (Math.atan2(ey - my, ex - mx) * 180) / Math.PI - 90;
    return (
      <g>
        <path d={d} fill={look.fur} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
        {sleeve ? <path d={taper([[sx, sy], [mx, my], [(mx + ex) / 2, (my + ey) / 2]], 26, 22)} fill={look.outfit} stroke={INK} strokeWidth={W} strokeLinejoin="round" /> : null}
        <g transform={`translate(${ex} ${ey}) rotate(${handAng})`}>
          {/* mitten: palm + thumb, drawn ink-then-fill so they read as one shape */}
          <ellipse cx={side * -9} cy={2} rx={6} ry={9} transform={`rotate(${side * 30} ${side * -9} 2)`} fill={INK} stroke={INK} strokeWidth={W * 2} />
          <ellipse cx={0} cy={8} rx={11} ry={14} fill={INK} stroke={INK} strokeWidth={W * 2} />
          <ellipse cx={side * -9} cy={2} rx={6} ry={9} transform={`rotate(${side * 30} ${side * -9} 2)`} fill={look.paw ?? look.fur} />
          <ellipse cx={0} cy={8} rx={11} ry={14} fill={look.paw ?? look.fur} />
          <path d={`M ${side * -3} ${14} L ${side * -3} ${20}`} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
          <path d={`M ${side * 4} ${14} L ${side * 4} ${21}`} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
        </g>
        <HeldProp kind={hold} x={ex + side * Math.sin(a) * 12} y={ey + Math.cos(a) * 12} />
      </g>
    );
  };

  /* ---- torso (long noodle body) ---- */
  const top = shoulderY - 6;
  const bodyPath = `M -24 ${top - 30} Q -26 ${top + 10} -32 ${top + 40} Q -40 ${hipY - 20} -32 ${hipY + 6} Q 0 ${hipY + 20} 32 ${hipY + 6} Q 40 ${hipY - 20} 32 ${top + 40} Q 26 ${top + 10} 24 ${top - 30} Z`;
  const outfit = (() => {
    const hem = hipY + 14;
    switch (look.outfitKind) {
      case 'hoodie':
        return (
          <g>
            <path
              d={`M -38 ${top + 2} Q -54 ${top + 60} -48 ${hem} Q 0 ${hem + 14} 48 ${hem} Q 54 ${top + 60} 38 ${top + 2} Q 0 ${top - 12} -38 ${top + 2} Z`}
              fill={look.outfit}
              stroke={INK}
              strokeWidth={W}
              strokeLinejoin="round"
            />
            <path d={`M -24 ${hem - 12} L -18 ${hem - 40} L 18 ${hem - 40} L 24 ${hem - 12} Z`} fill={look.outfitShade} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
            {[-1, 1].map((s) => (
              <g key={s} transform={`rotate(${strings} ${s * 9} ${top + 6})`}>
                <line x1={s * 9} y1={top + 6} x2={s * 10} y2={top + 42} stroke={INK} strokeWidth={6} strokeLinecap="round" />
                <line x1={s * 9} y1={top + 6} x2={s * 10} y2={top + 42} stroke="#f4f1ea" strokeWidth={2.5} strokeLinecap="round" />
              </g>
            ))}
          </g>
        );
      case 'cardigan':
        return (
          <g>
            <path
              d={`M -34 ${top + 2} Q -46 ${top + 60} -44 ${hem} L -6 ${hem + 6} L -2 ${top + 30} L 2 ${top + 30} L 6 ${hem + 6} L 44 ${hem} Q 46 ${top + 60} 34 ${top + 2} Q 0 ${top - 10} -34 ${top + 2} Z`}
              fill={look.outfit}
              stroke={INK}
              strokeWidth={W}
              strokeLinejoin="round"
            />
            {[0, 1].map((k) => (
              <circle key={k} cx={-10} cy={top + 46 + k * 26} r={3} fill={look.outfitShade} stroke={INK} strokeWidth={1.5} />
            ))}
          </g>
        );
      case 'tee':
        return <path d={`M -36 ${top + 2} Q -44 ${top + 50} -38 ${hem - 20} Q 0 ${hem - 8} 38 ${hem - 20} Q 44 ${top + 50} 36 ${top + 2} Q 0 ${top - 10} -36 ${top + 2} Z`} fill={look.outfit} stroke={INK} strokeWidth={W} strokeLinejoin="round" />;
      case 'shawl':
        return (
          <path d={`M -40 ${top + 2} Q 0 ${top + 70} 40 ${top + 2} Q 0 ${top - 12} -40 ${top + 2} Z`} fill={look.outfit} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
        );
      default:
        return null;
    }
  })();
  const accent = look.accent ? (
    <path d={`M -14 ${top + 4} Q 0 ${top + 12} 14 ${top + 4} L 6 ${top + 14} L 10 ${top + 60} L 0 ${top + 70} L -8 ${top + 60} L -4 ${top + 14} Z`} fill={look.accent} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
  ) : null;

  /* ---- head ---- */
  const hc = headCY;
  // round-ish head with jagged cheek fluff
  const headPath =
    `M ${-hrx + 4} ${hc - 6} Q ${-hrx + 2} ${hc - hry} 0 ${hc - hry - 2} Q ${hrx - 2} ${hc - hry} ${hrx - 4} ${hc - 6} ` +
    `L ${hrx + 10} ${hc + 6} L ${hrx - 2} ${hc + 12} L ${hrx + 6} ${hc + 24} L ${hrx - 10} ${hc + 28} ` +
    `Q ${hrx - 22} ${hc + hry} 0 ${hc + hry} Q ${-hrx + 22} ${hc + hry} ${-hrx + 10} ${hc + 28} ` +
    `L ${-hrx - 6} ${hc + 24} L ${-hrx + 2} ${hc + 12} L ${-hrx - 10} ${hc + 6} Z`;

  const earEl = (side: -1 | 1) => {
    const bx = side * 34 + turn * 0.3;
    const by = hc - hry + 14;
    const H = ears === 'perk' ? 98 : ears === 'flat' ? 60 : 80; // tall, expressive
    const outer = `M ${bx - side * 24} ${by + 6} Q ${bx + side * 0} ${by - H * 0.55} ${bx + side * 8} ${by - H} Q ${bx + side * 32} ${by - H * 0.45} ${bx + side * 30} ${by + 10} Z`;
    const inner = `M ${bx - side * 10} ${by} Q ${bx + side * 4} ${by - H * 0.45} ${bx + side * 8} ${by - H * 0.72} Q ${bx + side * 20} ${by - H * 0.32} ${bx + side * 18} ${by + 2} Z`;
    const clipId = `ear-${fid}-${side}`;
    const twitch = ears === 'perk' ? Math.sin(frame * 1.7 + side) * 3 : 0;
    return (
      <g transform={`translate(${ears === 'flat' ? side * -6 : 0} ${ears === 'flat' ? 30 : ears === 'droop' ? 10 : 0}) rotate(${earRot(ears, side) + twitch} ${bx + side * 26} ${by + 8})`}>
        <clipPath id={clipId}>
          <path d={outer} />
        </clipPath>
        <path d={outer} fill={look.fur} />
        {look.earTip ? <circle cx={bx + side * 8} cy={by - H} r={H * 0.3} fill={look.earTip} clipPath={`url(#${clipId})`} /> : null}
        <path d={inner} fill={redFace > 0.3 ? '#ff7a7a' : look.innerEar} />
        <path d={outer} fill="none" stroke={INK} strokeWidth={W} strokeLinejoin="round" />
      </g>
    );
  };

  const eyeY = hc + 2;
  const eyeDX = 21;

  const headphoneEl = (() => {
    if (!look.headphones || headphonesMode === 'off') return null;
    if (headphonesMode === 'neck') {
      return (
        <g>
          <path d={`M -44 ${top - 8} Q 0 ${top + 22} 44 ${top - 8}`} stroke={INK} strokeWidth={10} fill="none" />
          <rect x={-58} y={top - 26} width={22} height={34} rx={9} fill={look.headphones} stroke={INK} strokeWidth={W} />
          <rect x={36} y={top - 26} width={22} height={34} rx={9} fill={look.headphones} stroke={INK} strokeWidth={W} />
        </g>
      );
    }
    const one = headphonesMode === 'one-side';
    const band = `M -62 ${hc - 2} Q -62 ${hc - 88} 0 ${hc - 88} Q 62 ${hc - 88} ${one ? 58 : 62} ${hc - (one ? 34 : 2)}`;
    return (
      <g>
        <path d={band} stroke={INK} strokeWidth={13} fill="none" strokeLinecap="round" />
        <path d={band} stroke={look.headphones} strokeWidth={5} fill="none" strokeLinecap="round" />
        <rect x={-76} y={hc - 24} width={24} height={44} rx={10} fill={look.headphones} stroke={INK} strokeWidth={W} />
        {one ? null : <rect x={52} y={hc - 24} width={24} height={44} rx={10} fill={look.headphones} stroke={INK} strokeWidth={W} />}
      </g>
    );
  })();

  const markings = (() => {
    switch (look.markings) {
      case 'tabby':
        return (
          <g stroke={look.furShade} strokeWidth={6} strokeLinecap="round" fill="none">
            <path d={`M ${-12 + turn * 0.6} ${hc - hry + 2} L ${-9 + turn * 0.6} ${hc - hry + 18}`} />
            <path d={`M ${turn * 0.6} ${hc - hry} L ${turn * 0.6} ${hc - hry + 20}`} />
            <path d={`M ${12 + turn * 0.6} ${hc - hry + 2} L ${9 + turn * 0.6} ${hc - hry + 18}`} />
          </g>
        );
      case 'calico':
        return (
          <g>
            <path d={`M ${-hrx} ${hc - 4} Q ${-hrx + 4} ${hc - hry} ${-16} ${hc - hry - 2} Q ${-8 + turn} ${hc - 24} ${-34 + turn} ${hc - 14} Q ${-50} ${hc + 2} ${-hrx} ${hc - 4} Z`} fill={look.patchA} />
            <path d={`M ${hrx} ${hc - 8} Q ${hrx - 6} ${hc - hry} ${26} ${hc - hry - 2} Q ${20 + turn} ${hc - 34} ${40 + turn} ${hc - 22} Q ${52} ${hc - 14} ${hrx} ${hc - 8} Z`} fill={look.patchB} />
          </g>
        );
      default:
        return null;
    }
  })();

  const browEl =
    brow !== 0 ? (
      <g stroke={INK} strokeWidth={4} strokeLinecap="round">
        <line x1={-36 + turn} y1={eyeY - 28 - brow * 5} x2={-12 + turn} y2={eyeY - 28 + brow * 6} />
        <line x1={36 + turn} y1={eyeY - 28 - brow * 5} x2={12 + turn} y2={eyeY - 28 + brow * 6} />
      </g>
    ) : null;

  const sweatDrops = Array.from({length: Math.min(3, Math.round(sweat))}).map((_, k) => {
    const sx = (k % 2 === 0 ? 1 : -1) * (hrx + 4 - k * 4);
    const sy = hc - 34 + k * 20;
    return (
      <path
        key={k}
        d={`M ${sx} ${sy} Q ${sx + 9} ${sy + 17} ${sx} ${sy + 22} Q ${sx - 9} ${sy + 17} ${sx} ${sy} Z`}
        fill="#9fdcff"
        stroke={INK}
        strokeWidth={3}
        transform={`translate(${b.x * 1.5} ${b.y * 1.5 + (frame % 10) * 0.5})`}
      />
    );
  });

  const wobbleId = `wob-${fid}`;
  return (
    <g opacity={opacity} transform={`translate(${x} ${y + hop * scale}) scale(${scale * facing} ${scale}) scale(${1 / Math.sqrt(squash)} ${squash})`}>
      <defs>
        <radialGradient id={`red-${fid}`} cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#ff2a4a" stopOpacity={0.95} />
          <stop offset="70%" stopColor="#ff5c6c" stopOpacity={0.75} />
          <stop offset="100%" stopColor="#ff8a8a" stopOpacity={0.25} />
        </radialGradient>
        {noWobble ? null : (
          <filter id={wobbleId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency={0.035 / Math.max(0.3, scale)} numOctaves={1} seed={di % 50} />
            <feDisplacementMap in="SourceGraphic" scale={3.2 * Math.max(0.5, scale)} />
          </filter>
        )}
        <clipPath id={`clip-${fid}`}>
          <path d={headPath} />
        </clipPath>
      </defs>
      <ellipse cx={0} cy={2} rx={48} ry={8} fill="#000" opacity={sit ? 0 : 0.12} />
      <g transform={`translate(${b.x} ${b.y})`} filter={noWobble ? undefined : `url(#${wobbleId})`}>
        {tailEl}
        {look.backpack && holdingL !== 'backpack' && holdingR !== 'backpack' ? (
          <rect x={-46} y={shoulderY} width={92} height={96} rx={22} fill={look.backpack} stroke={INK} strokeWidth={W} transform={`rotate(${lean} 0 ${hipY})`} />
        ) : null}
        {/* silhouette: every outline first, then every fill → seamless one-piece body */}
        <g>
          {legShapes.map((l, i) => (
            <g key={`li${i}`} stroke={INK} strokeWidth={W * 2} strokeLinejoin="round" fill={INK}>
              <path d={l.d} />
              <path d={l.foot} />
            </g>
          ))}
          <path d={bodyPath} transform={`rotate(${lean} 0 ${hipY})`} fill={INK} stroke={INK} strokeWidth={W * 2} strokeLinejoin="round" />
          {legShapes.map((l, i) => (
            <g key={`lf${i}`} fill={look.markings === 'socks' ? '#ffffff' : (look.paw ?? look.fur)}>
              <path d={l.d} fill={look.fur} />
              <path d={l.foot} />
            </g>
          ))}
          <path d={bodyPath} transform={`rotate(${lean} 0 ${hipY})`} fill={look.fur} />
          {look.markings === 'calico' ? (
            <path d={`M 4 ${top + 30} Q 30 ${top + 34} 30 ${top + 70} Q 14 ${top + 80} 6 ${top + 62} Z`} transform={`rotate(${lean} 0 ${hipY})`} fill={look.patchA} />
          ) : null}
        </g>
        <g transform={`rotate(${lean} 0 ${hipY})`}>
          {outfit}
          {accent}
          {arm(-1, armL, holdingL)}
          {arm(1, armR, holdingR)}
          <g transform={`rotate(${headTilt} 0 ${top}) translate(${bh.x} ${bh.y}) translate(0 ${hc}) scale(${hs}) translate(0 ${-hc})`}>
            {look.outfitKind === 'hoodie' ? (
              <path d={`M -52 ${top - 4} Q 0 ${top + 22} 52 ${top - 4} Q 40 ${top - 30} 0 ${top - 28} Q -40 ${top - 30} -52 ${top - 4} Z`} fill={look.outfitShade} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
            ) : null}
            {earEl(-1)}
            {earEl(1)}
            <path d={headPath} fill={look.fur} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
            <g clipPath={`url(#clip-${fid})`}>
              {markings}
              {redFace > 0 ? <path d={headPath} fill={`url(#red-${fid})`} opacity={Math.min(1, redFace)} /> : null}
            </g>
            {look.cap ? (
              <g>
                <path d={`M -58 ${hc - 18} Q -54 ${hc - 68} 0 ${hc - 70} Q 54 ${hc - 68} 58 ${hc - 18} Z`} fill={look.cap} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
                <path d={`M 14 ${hc - 22} Q 76 ${hc - 28} 90 ${hc - 16} L 48 ${hc - 14} Z`} fill={look.cap} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
              </g>
            ) : null}
            {/* whiskers */}
            <g stroke={INK} strokeWidth={2.5} strokeLinecap="round" opacity={0.9}>
              <line x1={-hrx + 26} y1={eyeY + 24} x2={-hrx - 6} y2={eyeY + 20} />
              <line x1={-hrx + 26} y1={eyeY + 30} x2={-hrx - 4} y2={eyeY + 34} />
              <line x1={hrx - 26} y1={eyeY + 24} x2={hrx + 6} y2={eyeY + 20} />
              <line x1={hrx - 26} y1={eyeY + 30} x2={hrx + 4} y2={eyeY + 34} />
            </g>
            {blush > 0 ? (
              <g opacity={Math.min(1, blush)}>
                <ellipse cx={-34 + turn} cy={eyeY + 24} rx={14} ry={7} fill="#ff7b9c" opacity={0.7} />
                <ellipse cx={34 + turn} cy={eyeY + 24} rx={14} ry={7} fill="#ff7b9c" opacity={0.7} />
                <g stroke="#e0436a" strokeWidth={2.5} strokeLinecap="round">
                  {[-42, -34, -26, 26, 34, 42].map((bx) => (
                    <line key={bx} x1={bx + turn} y1={eyeY + 29} x2={bx + 5 + turn} y2={eyeY + 19} />
                  ))}
                </g>
              </g>
            ) : null}
            <Eye cx={-eyeDX + turn} cy={eyeY} shape={eyes} lookX={lookX} lookY={lookY} side={-1} lid={redFace > 0.4 ? '#ff7d86' : look.fur} />
            <Eye cx={eyeDX + turn} cy={eyeY} shape={eyes} lookX={lookX} lookY={lookY} side={1} lid={redFace > 0.4 ? '#ff7d86' : look.fur} />
            {browEl}
            {look.glasses ? (
              <g fill="none" stroke={INK} strokeWidth={4}>
                <circle cx={-eyeDX + turn} cy={eyeY} r={22} />
                <circle cx={eyeDX + turn} cy={eyeY} r={22} />
              </g>
            ) : null}
            <path d={`M ${-4 + turn} ${eyeY + 22} L ${4 + turn} ${eyeY + 22} L ${turn} ${eyeY + 27} Z`} fill="#ffa3b1" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <Mouth x={turn} y={eyeY + 31} shape={mouth} />
            {tears ? (
              <g fill="#9fdcff" stroke={INK} strokeWidth={2.5}>
                <path d={`M ${-24 + turn} ${eyeY + 20} q -5 20 0 28 q 5 -8 0 -28 Z`} />
                <path d={`M ${24 + turn} ${eyeY + 20} q -5 20 0 28 q 5 -8 0 -28 Z`} />
              </g>
            ) : null}
            {earbud ? (
              <g>
                <ellipse cx={hrx - 2} cy={hc + 2} rx={9} ry={7} fill="#fff" stroke={INK} strokeWidth={3.5} />
                <rect x={hrx - 5} y={hc + 6} width={6} height={13} rx={3} fill="#fff" stroke={INK} strokeWidth={2.5} />
              </g>
            ) : null}
            {headphoneEl}
            {borrowedCup ? <rect x={52} y={hc - 24} width={24} height={44} rx={10} fill={borrowedCup} stroke={INK} strokeWidth={W} /> : null}
            {sweatDrops}
          </g>
        </g>
      </g>
    </g>
  );
};
