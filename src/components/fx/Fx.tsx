import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {drawingIndex, noise} from '../../engine/time';

const INK = '#1d1a1f';

/** Anime speed lines. radial = focus lines toward a point; horizontal = travel streaks. */
export const SpeedLines: React.FC<{
  frame: number;
  mode?: 'radial' | 'horizontal';
  intensity?: number;
  cx?: number;
  cy?: number;
  color?: string;
  inner?: number;
  dir?: 1 | -1;
}> = ({frame, mode = 'radial', intensity = 1, cx = 960, cy = 540, color = INK, inner = 380, dir = 1}) => {
  if (intensity <= 0.01) return null;
  const d = drawingIndex(frame);
  const n = Math.round(70 * intensity);
  if (mode === 'horizontal') {
    return (
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: n}).map((_, i) => {
          const y = random(`hl-y-${i}-${d}`) * 1080;
          const len = 200 + random(`hl-l-${i}-${d}`) * 700;
          const x = random(`hl-x-${i}-${d}`) * 2400 - 300;
          return (
            <line
              key={i}
              x1={x}
              y1={y}
              x2={x + len * dir}
              y2={y}
              stroke={color}
              strokeWidth={1 + random(`hl-w-${i}-${d}`) * 4}
              opacity={0.35 + 0.4 * random(`hl-o-${i}`)}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    );
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      {Array.from({length: n}).map((_, i) => {
        const a = random(`rl-a-${i}-${d}`) * Math.PI * 2;
        const r0 = inner + random(`rl-r-${i}-${d}`) * 200;
        const w = 2 + random(`rl-w-${i}-${d}`) * 10;
        const r1 = 1500;
        const p = (r: number, off: number) => `${cx + Math.cos(a + off) * r} ${cy + Math.sin(a + off) * r}`;
        const dw = w / r1;
        return <path key={i} d={`M ${p(r0, 0)} L ${p(r1, dw)} L ${p(r1, -dw)} Z`} fill={color} opacity={0.85} />;
      })}
    </svg>
  );
};

/** Twinkling 4-point sparkles. */
export const Sparkles: React.FC<{frame: number; count?: number; area?: [number, number, number, number]; color?: string; seed?: string; amount?: number}> = ({
  frame,
  count = 18,
  area = [0, 0, 1920, 1080],
  color = '#fff6b0',
  seed = 'sp',
  amount = 1,
}) => {
  if (amount <= 0) return null;
  const d = drawingIndex(frame);
  return (
    <g opacity={amount}>
      {Array.from({length: count}).map((_, i) => {
        const x = area[0] + random(`${seed}x${i}`) * area[2];
        const y = area[1] + random(`${seed}y${i}`) * area[3];
        const ph = (d + Math.floor(random(`${seed}p${i}`) * 8)) % 8;
        const s = [0.2, 0.6, 1, 0.8, 0.5, 0.2, 0, 0][ph] * (14 + random(`${seed}s${i}`) * 22);
        if (s <= 0.5) return null;
        return (
          <path
            key={i}
            d={`M ${x} ${y - s} Q ${x} ${y} ${x + s} ${y} Q ${x} ${y} ${x} ${y + s} Q ${x} ${y} ${x - s} ${y} Q ${x} ${y} ${x} ${y - s} Z`}
            fill={color}
            stroke={INK}
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
};

export const Heart: React.FC<{x: number; y: number; s?: number; color?: string; rot?: number; opacity?: number}> = ({
  x,
  y,
  s = 1,
  color = '#ff5d8f',
  rot = 0,
  opacity = 1,
}) => (
  <path
    transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}
    d="M 0 18 C -34 -4 -18 -30 0 -12 C 18 -30 34 -4 0 18 Z"
    fill={color}
    stroke={INK}
    strokeWidth={4 / s}
    opacity={opacity}
  />
);

/** Floating hearts rising from a point. */
export const HeartStream: React.FC<{frame: number; x: number; y: number; start: number; count?: number; spread?: number}> = ({
  frame,
  x,
  y,
  start,
  count = 8,
  spread = 160,
}) => (
  <g>
    {Array.from({length: count}).map((_, i) => {
      const born = start + i * 9;
      const t = (frame - born) / 60;
      if (t < 0 || t > 1) return null;
      const hx = x + noise(`hs${i}`) * spread + Math.sin(t * 6 + i) * 18;
      const hy = y - t * 260;
      return <Heart key={i} x={hx} y={hy} s={0.7 + random(`hss${i}`) * 0.7} opacity={1 - t * t} rot={noise(`hr${i}`) * 20} />;
    })}
  </g>
);

/** Circling cartoon stars after a bonk. */
export const DizzyStars: React.FC<{frame: number; x: number; y: number; r?: number; amount?: number}> = ({frame, x, y, r = 80, amount = 1}) => {
  if (amount <= 0) return null;
  return (
    <g opacity={amount}>
      {[0, 1, 2, 3].map((i) => {
        const a = (Math.floor(frame / 2.5) * 0.5 + (i * Math.PI) / 2) % (Math.PI * 2);
        const sx = x + Math.cos(a) * r;
        const sy = y + Math.sin(a) * r * 0.32;
        const pts = Array.from({length: 10})
          .map((_, k) => {
            const rr = k % 2 === 0 ? 20 : 8;
            const aa = (k * Math.PI) / 5 - Math.PI / 2;
            return `${sx + Math.cos(aa) * rr},${sy + Math.sin(aa) * rr}`;
          })
          .join(' ');
        return <polygon key={i} points={pts} fill="#ffd84a" stroke={INK} strokeWidth={3} />;
      })}
    </g>
  );
};

/** Steam puffs (overheating embarrassment). */
export const Steam: React.FC<{frame: number; x: number; y: number; amount?: number}> = ({frame, x, y, amount = 1}) => {
  if (amount <= 0) return null;
  return (
    <g opacity={amount}>
      {[0, 1, 2, 3].map((i) => {
        const t = ((frame + i * 11) % 44) / 44;
        const px = x + (i % 2 ? 1 : -1) * (40 + t * 60);
        const py = y - t * 120;
        const r = 14 + t * 26;
        return <circle key={i} cx={px} cy={py} r={r} fill="#ffffff" stroke={INK} strokeWidth={3} opacity={1 - t} />;
      })}
    </g>
  );
};

/** Anime impact frame: full-screen inverted burst for 2-3 frames. */
export const ImpactFrame: React.FC<{frame: number; at: number; cx?: number; cy?: number}> = ({frame, at, cx = 960, cy = 540}) => {
  const t = frame - at;
  if (t < 0 || t > 3) return null;
  const inverted = t < 2;
  return (
    <AbsoluteFill style={{background: inverted ? '#111' : '#fff', mixBlendMode: inverted ? 'difference' : 'normal', opacity: inverted ? 1 : 0.7}}>
      <svg width={1920} height={1080}>
        {Array.from({length: 26}).map((_, i) => {
          const a = (i / 26) * Math.PI * 2 + noise(`imp${i}`) * 0.1;
          const r0 = 60 + random(`imr${i}`) * 80;
          return (
            <path
              key={i}
              d={`M ${cx + Math.cos(a) * r0} ${cy + Math.sin(a) * r0} L ${cx + Math.cos(a + 0.05) * 1500} ${cy + Math.sin(a + 0.05) * 1500} L ${cx + Math.cos(a - 0.05) * 1500} ${cy + Math.sin(a - 0.05) * 1500} Z`}
              fill={inverted ? '#fff' : '#111'}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** 16mm film grain + flicker + scratches (HTML overlay). */
export const FilmGrain: React.FC<{frame: number; amount?: number; scratches?: boolean; id?: string}> = ({
  frame,
  amount = 0.35,
  scratches = true,
  id = 'grain',
}) => {
  const seed = Math.floor(frame) % 97;
  const fid = `${id}-${seed}`;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={1920} height={1080}>
        <filter id={fid} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues={`0 ${amount}`} />
          </feComponentTransfer>
        </filter>
        <rect width={1920} height={1080} filter={`url(#${fid})`} style={{mixBlendMode: 'overlay'}} />
        {scratches
          ? [0, 1].map((i) =>
              random(`scr${i}-${seed}`) > 0.55 ? (
                <line
                  key={i}
                  x1={random(`scx${i}-${seed}`) * 1920}
                  y1={0}
                  x2={random(`scx${i}-${seed}`) * 1920 + noise(`scd${i}-${seed}`) * 20}
                  y2={1080}
                  stroke={random(`scc${i}-${seed}`) > 0.5 ? '#fff' : '#000'}
                  strokeWidth={1 + random(`scw${i}`) * 1.5}
                  opacity={0.5}
                />
              ) : null,
            )
          : null}
        {random(`dust-${seed}`) > 0.6 ? (
          <circle cx={random(`dx-${seed}`) * 1920} cy={random(`dy-${seed}`) * 1080} r={2 + random(`dr-${seed}`) * 5} fill="#000" opacity={0.6} />
        ) : null}
      </svg>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
          opacity: 0.9 + noise(`flk-${seed}`) * 0.1,
        }}
      />
    </AbsoluteFill>
  );
};

/** Letterbox bars for "cinematic" beats. */
export const Letterbox: React.FC<{amount: number}> = ({amount}) =>
  amount <= 0 ? null : (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 120 * amount, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 * amount, background: '#000'}} />
    </AbsoluteFill>
  );

/** Hand-lettered title card text (no dialogue — titles only). */
export const TitleText: React.FC<{text: string; sub?: string; opacity: number; y?: number; frame: number}> = ({text, sub, opacity, y = 0, frame}) => {
  const d = drawingIndex(frame);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity, transform: `translateY(${y}px)`}}>
      <div
        style={{
          fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif',
          fontSize: 92,
          fontWeight: 900,
          color: '#fffaf0',
          WebkitTextStroke: '10px #1d1a1f',
          paintOrder: 'stroke fill',
          transform: `rotate(${noise(`tt${d}`) * 0.6}deg) translate(${noise(`tx${d}`) * 1.5}px, ${noise(`ty${d}`) * 1.5}px)`,
          textAlign: 'center',
          letterSpacing: 2,
          lineHeight: 1.05,
        }}
      >
        {text}
      </div>
      {sub ? (
        <div
          style={{
            marginTop: 18,
            fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
            fontSize: 40,
            fontWeight: 800,
            color: '#ffd166',
            WebkitTextStroke: '6px #1d1a1f',
            paintOrder: 'stroke fill',
          }}
        >
          {sub}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Scalloped thought cloud; children are clipped inside it. */
export const ThoughtCloud: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  frame: number;
  scale?: number;
  trail?: [number, number];
  id?: string;
  children?: React.ReactNode;
}> = ({cx, cy, rx, ry, frame, scale = 1, trail, id = 'tc', children}) => {
  const n = 14;
  const d = drawingIndex(frame);
  const pts = Array.from({length: n}).map((_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as const;
  });
  let path = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    const mx = (p[0] + q[0]) / 2;
    const my = (p[1] + q[1]) / 2;
    const ox = (mx - cx) * 0.32 + noise(`tcb${i}-${d}`) * 3;
    const oy = (my - cy) * 0.32 + noise(`tcc${i}-${d}`) * 3;
    path += ` Q ${mx + ox} ${my + oy} ${q[0]} ${q[1]}`;
  }
  path += ' Z';
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`}>
      {trail
        ? [0, 1, 2].map((k) => {
            const t = (k + 1) / 4;
            const x = trail[0] + (cx - rx * 0.6 - trail[0]) * t;
            const y = trail[1] + (cy + ry * 0.7 - trail[1]) * t;
            return <ellipse key={k} cx={x} cy={y} rx={10 + k * 9} ry={8 + k * 7} fill="#fff" stroke={INK} strokeWidth={5} />;
          })
        : null}
      <clipPath id={`clip-${id}`}>
        <path d={path} />
      </clipPath>
      <path d={path} fill="#fff" />
      <g clipPath={`url(#clip-${id})`}>{children}</g>
      <path d={path} fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    </g>
  );
};

export const MusicNote: React.FC<{x: number; y: number; s?: number; opacity?: number; color?: string}> = ({x, y, s = 1, opacity = 1, color = '#7a5cc4'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
    <path d="M 0 0 L 0 -42 L 26 -50 L 26 -8" fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M 0 0 L 0 -42 L 26 -50 L 26 -8" fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" />
    <ellipse cx={-8} cy={2} rx={11} ry={8} fill={color} stroke={INK} strokeWidth={4} transform="rotate(-20 -8 2)" />
    <ellipse cx={18} cy={-6} rx={11} ry={8} fill={color} stroke={INK} strokeWidth={4} transform="rotate(-20 18 -6)" />
  </g>
);

/** Overthinking icons orbiting the head: ring, house, baby bottle, clock, bills. */
export const PanicOrbit: React.FC<{frame: number; x: number; y: number; r: number; amount?: number}> = ({frame, x, y, r, amount = 1}) => {
  if (amount <= 0) return null;
  const icons = [
    // ring
    (k: string) => (
      <g key={k}>
        <circle r={22} fill="none" stroke={INK} strokeWidth={10} />
        <circle r={22} fill="none" stroke="#f2c230" strokeWidth={5} />
        <path d="M -10 -28 L 0 -44 L 10 -28 Z" fill="#bfe8ff" stroke={INK} strokeWidth={4} />
      </g>
    ),
    // house
    (k: string) => (
      <g key={k}>
        <rect x={-24} y={-8} width={48} height={36} fill="#f6d36b" stroke={INK} strokeWidth={5} />
        <path d="M -32 -6 L 0 -34 L 32 -6 Z" fill="#c86a5a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <rect x={-6} y={8} width={12} height={20} fill="#8b5a3c" stroke={INK} strokeWidth={3} />
      </g>
    ),
    // baby bottle
    (k: string) => (
      <g key={k}>
        <rect x={-14} y={-14} width={28} height={44} rx={8} fill="#fff" stroke={INK} strokeWidth={5} />
        <rect x={-10} y={-26} width={20} height={12} fill="#9ec9f0" stroke={INK} strokeWidth={4} />
        <path d="M -6 -26 Q 0 -44 6 -26 Z" fill="#f4a7b9" stroke={INK} strokeWidth={4} />
      </g>
    ),
    // clock
    (k: string) => (
      <g key={k}>
        <circle r={26} fill="#fff" stroke={INK} strokeWidth={6} />
        <line x1={0} y1={0} x2={0} y2={-16} stroke={INK} strokeWidth={5} strokeLinecap="round" transform={`rotate(${frame * 24})`} />
        <line x1={0} y1={0} x2={12} y2={0} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      </g>
    ),
    // wedding bells / heart
    (k: string) => <Heart key={k} x={0} y={0} s={1.3} />,
    // bills
    (k: string) => (
      <g key={k}>
        <rect x={-26} y={-16} width={52} height={32} rx={4} fill="#b8e0a0" stroke={INK} strokeWidth={5} />
        <circle r={9} fill="none" stroke={INK} strokeWidth={4} />
      </g>
    ),
  ];
  const d = drawingIndex(frame);
  return (
    <g opacity={amount}>
      {icons.map((ic, i) => {
        const a = d * 0.28 + (i / icons.length) * Math.PI * 2;
        const ix = x + Math.cos(a) * r;
        const iy = y + Math.sin(a) * r * 0.45;
        return (
          <g key={i} transform={`translate(${ix} ${iy}) scale(${0.9 + Math.sin(a) * 0.25}) rotate(${noise(`po${i}-${d}`) * 10})`}>
            {ic(`i${i}`)}
          </g>
        );
      })}
    </g>
  );
};
