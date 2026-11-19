import React, {useMemo} from 'react';
import {CanvasTexture, NearestFilter, RepeatWrapping, SRGBColorSpace, Texture} from 'three';
import {random} from 'remotion';

/* Low-poly, flat-shaded building blocks shared by every set. */

type V3 = [number, number, number];

export const Box: React.FC<{
  p: V3;
  s: V3;
  c: string;
  r?: V3;
  emissive?: string;
  map?: Texture | null;
  opacity?: number;
}> = ({p, s, c, r, emissive, map, opacity}) => (
  <mesh position={p} rotation={r}>
    <boxGeometry args={s} />
    <meshLambertMaterial
      color={c}
      flatShading
      emissive={emissive ?? '#000000'}
      map={map ?? null}
      transparent={opacity !== undefined}
      opacity={opacity ?? 1}
    />
  </mesh>
);

export const Cyl: React.FC<{p: V3; r: number; h: number; c: string; rot?: V3; seg?: number; rTop?: number; emissive?: string}> = ({
  p,
  r,
  h,
  c,
  rot,
  seg = 10,
  rTop,
  emissive,
}) => (
  <mesh position={p} rotation={rot}>
    <cylinderGeometry args={[rTop ?? r, r, h, seg]} />
    <meshLambertMaterial color={c} flatShading emissive={emissive ?? '#000000'} />
  </mesh>
);

export const Ball: React.FC<{p: V3; r: number; c: string; detail?: number; s?: V3}> = ({p, r, c, detail = 0, s}) => (
  <mesh position={p} scale={s}>
    <icosahedronGeometry args={[r, detail]} />
    <meshLambertMaterial color={c} flatShading />
  </mesh>
);

export const Cone: React.FC<{p: V3; r: number; h: number; c: string; seg?: number; rot?: V3}> = ({p, r, h, c, seg = 7, rot}) => (
  <mesh position={p} rotation={rot}>
    <coneGeometry args={[r, h, seg]} />
    <meshLambertMaterial color={c} flatShading />
  </mesh>
);

/** Flat textured plane (floors, walls, signs). */
export const Plane: React.FC<{
  p: V3;
  s: [number, number];
  c?: string;
  r?: V3;
  map?: Texture | null;
  emissive?: string;
  opacity?: number;
}> = ({p, s, c = '#ffffff', r = [-Math.PI / 2, 0, 0], map, emissive, opacity}) => (
  <mesh position={p} rotation={r}>
    <planeGeometry args={s} />
    <meshLambertMaterial
      color={c}
      map={map ?? null}
      emissive={emissive ?? '#000000'}
      transparent={opacity !== undefined}
      opacity={opacity ?? 1}
      depthWrite={opacity === undefined}
    />
  </mesh>
);

/* ---------- procedural canvas textures ---------- */

const makeCanvas = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat: [number, number] = [1, 1]) => {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d')!;
  draw(g);
  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.magFilter = NearestFilter;
  t.anisotropy = 4;
  return t;
};

export const useTileTexture = (base: string, grout: string, repeat: [number, number], tiles = 4) =>
  useMemo(
    () =>
      makeCanvas(
        256,
        256,
        (g) => {
          g.fillStyle = base;
          g.fillRect(0, 0, 256, 256);
          const n = tiles;
          const s = 256 / n;
          for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++) {
              const k = random(`tile-${base}-${i}-${j}`) * 0.06 - 0.03;
              g.fillStyle = `rgba(${k > 0 ? 255 : 0},${k > 0 ? 255 : 0},${k > 0 ? 255 : 0},${Math.abs(k)})`;
              g.fillRect(i * s, j * s, s, s);
            }
          g.strokeStyle = grout;
          g.lineWidth = 3;
          for (let i = 0; i <= n; i++) {
            g.beginPath();
            g.moveTo(i * s, 0);
            g.lineTo(i * s, 256);
            g.stroke();
            g.beginPath();
            g.moveTo(0, i * s);
            g.lineTo(256, i * s);
            g.stroke();
          }
        },
        repeat,
      ),
    [base, grout, repeat[0], repeat[1], tiles],
  );

export const useStripeTexture = (a: string, b: string, repeat: [number, number]) =>
  useMemo(
    () =>
      makeCanvas(
        64,
        64,
        (g) => {
          g.fillStyle = a;
          g.fillRect(0, 0, 64, 64);
          g.fillStyle = b;
          for (let i = -64; i < 128; i += 16) {
            g.beginPath();
            g.moveTo(i, 0);
            g.lineTo(i + 8, 0);
            g.lineTo(i + 8 + 64, 64);
            g.lineTo(i + 64, 64);
            g.fill();
          }
        },
        repeat,
      ),
    [a, b, repeat[0], repeat[1]],
  );

/** Text sign texture (station names, clocks, ads). */
export const useSignTexture = (text: string, bg: string, fg: string, w = 512, h = 128, font = 'bold 64px sans-serif') =>
  useMemo(
    () =>
      makeCanvas(w, h, (g) => {
        g.fillStyle = bg;
        g.fillRect(0, 0, w, h);
        g.fillStyle = fg;
        g.font = font;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(text, w / 2, h / 2 + 4);
      }),
    [text, bg, fg, w, h, font],
  );

/** Building facade with a grid of windows. */
export const useWindowTexture = (wall: string, glass: string, cols: number, rows: number) =>
  useMemo(
    () =>
      makeCanvas(128, 256, (g) => {
        g.fillStyle = wall;
        g.fillRect(0, 0, 128, 256);
        const cw = 128 / cols;
        const rh = 256 / rows;
        for (let i = 0; i < cols; i++)
          for (let j = 0; j < rows; j++) {
            const lit = random(`win-${wall}-${i}-${j}`) > 0.75;
            g.fillStyle = lit ? '#fff6cf' : glass;
            g.fillRect(i * cw + cw * 0.2, j * rh + rh * 0.22, cw * 0.6, rh * 0.56);
          }
      }),
    [wall, glass, cols, rows],
  );

/* ---------- props ---------- */

const PASTELS = ['#f7c8a0', '#a8d8c8', '#f4a7b9', '#c3b8f0', '#f9e09a', '#9ec9f0', '#e8b59a', '#b8e0a0'];
const BUILD = ['#f2d7b6', '#e9c49f', '#d9e3ea', '#f5e6c8', '#cfd8e6', '#f0cfc4', '#e6e0d0', '#c9dccb'];

export const pastel = (seed: string) => PASTELS[Math.floor(random(seed) * PASTELS.length)];

export const Building: React.FC<{p: V3; s: V3; seed: string}> = ({p, s, seed}) => {
  const wall = BUILD[Math.floor(random(seed) * BUILD.length)];
  const tex = useWindowTexture(wall, '#7f9bb8', 3, 6);
  const t2 = useMemo(() => {
    const t = tex.clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, Math.round(s[0] / 3)), Math.max(1, Math.round(s[1] / 6)));
    return t;
  }, [tex, s[0], s[1]]);
  return (
    <group position={p}>
      <Box p={[0, s[1] / 2, 0]} s={s} c="#ffffff" map={t2} />
      <Box p={[0, s[1] + 0.15, 0]} s={[s[0] + 0.3, 0.3, s[2] + 0.3]} c="#a89f94" />
    </group>
  );
};

export const Tree: React.FC<{p: V3; h?: number; c?: string; seed?: string}> = ({p, h = 3, c, seed = 't'}) => (
  <group position={p}>
    <Cyl p={[0, h * 0.25, 0]} r={0.15} h={h * 0.5} c="#8a5a3a" seg={6} />
    <Ball p={[0, h * 0.7, 0]} r={h * 0.32} c={c ?? (random(seed) > 0.5 ? '#6fbf73' : '#8acb6a')} />
    <Ball p={[h * 0.18, h * 0.85, 0.1]} r={h * 0.22} c={c ?? '#7fcf7a'} />
  </group>
);

/** Low-poly cat commuter (background extra). */
export const Commuter: React.FC<{p: V3; seed: string; sitting?: boolean; rotY?: number; nod?: number}> = ({
  p,
  seed,
  sitting,
  rotY = 0,
  nod = 0,
}) => {
  const body = pastel(seed + 'b');
  const fur = ['#e8dccb', '#c7c2bb', '#f2e6d6', '#a59d94', '#e6c09a', '#6e6863'][Math.floor(random(seed + 'f') * 6)];
  const y = sitting ? 0.42 : 0;
  const bodyH = sitting ? 0.62 : 0.95;
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <Cyl p={[0, y + bodyH / 2, 0]} r={0.24} rTop={0.19} h={bodyH} c={body} seg={8} />
      {sitting ? (
        <>
          <Box p={[-0.1, 0.46, 0.2]} s={[0.14, 0.12, 0.42]} c={body} />
          <Box p={[0.1, 0.46, 0.2]} s={[0.14, 0.12, 0.42]} c={body} />
          <Box p={[-0.1, 0.22, 0.38]} s={[0.12, 0.44, 0.12]} c={fur} />
          <Box p={[0.1, 0.22, 0.38]} s={[0.12, 0.44, 0.12]} c={fur} />
        </>
      ) : (
        <>
          <Cyl p={[-0.1, 0.2, 0]} r={0.07} h={0.4} c={fur} seg={6} />
          <Cyl p={[0.1, 0.2, 0]} r={0.07} h={0.4} c={fur} seg={6} />
        </>
      )}
      <group position={[0, y + bodyH + 0.2, 0]} rotation={[nod, 0, 0]}>
        <Ball p={[0, 0, 0]} r={0.23} c={fur} detail={1} s={[1.1, 0.95, 1]} />
        <Cone p={[-0.13, 0.2, 0]} r={0.07} h={0.16} c={fur} seg={4} />
        <Cone p={[0.13, 0.2, 0]} r={0.07} h={0.16} c={fur} seg={4} />
      </group>
    </group>
  );
};
