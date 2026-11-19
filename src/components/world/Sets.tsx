import React from 'react';
import {random} from 'remotion';
import {Box, Building, Cone, Cyl, Plane, Tree, useSignTexture, useTileTexture} from './primitives';

/**
 * Low-poly 2.5D sets (flat, warm, peach/cream/white-tile palette).
 * Shared units: metres. Platform top is y = 0.
 */

export const PAL = {
  peach: '#f2c99f',
  sand: '#e8b98a',
  cream: '#f7ead8',
  wall: '#f5dcc0',
  trim: '#d9a77a',
  tile: '#f3f1ec',
  grout: '#cfc9bd',
  sky: '#cfe6ff',
  grass: '#a8d08d',
  road: '#9a9ea6',
  rail: '#8a8f96',
  trainBody: '#f4f3ee',
  trainStripe: '#3fb0a8',
  trainStripe2: '#f29a5b',
  glass: '#5a7ea8',
};

/* ------------------------------------------------------------------ */
/* Train car (exterior)                                                */
/* ------------------------------------------------------------------ */

export const TRAIN_DOOR_XS = [-6, -2, 2, 6];

export const TrainCar: React.FC<{x?: number; z?: number; y?: number; doorsOpen?: number; length?: number; windowLit?: boolean}> = ({
  x = 0,
  z = 1.55,
  y = 0,
  doorsOpen = 0,
  length = 18,
  windowLit = true,
}) => {
  const half = 1.45;
  const face = z - half - 0.01; // platform-facing side
  const windows: number[] = [];
  for (let wx = -length / 2 + 1.2; wx < length / 2 - 1; wx += 1.0) {
    if (TRAIN_DOOR_XS.some((d) => Math.abs(wx - d) < 1.05)) continue;
    windows.push(wx);
  }
  return (
    <group position={[x, y, 0]}>
      <Box p={[0, 0.8, z]} s={[length, 3.4, half * 2]} c={PAL.trainBody} />
      <Box p={[0, 2.62, z]} s={[length - 0.4, 0.25, half * 2 - 0.3]} c="#dcdcd6" />
      <Box p={[0, 0.22, face - 0.02]} s={[length, 0.16, 0.01]} c={PAL.trainStripe} />
      <Box p={[0, -0.02, face - 0.02]} s={[length, 0.08, 0.01]} c={PAL.trainStripe2} />
      {windows.map((wx) => (
        <Box key={wx} p={[wx, 1.45, face - 0.025]} s={[0.82, 0.85, 0.01]} c={windowLit ? '#9cc3e6' : PAL.glass} emissive={windowLit ? '#2a3a4a' : '#000'} />
      ))}
      {/* far side (seen from streets): windows + stripes */}
      {[...windows, ...TRAIN_DOOR_XS].map((wx) => (
        <Box key={`b${wx}`} p={[wx, 1.45, z + half + 0.025]} s={[0.82, 0.85, 0.01]} c="#9cc3e6" emissive="#2a3a4a" />
      ))}
      <Box p={[0, 0.22, z + half + 0.02]} s={[length, 0.16, 0.01]} c={PAL.trainStripe} />
      <Box p={[0, -0.02, z + half + 0.02]} s={[length, 0.08, 0.01]} c={PAL.trainStripe2} />
      {TRAIN_DOOR_XS.map((dx) => (
        <group key={dx}>
          <Box p={[dx, 1.0, face - 0.012]} s={[1.36, 2.1, 0.005]} c="#2e3440" />
          {[-1, 1].map((sd) => (
            <group key={sd} position={[dx + sd * 0.33 + sd * doorsOpen * 0.62, 1.0, face - 0.04]}>
              <Box p={[0, 0, 0]} s={[0.64, 2.05, 0.03]} c="#e3e5e8" />
              <Box p={[0, 0.4, -0.02]} s={[0.4, 0.8, 0.01]} c="#9cc3e6" emissive="#1a2a3a" />
            </group>
          ))}
        </group>
      ))}
      {/* undercarriage + wheels */}
      <Box p={[0, -1.0, z]} s={[length - 2, 0.3, half * 2 - 0.4]} c="#4a4e56" />
      {[-length / 2 + 2.2, -length / 2 + 3.4, length / 2 - 3.4, length / 2 - 2.2].map((wx) => (
        <Cyl key={wx} p={[wx, -1.05, face + 0.3]} r={0.38} h={0.15} c="#33363c" rot={[Math.PI / 2, 0, 0]} />
      ))}
    </group>
  );
};

/** A short consist of cars. */
export const Train: React.FC<{x: number; cars?: number; doorsOpen?: number; z?: number; y?: number}> = ({x, cars = 3, doorsOpen = 0, z, y}) => (
  <group>
    {Array.from({length: cars}).map((_, i) => (
      <TrainCar key={i} x={x + (i - (cars - 1) / 2) * 18.4} doorsOpen={doorsOpen} z={z} y={y} />
    ))}
  </group>
);

/* ------------------------------------------------------------------ */
/* Station platform                                                    */
/* ------------------------------------------------------------------ */

export const StationPlatform: React.FC<{name?: string; accent?: string; trainX?: number | null; doorsOpen?: number; frame?: number}> = ({
  name = 'KOMOREBI',
  accent = '#2f5e8f',
  trainX = 0,
  doorsOpen = 0,
}) => {
  const floor = useTileTexture(PAL.tile, PAL.grout, [80, 8], 4);
  const wallTile = useTileTexture('#fbf6ee', '#d8cfc0', [60, 3], 4);
  const sign = useSignTexture(name, accent, '#ffffff', 512, 128, 'bold 60px sans-serif');
  return (
    <group>
      <Plane p={[0, 0, -4]} s={[80, 8]} map={floor} />
      <Box p={[0, 0.005, -0.45]} s={[80, 0.01, 0.22]} c="#f2c230" />
      <Box p={[0, -0.55, 0.02]} s={[80, 1.1, 0.06]} c="#c9bfae" />
      {/* track bed */}
      <Plane p={[0, -1.15, 1.6]} s={[80, 3.4]} c="#8d8478" />
      {[0.95, 2.15].map((rz) => (
        <Box key={rz} p={[0, -1.08, rz]} s={[80, 0.08, 0.08]} c="#b8bcc2" />
      ))}
      {Array.from({length: 54}).map((_, i) => (
        <Box key={i} p={[-40 + i * 1.5, -1.12, 1.55]} s={[0.25, 0.05, 1.9]} c="#6e655a" />
      ))}
      {/* far side wall across the tracks */}
      <Plane p={[0, 1.4, 3.6]} s={[80, 5.2]} r={[0, Math.PI, 0]} c={PAL.peach} />
      {/* back wall */}
      <Plane p={[0, 1.0, -8]} s={[80, 2]} r={[0, 0, 0]} map={wallTile} />
      <Plane p={[0, 3.2, -8]} s={[80, 2.4]} r={[0, 0, 0]} c={PAL.peach} />
      <Plane p={[0, 4.4, -3]} s={[80, 11]} r={[Math.PI / 2, 0, 0]} c={PAL.cream} />
      {[-15, -9, -3, 3, 9, 15].map((x) => (
        <Box key={x} p={[x, 2.2, -4.2]} s={[0.55, 4.4, 0.55]} c={PAL.sand} />
      ))}
      {[-12, -6, 0, 6, 12].map((x) => (
        <Box key={`l${x}`} p={[x, 4.3, -3]} s={[3, 0.06, 0.3]} c="#fffef5" emissive="#bdb8a8" />
      ))}
      {[-6, 6].map((x) => (
        <group key={`s${x}`}>
          <Box p={[x, 3.3, -4.2]} s={[2.4, 0.6, 0.08]} c={accent} />
          <Plane p={[x, 3.3, -4.15]} s={[2.3, 0.55]} r={[0, 0, 0]} map={sign} emissive="#1a2a40" />
        </group>
      ))}
      <Plane p={[0, 2.4, -7.98]} s={[3.6, 0.9]} r={[0, 0, 0]} map={sign} emissive="#1a2a40" />
      {/* benches + bins */}
      {[-10.5, 4.5].map((x) => (
        <group key={`b${x}`}>
          <Box p={[x, 0.45, -6.6]} s={[2.2, 0.08, 0.5]} c="#8db4dc" />
          <Box p={[x, 0.75, -6.85]} s={[2.2, 0.5, 0.06]} c="#8db4dc" />
          <Box p={[x - 0.9, 0.22, -6.6]} s={[0.08, 0.44, 0.45]} c="#777" />
          <Box p={[x + 0.9, 0.22, -6.6]} s={[0.08, 0.44, 0.45]} c="#777" />
        </group>
      ))}
      {/* stairs going up (exit) */}
      <group position={[-22, 0, -6]}>
        {Array.from({length: 12}).map((_, i) => (
          <Box key={i} p={[i * 0.32, 0.09 + i * 0.18, 0]} s={[0.32, 0.18 + i * 0.36, 2.2]} c={i % 2 ? '#e9e4da' : '#f3efe7'} />
        ))}
      </group>
      {trainX !== null ? <Train x={trainX} doorsOpen={doorsOpen} /> : null}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Stairwell up to the street                                          */
/* ------------------------------------------------------------------ */

export const STAIR = {rise: 0.18, run: 0.32, steps: 22, width: 2.6};

export const Stairwell: React.FC = () => {
  const n = STAIR.steps;
  return (
    <group>
      {Array.from({length: n}).map((_, i) => (
        <group key={i}>
          <Box p={[i * STAIR.run, ((i + 1) * STAIR.rise) / 2, 0]} s={[STAIR.run, (i + 1) * STAIR.rise, STAIR.width]} c={i % 2 ? '#ece6dc' : '#f7f3ec'} />
          <Box p={[i * STAIR.run - STAIR.run / 2 + 0.03, (i + 1) * STAIR.rise - 0.005, 0]} s={[0.05, 0.012, STAIR.width]} c="#f2c230" />
        </group>
      ))}
      <Plane p={[-4, 0, 0]} s={[8, STAIR.width]} c="#e9e4da" />
      {/* side walls */}
      {[-1, 1].map((sd) => (
        <Box key={sd} p={[n * STAIR.run * 0.5, 2.2, sd * (STAIR.width / 2 + 0.05)]} s={[n * STAIR.run + 6, 8, 0.1]} c={sd < 0 ? PAL.peach : PAL.wall} />
      ))}
      {/* handrail */}
      <mesh position={[n * STAIR.run * 0.5, n * STAIR.rise * 0.5 + 0.95, -STAIR.width / 2 + 0.15]} rotation={[0, 0, Math.atan2(STAIR.rise, STAIR.run)]}>
        <cylinderGeometry args={[0.03, 0.03, Math.hypot(n * STAIR.run, n * STAIR.rise), 8]} />
        <meshLambertMaterial color="#d7dde3" />
      </mesh>
      {/* top landing + opening to the sky */}
      <Box p={[n * STAIR.run + 3, n * STAIR.rise - 0.1, 0]} s={[6, 0.2, STAIR.width]} c="#e9e4da" />
      <Plane p={[n * STAIR.run * 0.5, 7.0, 0]} s={[n * STAIR.run - 2, STAIR.width]} r={[Math.PI / 2, 0, 0]} c={PAL.cream} />
      {Array.from({length: 4}).map((_, i) => (
        <Box key={`lamp${i}`} p={[1 + i * 2, 5.2 + i * 0.4, 0]} s={[0.8, 0.05, 0.25]} c="#fffef5" emissive="#bdb8a8" />
      ))}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Pedestrian overpass above a road                                   */
/* ------------------------------------------------------------------ */

export const OVERPASS_Y = 6;

export const Overpass: React.FC<{frame: number}> = ({frame}) => {
  const deck = useTileTexture('#efe7da', '#d4c8b4', [30, 2], 3);
  const cars = Array.from({length: 7}).map((_, i) => {
    const dir = i % 2 ? 1 : -1;
    const x = ((((i * 13 + dir * frame * 0.35) % 90) + 90) % 90) - 45;
    return {x, z: dir > 0 ? -1.8 : 1.8, c: ['#e86a5a', '#5a8de8', '#f2c230', '#f4f3ee', '#7bc47f'][i % 5], i};
  });
  return (
    <group>
      <Plane p={[0, 0, 0]} s={[200, 200]} c={PAL.grass} />
      <Plane p={[0, 0.01, 0]} s={[200, 8]} c={PAL.road} />
      {Array.from({length: 30}).map((_, i) => (
        <Box key={i} p={[-90 + i * 6, 0.02, 0]} s={[2.5, 0.01, 0.15]} c="#ffffff" />
      ))}
      {cars.map((c) => (
        <group key={c.i} position={[c.x, 0, c.z]}>
          <Box p={[0, 0.45, 0]} s={[3.2, 0.7, 1.6]} c={c.c} />
          <Box p={[-0.2, 1.05, 0]} s={[1.8, 0.55, 1.4]} c="#cfe3f5" />
        </group>
      ))}
      {/* deck crossing the road (along z) */}
      <Box p={[0, OVERPASS_Y - 0.25, 0]} s={[3.2, 0.5, 30]} c="#e2d6c4" />
      <Plane p={[0, OVERPASS_Y + 0.005, 0]} s={[3.2, 30]} map={deck} />
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <Box p={[sd * 1.55, OVERPASS_Y + 1.0, 0]} s={[0.07, 0.07, 30]} c="#d7dde3" />
          <Box p={[sd * 1.55, OVERPASS_Y + 0.5, 0]} s={[0.04, 0.04, 30]} c="#d7dde3" />
          {Array.from({length: 31}).map((_, i) => (
            <Box key={i} p={[sd * 1.55, OVERPASS_Y + 0.5, -15 + i]} s={[0.05, 1.0, 0.05]} c="#c5ccd3" />
          ))}
        </group>
      ))}
      {[-6, 6].map((z) => (
        <Box key={z} p={[0, OVERPASS_Y / 2, z]} s={[0.8, OVERPASS_Y, 0.8]} c={PAL.sand} />
      ))}
      {Array.from({length: 18}).map((_, i) => {
        const sd = i % 2 ? 1 : -1;
        return (
          <Building
            key={i}
            p={[sd * (12 + random(`ob${i}`) * 18), 0, -40 + i * 5]}
            s={[6 + random(`obw${i}`) * 5, 8 + random(`obh${i}`) * 22, 6]}
            seed={`ob${i}`}
          />
        );
      })}
      {Array.from({length: 10}).map((_, i) => (
        <Tree key={`t${i}`} p={[(i % 2 ? 1 : -1) * 6.5, 0, -30 + i * 6]} h={3.6} seed={`ot${i}`} />
      ))}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Downhill street beside an elevated metro track                      */
/* ------------------------------------------------------------------ */

export const HILL_SLOPE = (11 * Math.PI) / 180;
export const TRACK = {z: -7.5, height: 5.2};

const HOUSE_COLS = ['#f6d36b', '#f4a7b9', '#9ec9f0', '#fbf7ef', '#b8e0a0', '#f2c99f'];

const House: React.FC<{p: [number, number, number]; seed: string; rotY?: number}> = ({p, seed, rotY = 0}) => {
  const c = HOUSE_COLS[Math.floor(random(seed) * HOUSE_COLS.length)];
  const w = 4 + random(seed + 'w') * 2;
  const h = 3 + random(seed + 'h') * 2.5;
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <Box p={[0, h / 2, 0]} s={[w, h, 4]} c={c} />
      <mesh position={[0, h + 0.9, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[w * 0.78, 1.8, 4]} />
        <meshLambertMaterial color={random(seed + 'r') > 0.5 ? '#8a8f96' : '#c86a5a'} flatShading />
      </mesh>
      <Box p={[-w * 0.2, h * 0.55, 2.01]} s={[0.9, 0.8, 0.02]} c="#cfe3f5" />
      <Box p={[w * 0.25, h * 0.55, 2.01]} s={[0.9, 0.8, 0.02]} c="#cfe3f5" />
      <Box p={[0, 0.7, 2.01]} s={[0.8, 1.4, 0.02]} c="#8b5a3c" />
      <Box p={[w * 0.3, h + 1.2, -0.6]} s={[0.4, 1.2, 0.4]} c="#c86a5a" />
    </group>
  );
};

/** Built along +x in its own flat frame; the whole group is tilted downhill. */
export const HillStreet: React.FC<{trainX?: number; length?: number}> = ({trainX = 0, length = 260}) => (
  <group rotation={[0, 0, -HILL_SLOPE]}>
    <Plane p={[length / 2 - 40, -0.01, 0]} s={[length + 80, 80]} c={PAL.grass} />
    <Plane p={[length / 2 - 40, 0, 0]} s={[length + 80, 6]} c={PAL.road} />
    <Plane p={[length / 2 - 40, 0.02, 3.6]} s={[length + 80, 1.4]} c="#d9d4cb" />
    <Plane p={[length / 2 - 40, 0.02, -3.6]} s={[length + 80, 1.4]} c="#d9d4cb" />
    {Array.from({length: Math.ceil(length / 6)}).map((_, i) => (
      <Box key={i} p={[-30 + i * 6, 0.02, 0]} s={[2.5, 0.01, 0.15]} c="#ffffff" />
    ))}
    {/* elevated track on pillars */}
    {Array.from({length: Math.ceil(length / 10)}).map((_, i) => (
      <Box key={`pl${i}`} p={[-30 + i * 10, TRACK.height / 2, TRACK.z]} s={[0.7, TRACK.height, 0.7]} c="#d9d4cb" />
    ))}
    <Box p={[length / 2 - 40, TRACK.height + 0.25, TRACK.z]} s={[length + 80, 0.5, 3.6]} c="#e2dbcf" />
    <Box p={[length / 2 - 40, TRACK.height + 0.6, TRACK.z + 1.75]} s={[length + 80, 0.4, 0.1]} c="#cfc6b6" />
    <group position={[0, TRACK.height + 1.6, 0]}>
      <Train x={trainX} cars={3} z={TRACK.z} />
    </group>
    {/* houses on the far side + trees */}
    {Array.from({length: Math.ceil(length / 7)}).map((_, i) => (
      <House key={`h${i}`} p={[-30 + i * 7, 0, -15 - random(`hz${i}`) * 3]} seed={`house${i}`} />
    ))}
    {Array.from({length: Math.ceil(length / 9)}).map((_, i) => (
      <Tree key={`t${i}`} p={[-26 + i * 9, 0, 5.5]} h={3.4} seed={`st${i}`} />
    ))}
    {Array.from({length: Math.ceil(length / 12)}).map((_, i) => (
      <group key={`lp${i}`} position={[-24 + i * 12, 0, 4.6]}>
        <Cyl p={[0, 1.8, 0]} r={0.06} h={3.6} c="#5d6670" />
        <Cone p={[0, 3.6, 0]} r={0.25} h={0.3} c="#5d6670" />
      </group>
    ))}
  </group>
);

/* ------------------------------------------------------------------ */
/* Next station concourse with ticket gates                            */
/* ------------------------------------------------------------------ */

export const GATE_XS = [-3, -1.5, 0, 1.5, 3];

export const TicketGates: React.FC<{burstGate?: number; burst?: number; name?: string}> = ({burstGate = 2, burst = 0, name = 'SAKURA-DORI'}) => {
  const floor = useTileTexture(PAL.tile, PAL.grout, [30, 20], 4);
  const sign = useSignTexture(name, '#c9506a', '#ffffff', 512, 128, 'bold 56px sans-serif');
  const sign2 = useSignTexture('▼  PLATFORM 2  ▼', '#2f5e8f', '#ffffff', 512, 96, 'bold 44px sans-serif');
  return (
    <group>
      <Plane p={[0, 0, 0]} s={[40, 30]} map={floor} />
      <Plane p={[0, 2.5, -12]} s={[40, 5]} r={[0, 0, 0]} c={PAL.peach} />
      <Plane p={[-14, 2.5, 0]} s={[30, 5]} r={[0, Math.PI / 2, 0]} c={PAL.wall} />
      <Plane p={[14, 2.5, 0]} s={[30, 5]} r={[0, -Math.PI / 2, 0]} c={PAL.wall} />
      <Plane p={[0, 5, 0]} s={[40, 30]} r={[Math.PI / 2, 0, 0]} c={PAL.cream} />
      {[-6, 0, 6].map((x) => (
        <Box key={x} p={[x, 4.9, -2]} s={[3, 0.06, 0.4]} c="#fffef5" emissive="#bdb8a8" />
      ))}
      <Plane p={[0, 3.6, -11.95]} s={[4.2, 1.05]} r={[0, 0, 0]} map={sign} emissive="#301018" />
      <Plane p={[0, 2.5, -11.95]} s={[3.4, 0.64]} r={[0, 0, 0]} map={sign2} emissive="#101a30" />
      {/* gate cabinets (between lanes) */}
      {[-3.75, -2.25, -0.75, 0.75, 2.25, 3.75].map((x) => (
        <group key={x}>
          <Box p={[x, 0.5, 0]} s={[0.32, 1.0, 1.6]} c="#e9edf1" />
          <Box p={[x, 1.01, 0.5]} s={[0.3, 0.02, 0.4]} c="#3fb0a8" emissive="#103a36" />
          <Box p={[x, 0.85, -0.79]} s={[0.2, 0.12, 0.01]} c="#2a2a2a" emissive="#00ff66" />
        </group>
      ))}
      {/* flaps in each lane */}
      {GATE_XS.map((x, i) => {
        const open = i === burstGate ? burst : 0;
        return (
          <group key={`f${x}`}>
            <group position={[x - 0.6, 0.75, 0]} rotation={[0, -open * 1.4, 0]}>
              <Box p={[0.28, 0, 0]} s={[0.56, 0.4, 0.04]} c="#f29a5b" />
            </group>
            <group position={[x + 0.6, 0.75, 0]} rotation={[0, open * 1.4, 0]}>
              <Box p={[-0.28, 0, 0]} s={[0.56, 0.4, 0.04]} c="#f29a5b" />
            </group>
          </group>
        );
      })}
      {/* stairs down to platform at the back */}
      {Array.from({length: 6}).map((_, i) => (
        <Box key={`d${i}`} p={[0, -0.1 - i * 0.18, -8 - i * 0.32]} s={[5, 0.2, 0.32]} c={i % 2 ? '#ece6dc' : '#f7f3ec'} />
      ))}
    </group>
  );
};
