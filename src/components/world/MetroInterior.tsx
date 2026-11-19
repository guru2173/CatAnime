import React from 'react';
import {random} from 'remotion';
import {Box, Building, Commuter, Cyl, Plane, Tree, useSignTexture, useTileTexture} from './primitives';

/**
 * Sunlit morning metro car interior.
 * Axes: x along the car, z across (far wall z=-2 holds the bench + windows), y up (floor 0, ceiling 2.5).
 */

export const SEAT_XS = [-2.4, -1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8, 2.4];
export const SEAT_Y = 0.46;
export const SEAT_Z = -1.62;
export const DOOR_XS = [-3.65, 3.65];
export const POLE = {x: -0.42, z: -1.02};

export type MetroInteriorProps = {
  frame: number;
  /** World units per frame the city scrolls past (0 = stopped). */
  speed?: number;
  /** Cumulative scroll distance (overrides speed*frame when provided). */
  travel?: number;
  /** 0 closed … 1 open */
  doorsOpen?: number;
  outside?: 'city' | 'station';
  stationName?: string;
  /** Seat indices that are empty (no commuter). */
  emptySeats?: number[];
  /** Seats holding a backpack instead of a commuter. */
  bagSeats?: number[];
  /** Sway amplitude (radians) */
  sway?: number;
  /** Render low-poly 3D commuters (default off: 2D flat crowd is drawn by the scene). */
  crowd3d?: boolean;
};

const CityOutside: React.FC<{travel: number}> = ({travel}) => {
  const LOOP = 140;
  const wrap = (x: number) => ((((x - travel) % LOOP) + LOOP) % LOOP) - LOOP / 2;
  const buildings = Array.from({length: 26}).map((_, i) => {
    const seed = `bld-${i}`;
    const z = -14 - random(seed + 'z') * 26;
    const w = 4 + random(seed + 'w') * 6;
    const h = 8 + random(seed + 'h') * 24;
    return {x0: (i / 26) * LOOP, z, w, h, d: 4 + random(seed + 'd') * 5, seed};
  });
  // far layer moves slower (parallax)
  const farWrap = (x: number) => ((((x - travel * 0.35) % LOOP) + LOOP) % LOOP) - LOOP / 2;
  return (
    <group>
      <Plane p={[0, -8, -40]} s={[400, 120]} c="#b9c9a0" />
      <Plane p={[0, -7.95, -6]} s={[400, 6]} c="#9a9a9a" />
      {buildings.map((b) => (
        <Building key={b.seed} p={[wrap(b.x0), -8, b.z]} s={[b.w, b.h, b.d]} seed={b.seed} />
      ))}
      {Array.from({length: 14}).map((_, i) => (
        <Building key={`far-${i}`} p={[farWrap((i / 14) * LOOP), -8, -70 - random(`far${i}`) * 20]} s={[9, 20 + random(`fh${i}`) * 30, 8]} seed={`far-${i}`} />
      ))}
      {Array.from({length: 10}).map((_, i) => (
        <Tree key={`tr-${i}`} p={[wrap((i / 10) * LOOP + 5), -8, -10 - random(`trz${i}`) * 3]} h={4} seed={`tr${i}`} />
      ))}
      {/* catenary masts whipping past */}
      {Array.from({length: 8}).map((_, i) => {
        const x = ((((i * 16 - travel * 1.6) % 128) + 128) % 128) - 64;
        return (
          <group key={`mast-${i}`}>
            <Box p={[x, -2, -3.4]} s={[0.25, 12, 0.25]} c="#6d7680" />
            <Box p={[x, 3.5, -3.0]} s={[0.15, 0.15, 1.2]} c="#6d7680" />
          </group>
        );
      })}
    </group>
  );
};

const StationOutside: React.FC<{name: string}> = ({name}) => {
  const tile = useTileTexture('#f4efe4', '#cfc6b5', [24, 3], 4);
  const floor = useTileTexture('#d9d4cb', '#b8b0a3', [30, 3], 4);
  const sign = useSignTexture(name, '#2f5e8f', '#ffffff', 512, 128, 'bold 58px sans-serif');
  return (
    <group>
      <Plane p={[0, 0, -4.5]} s={[60, 5]} map={floor} />
      <Box p={[0, 0.06, -2.35]} s={[60, 0.02, 0.18]} c="#f2c230" />
      <Plane p={[0, 2.5, -7]} s={[60, 5]} r={[0, 0, 0]} map={tile} />
      <Plane p={[0, 4.2, -4.5]} s={[60, 5]} r={[Math.PI / 2, 0, 0]} c="#e4e0d6" />
      {[-9, -3, 3, 9].map((x) => (
        <Box key={x} p={[x, 2, -5.2]} s={[0.5, 4, 0.5]} c="#c9c2b4" />
      ))}
      <Plane p={[0, 2.6, -6.95]} s={[3.2, 0.8]} r={[0, 0, 0]} map={sign} emissive="#1a2a40" />
      <Plane p={[-6, 2.6, -6.95]} s={[2.4, 0.6]} r={[0, 0, 0]} map={sign} emissive="#1a2a40" />
      <Plane p={[6, 2.6, -6.95]} s={[2.4, 0.6]} r={[0, 0, 0]} map={sign} emissive="#1a2a40" />
      {[-6, 0, 6].map((x) => (
        <Box key={`l${x}`} p={[x, 4.1, -4.5]} s={[3, 0.06, 0.25]} c="#fffef5" emissive="#bdb8a8" />
      ))}
    </group>
  );
};

const AD_TEXTS = [
  {t: 'MEOW FM 88.1', bg: '#ffb84d', fg: '#3a2a10'},
  {t: 'CAT CAFÉ ☕', bg: '#7fcfc0', fg: '#14332d'},
  {t: 'NAP MORE.', bg: '#c6b3f0', fg: '#2a1d4a'},
  {t: 'FISH MARKET', bg: '#f49ab0', fg: '#40121f'},
];

const Ad: React.FC<{x: number; i: number}> = ({x, i}) => {
  const a = AD_TEXTS[i % AD_TEXTS.length];
  const tex = useSignTexture(a.t, a.bg, a.fg, 512, 160, 'bold 62px sans-serif');
  return <Plane p={[x, 2.2, -1.96]} s={[1.3, 0.38]} r={[0, 0, 0]} map={tex} emissive="#222" />;
};

export const MetroInterior: React.FC<MetroInteriorProps> = ({
  frame,
  speed = 0,
  travel,
  doorsOpen = 0,
  outside = 'city',
  stationName = 'KOMOREBI',
  emptySeats = [4],
  bagSeats = [],
  sway = 0,
  crowd3d = false,
}) => {
  const floorTex = useTileTexture('#f3f1ec', '#c9c3b8', [24, 4], 4);
  const display = useSignTexture('8:15  ▸  NEXT: SAKURA-DORI', '#141820', '#ffb347', 1024, 96, 'bold 52px monospace');
  const tr = travel ?? speed * frame;
  const moving = speed > 0 || (travel !== undefined && travel > 0);
  const swayRot = sway * Math.sin(frame / 22);

  // far wall pieces: lower panel, upper panel, window pillars, skipping door gaps
  const wallC = '#f2c99f';
  const trim = '#e0b386';
  const pillarXs: number[] = [];
  for (let x = -10; x <= 10; x += 1.55) {
    if (DOOR_XS.some((d) => Math.abs(x - d) < 0.9)) continue;
    pillarXs.push(x);
  }

  const doorLeaf = (cx: number, side: -1 | 1) => {
    const off = doorsOpen * 0.62 * side;
    return (
      <group key={`${cx}-${side}`} position={[cx + side * 0.33 + off, 1.05, -2.0]}>
        <Box p={[0, 0, 0]} s={[0.64, 2.1, 0.06]} c="#d8dde2" />
        <Box p={[0, 0.35, 0.035]} s={[0.4, 0.9, 0.02]} c="#9fc4e6" opacity={0.55} />
        <Box p={[-side * 0.31, 0, 0.04]} s={[0.03, 2.1, 0.03]} c="#333" />
      </group>
    );
  };

  return (
    <group rotation={[0, 0, swayRot]}>
      {/* floor + ceiling */}
      <Plane p={[0, 0, 0]} s={[24, 4.2]} map={floorTex} />
      <Box p={[0, 0.01, -1.15]} s={[24, 0.01, 0.06]} c="#e9c46a" />
      <Box p={[0, 0.01, 1.15]} s={[24, 0.01, 0.06]} c="#e9c46a" />
      <Plane p={[0, 2.55, 0]} s={[24, 4.2]} r={[Math.PI / 2, 0, 0]} c="#f7ead8" />
      {[-1, 1].map((s) => (
        <Box key={`light${s}`} p={[0, 2.5, s * 0.75]} s={[22, 0.05, 0.28]} c="#fffef4" emissive="#e8e2c8" />
      ))}
      {/* far wall */}
      <Box p={[0, 0.48, -2.02]} s={[24, 0.96, 0.08]} c={wallC} />
      <Box p={[0, 2.25, -2.02]} s={[24, 0.6, 0.08]} c={wallC} />
      <Box p={[0, 0.98, -1.98]} s={[24, 0.06, 0.08]} c={trim} />
      {pillarXs.map((x) => (
        <Box key={`p${x}`} p={[x, 1.45, -2.02]} s={[0.32, 1.0, 0.1]} c={wallC} />
      ))}
      {/* door frames + leaves */}
      {DOOR_XS.map((dx) => (
        <group key={`door${dx}`}>
          <Box p={[dx - 0.72, 1.1, -2.0]} s={[0.12, 2.2, 0.14]} c="#c9ced4" />
          <Box p={[dx + 0.72, 1.1, -2.0]} s={[0.12, 2.2, 0.14]} c="#c9ced4" />
          <Box p={[dx, 2.16, -2.0]} s={[1.56, 0.12, 0.14]} c="#c9ced4" />
          {doorLeaf(dx, -1)}
          {doorLeaf(dx, 1)}
          <Box p={[dx, 2.33, -1.94]} s={[0.5, 0.12, 0.04]} c="#222" emissive={doorsOpen > 0 && doorsOpen < 1 ? '#ff3b30' : '#331111'} />
        </group>
      ))}
      {[-6.5, -5.1, 5.1, 6.5, -8.0, 8.0].map((x, i) => (
        <Ad key={`ad${i}`} x={x} i={i} />
      ))}
      <Plane p={[0, 2.2, -1.96]} s={[2.6, 0.24]} r={[0, 0, 0]} map={display} emissive="#2a1a00" />
      {/* bench */}
      <Box p={[0, 0.2, -1.62]} s={[5.6, 0.4, 0.5]} c="#d9a77a" />
      {SEAT_XS.map((x) => (
        <group key={`seat${x}`}>
          <Box p={[x, 0.43, -1.62]} s={[0.56, 0.1, 0.52]} c="#8db4dc" />
          <Box p={[x, 0.72, -1.9]} s={[0.56, 0.5, 0.1]} c="#8db4dc" />
        </group>
      ))}
      {[-2.75, 2.75].map((x) => (
        <Box key={`arm${x}`} p={[x, 0.75, -1.6]} s={[0.06, 0.6, 0.5]} c="#c0c6cc" />
      ))}
      {SEAT_XS.map((x, i) =>
        emptySeats.includes(i) ? null : bagSeats.includes(i) ? (
          <group key={`bag${i}`} position={[x, 0.48, -1.6]}>
            <Box p={[0, 0.22, 0]} s={[0.38, 0.44, 0.24]} c="#f5c26b" />
            <Box p={[0, 0.12, 0.13]} s={[0.26, 0.18, 0.04]} c="#e2a94c" />
          </group>
        ) : !crowd3d ? null : (
          <Commuter key={`c${i}`} p={[x, 0, -1.55]} seed={`commuter-${i}`} sitting nod={moving ? Math.sin(frame / 18 + i) * 0.05 : 0} />
        ),
      )}
      {/* grab rails + poles */}
      {[-1, 1].map((s) => (
        <Cyl key={`rail${s}`} p={[0, 2.08, s * 0.95]} r={0.025} h={22} c="#d7dde3" rot={[0, 0, Math.PI / 2]} />
      ))}
      {Array.from({length: 18}).map((_, i) => {
        const x = -4.25 + i * 0.5;
        const sw = Math.sin(frame / 14 + i * 0.4) * (moving ? 0.12 : 0.02);
        return (
          <group key={`strap${i}`} position={[x, 2.08, -0.95]} rotation={[sw, 0, 0]}>
            <Box p={[0, -0.12, 0]} s={[0.03, 0.24, 0.02]} c="#f0f0f0" />
            <mesh position={[0, -0.3, 0]}>
              <torusGeometry args={[0.07, 0.015, 4, 8]} />
              <meshLambertMaterial color="#f7e9a0" flatShading />
            </mesh>
          </group>
        );
      })}
      <Cyl p={[POLE.x, 1.27, POLE.z]} r={0.03} h={2.55} c="#e3e8ec" />
      <Cyl p={[2.0, 1.27, -1.02]} r={0.03} h={2.55} c="#e3e8ec" />
      <Cyl p={[-2.9, 1.27, 0.4]} r={0.03} h={2.55} c="#e3e8ec" />
      {/* sunlight patches sliding across the floor while moving */}
      {moving
        ? Array.from({length: 10}).map((_, i) => {
            const x = ((((i * 1.55 - tr * 0.25) % 15.5) + 15.5) % 15.5) - 7.75;
            return <Plane key={`sun${i}`} p={[x, 0.012, -0.3]} s={[0.9, 1.8]} c="#fff2b8" emissive="#6a5a20" opacity={0.35} />;
          })
        : null}
      {outside === 'city' ? <CityOutside travel={tr} /> : <StationOutside name={stationName} />}
    </group>
  );
};
