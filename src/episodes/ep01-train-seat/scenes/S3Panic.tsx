import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {Stage} from '../../../engine/Stage';
import {CamParams, place, shakeFromEvents} from '../../../engine/CinematicCamera';
import {keys, noise, ramp, stepped, within} from '../../../engine/time';
import {idle, pant} from '../../../engine/motion';
import {DOOR_XS, MetroInterior, POLE} from '../../../components/world/MetroInterior';
import {StationPlatform, TRAIN_DOOR_XS} from '../../../components/world/Sets';
import {elder, FemaleCat, LOOKS, MaleCat} from '../../../components/cats/Cast';
import {RotoscopeCut} from '../../../components/RotoscopeCut';
import {DizzyStars, Heart, HeartStream, ImpactFrame, PanicOrbit, Sparkles, SpeedLines, ThoughtCloud} from '../../../components/fx/Fx';
import {B, SCENES} from '../timeline';
import {faceCam, headScreen, OverlayPole, Rot, SeatedCrowd, sideCam} from '../shared';

const SPEED = 0.28;
const MX = -0.62;
const MZ = -1.15;
const FX = 0.75;
const FZ = -0.86;

/** Train travel with a smooth stop into the station at B.stationStop. */
const travelAt = (G: number) => {
  const d0 = B.panic[0];
  if (G < d0) return G * SPEED;
  const t = Math.min(G - d0, B.stationStop - d0);
  const T = B.stationStop - d0;
  return d0 * SPEED + SPEED * (t - (t * t) / (2 * T));
};

/* -------- dream vignettes drawn inside the thought cloud -------- */
const DreamBench: React.FC<{x: number; y: number; w: number; color?: string}> = ({x, y, w, color = '#8db4dc'}) => (
  <g>
    <rect x={x - w / 2} y={y - 6} width={w} height={22} rx={6} fill={color} stroke="#141214" strokeWidth={5} />
    <rect x={x - w / 2} y={y - 90} width={w} height={70} rx={10} fill={color} stroke="#141214" strokeWidth={5} />
    <rect x={x - w / 2 + 14} y={y + 16} width={12} height={46} fill="#777" stroke="#141214" strokeWidth={4} />
    <rect x={x + w / 2 - 26} y={y + 16} width={12} height={46} fill="#777" stroke="#141214" strokeWidth={4} />
  </g>
);

const Dream: React.FC<{G: number; f: number; cx: number; cy: number}> = ({G, f, cx, cy}) => {
  const v = G < B.dream2[0] ? 1 : G < B.dream3[0] ? 2 : 3;
  const start = v === 1 ? B.dream1[0] : v === 2 ? B.dream2[0] : B.dream3[0];
  const wipe = ramp(G, [start, start + 10], [0, 1], Easing.out(Easing.cubic));
  const s = 0.85;
  const by = cy + 190;
  const bg =
    v === 3 ? (
      <g>
        <rect x={cx - 700} y={cy - 400} width={1400} height={800} fill="#ffcf9e" />
        <circle cx={cx + 220} cy={cy + 40} r={120} fill="#ff9a62" />
        <rect x={cx - 700} y={by + 40} width={1400} height={400} fill="#c99a6a" />
        {Array.from({length: 14}).map((_, i) => (
          <rect key={i} x={cx - 560 + i * 80} y={by - 40} width={14} height={90} fill="#f7ead8" stroke="#141214" strokeWidth={3} />
        ))}
        <rect x={cx - 560} y={by - 50} width={1100} height={14} fill="#f7ead8" stroke="#141214" strokeWidth={3} />
      </g>
    ) : (
      <g>
        <rect x={cx - 700} y={cy - 400} width={1400} height={800} fill={v === 1 ? '#ffe3ef' : '#e9e1ff'} />
        <rect x={cx - 700} y={by + 40} width={1400} height={400} fill={v === 1 ? '#fff4f8' : '#f6f2ff'} />
      </g>
    );
  return (
    <g>
      <g>
        <clipPath id={`wipe-${v}`}>
          <circle cx={cx} cy={cy} r={20 + wipe * 800} />
        </clipPath>
        <g clipPath={`url(#wipe-${v})`}>
          {bg}
          <DreamBench x={cx} y={by - 50} w={400} color={v === 3 ? '#a8784e' : '#8db4dc'} />
          {v === 1 ? (
            <>
              <MaleCat x={cx - 60} y={by + 4} scale={s} frame={f} pose={{sit: true, headTilt: 6}} face={{eyes: 'happy', mouth: 'smile', blush: 1, ears: 'perk'}} />
              <FemaleCat x={cx + 60} y={by + 4} scale={s} frame={f} facing={-1} pose={{sit: true, headTilt: 6}} face={{eyes: 'half', lookX: 1, mouth: 'smirk', blush: 0.6}} />
              <HeartStream frame={G} x={cx} y={by - 200} start={B.dream1[0] + 15} count={10} spread={140} />
            </>
          ) : v === 2 ? (
            <>
              <MaleCat x={cx - 40} y={by + 4} scale={s} frame={f} pose={{sit: true, headTilt: 30, lean: 14}} face={{eyes: 'shut', mouth: 'smile', blush: 0.8, ears: 'droop'}} />
              <FemaleCat x={cx + 60} y={by + 4} scale={s} frame={f} facing={-1} pose={{sit: true, headTilt: -4}} face={{eyes: 'happy', mouth: 'smile', blush: 0.6}} />
              {[0, 1, 2].map((k) => {
                const t = ((G - B.dream2[0] + k * 20) % 60) / 60;
                return (
                  <text key={k} x={cx - 120 - t * 40 + k * 10} y={by - 230 - t * 90} fontFamily="sans-serif" fontWeight={900} fontSize={36 + k * 10} fill="#7a5cc4" stroke="#141214" strokeWidth={3} opacity={1 - t}>
                    z
                  </text>
                );
              })}
            </>
          ) : (
            <>
              <MaleCat look={elder(LOOKS.male)} x={cx - 60} y={by + 4} scale={s} frame={f} pose={{sit: true, armR: 20}} holdingR="cane" face={{eyes: 'happy', mouth: 'smile', blush: 0.6}} />
              <FemaleCat look={elder(LOOKS.female)} x={cx + 60} y={by + 4} scale={s} frame={f} facing={-1} pose={{sit: true, headTilt: 10}} face={{eyes: 'happy', mouth: 'smile', blush: 0.6}} />
              <Heart x={cx} y={by - 260 + Math.sin(G / 8) * 8} s={1.6} />
              <Sparkles frame={G} count={10} seed="old" area={[cx - 300, cy - 220, 600, 240]} />
            </>
          )}
        </g>
      </g>
    </g>
  );
};

export const S3Panic: React.FC = () => {
  const G = useCurrentFrame() + SCENES.s3.from;
  const f = stepped(G);
  const travel = travelAt(G);
  const atStation = G >= B.stationStop;
  const doors = !atStation ? 0 : G < B.roto2[0] - 20 ? ramp(G, [B.stationStop + 4, B.stationStop + 24]) : 1 - ramp(G, [B.roto2[0] - 20, B.roto2[1]]);
  const world = (extra: Partial<React.ComponentProps<typeof MetroInterior>> = {}) => (
    <MetroInterior
      frame={G}
      travel={travel}
      speed={atStation ? 0 : SPEED}
      outside={atStation ? 'station' : 'city'}
      stationName="KOMOREBI"
      doorsOpen={doors}
      sway={atStation ? 0 : 0.004}
      {...extra}
    />
  );

  /* ---------- A: rotoscope panic insert (hand / eyes / stutter) ---------- */
  if (G < B.roto1[1]) {
    const L = G - B.roto1[0];
    const stutter = L >= 80 ? (Math.floor((L - 80) / 6) % 2 === 0 ? 'hand-pole' : 'eyes') : L < 40 ? 'hand-pole' : 'eyes';
    return <RotoscopeCut shot={stutter} frame={G} progress={ramp(L, [0, 40])} />;
  }

  /* ---------- B: back to 2.5D, clinging to the pole ---------- */
  if (G < B.cloud[0]) {
    const cam = sideCam(1.05, -0.4);
    return (
      <Stage cam={cam} move={{dutch: -7, handheld: 4}} light="interior" world={world()}>
        {(c) => {
          const m = place(c, [MX, 0, MZ], 1.5);
          return (
            <>
              <SeatedCrowd cam={c} frame={f} moving />
              <MaleCat
                {...m}
                x={m.x + noise(`cl${f}`) * 3}
                frame={f}
                pose={{...idle(f), armR: 62, armL: -30, lean: 6, squash: 0.97}}
                face={{eyes: 'wide', lookX: 1, mouth: 'wobble', ears: 'flat', sweat: 3}}
              />
              <OverlayPole cam={c} x={POLE.x} z={POLE.z} />
              <FemaleCat {...place(c, [FX, 0, FZ], 1.45)} frame={f} facing={-1} earbud pose={idle(f, 2)} face={{eyes: 'dot', lookY: 0.6}} />
            </>
          );
        }}
      </Stage>
    );
  }

  /* ---------- C: imagination spiral inside a thought cloud ---------- */
  if (G < B.panic[0]) {
    const L = G - B.cloud[0];
    const base = faceCam(MX, MZ, 2.4, 50, 1.2);
    const cam: CamParams = {...base, position: [base.position[0] + 1.05, base.position[1], base.position[2]], lookAt: [base.lookAt[0] + 1.05, base.lookAt[1], base.lookAt[2]]};
    const grow = ramp(L, [0, 14], [0, 1], Easing.out(Easing.back(1.6)));
    const dreamy = G < B.dream3[1] - 50;
    return (
      <Stage
        cam={cam}
        move={{handheld: 2}}
        light="interior"
        world={world()}
        fx={<AbsoluteFill style={{background: 'radial-gradient(ellipse at 70% 40%, rgba(255,200,230,0.35), rgba(255,200,230,0) 60%)'}} />}
      >
        {(c) => {
          const m = place(c, [MX, 0, MZ], 1.5);
          const h = headScreen(m, 0, 1);
          const cx = 1310;
          const cy = 420;
          return (
            <>
              <MaleCat
                {...m}
                frame={f}
                pose={{...idle(f), armR: 62, armL: -10, headTilt: dreamy ? 10 : 0}}
                face={dreamy ? {eyes: 'heart', mouth: 'grin', blush: 1, ears: 'perk'} : {eyes: 'wide', mouth: 'o', ears: 'droop', sweat: 2, blush: 0.6}}
              />
              <OverlayPole cam={c} x={POLE.x} z={POLE.z} />
              <ThoughtCloud cx={cx} cy={cy} rx={500} ry={320} frame={G} scale={grow} trail={[h.x + h.r * 0.9, h.y - h.r * 0.8]} id="dream">
                <Dream G={G} f={f} cx={cx} cy={cy} />
              </ThoughtCloud>
            </>
          );
        }}
      </Stage>
    );
  }

  /* ---------- D: overthinking panic spiral ---------- */
  if (G < B.chime2) {
    const L = G - B.panic[0];
    const cam = faceCam(MX, MZ, 1.6, 44, 1.3);
    const hb = [2440, 2490, 2530, 2560, 2585].reduce((a, b) => a + (G >= b ? Math.exp(-(G - b) / 4) : 0), 0);
    const pop = L < 8;
    return (
      <Stage
        cam={cam}
        move={{dutch: Math.sin(G / 9) * 12, zoom: 1.04 + hb * 0.05, shake: 5 + (pop ? 16 : 0)}}
        light="interior"
        world={world()}
        fx={
          <>
            <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(30,0,20,0) 30%, rgba(30,0,20,0.7) 100%)'}} />
            <SpeedLines frame={G} mode="radial" intensity={0.9} inner={420} />
            <ImpactFrame frame={G} at={B.panic[0]} cx={960} cy={420} />
          </>
        }
      >
        {(c) => {
          const m = place(c, [MX, 0, MZ], 1.5);
          const h = headScreen(m, 0, 1);
          return (
            <>
              <MaleCat
                {...m}
                x={m.x + noise(`pn${f}`) * 5}
                frame={f}
                pose={{...idle(f), armL: 150 + noise(`al${f}`) * 10, armR: 150 + noise(`ar${f}`) * 10, squash: 0.95, handScale: 1.4}}
                face={{eyes: 'wide', lookX: noise(`lx${Math.floor(f / 4)}`), lookY: noise(`ly${Math.floor(f / 4)}`) * 0.6, mouth: 'shout', ears: 'flat', sweat: 3, redFace: 0.25}}
              />
              <PanicOrbit frame={G} x={h.x} y={h.y - h.r * 0.2} r={h.r * 2.6} amount={ramp(L, [6, 20])} />
            </>
          );
        }}
      </Stage>
    );
  }

  /* ---------- E: doors chime open at the station, he eyes the exit ---------- */
  if (G < B.roto2[0]) {
    const cam = sideCam(0.6, -1.4);
    const antic = ramp(f, [B.chime2 + 30, B.roto2[0]]);
    return (
      <Stage cam={cam} move={{dutch: -6, zoom: 1 + antic * 0.06}} light="interior" world={world()}>
        {(c) => (
          <>
            <SeatedCrowd cam={c} frame={f} />
            <MaleCat
              {...place(c, [MX, 0, FZ], 1.5)}
              frame={f}
              facing={-1}
              pose={{...idle(f), squash: 1 - antic * 0.12, lean: antic * 20, armL: 10 - antic * 40, armR: 10 - antic * 40, tail: 30}}
              face={{eyes: 'wide', lookX: 1, mouth: 'flat', ears: antic > 0.3 ? 'flat' : 'perk', sweat: 2, brow: 1}}
            />
            <FemaleCat {...place(c, [FX, 0, FZ], 1.45)} frame={f} facing={-1} earbud pose={{...idle(f, 2), headTilt: 10}} face={{eyes: 'normal', lookX: 1, mouth: 'neutral'}} />
            <SpeedLines frame={G} mode="radial" intensity={antic * 0.5} cx={place(c, [DOOR_XS[0], 1.1, -2], 1).x} cy={540} inner={300} />
          </>
        )}
      </Stage>
    );
  }

  /* ---------- F: rotoscope — hand through the closing doors ---------- */
  if (G < B.roto2[1]) {
    return <RotoscopeCut shot="hand-door" frame={G} progress={ramp(G, [B.roto2[0], B.roto2[1] - 6], [0, 1], Easing.in(Easing.quad))} />;
  }

  /* ---------- G/H: platform — the dive, the face-plant, the aftermath ---------- */
  const doorX = TRAIN_DOOR_XS[2];
  const depart = G >= B.depart1 ? 0.5 * 0.0006 * (G - B.depart1) ** 2 : 0;
  const platDoors = G < B.doorsShut ? 0.35 * (1 - ramp(G, [B.dive[0], B.doorsShut])) : 0;
  const push = ramp(G, [B.aftermath[0], SCENES.s3.to], [0, 1]);
  const cam: CamParams = {position: [doorX - 0.8 + push * 0.4, 1.2, -5.0 + push * 1.2], lookAt: [doorX + 0.2, 0.9, 0.5], fov: 52};
  const shake = shakeFromEvents(G, [
    {at: B.doorsShut, amp: 6},
    {at: B.faceplant, amp: 20},
  ]);
  // dive arc
  const dt = ramp(G, [B.dive[0] + 6, B.faceplant], [0, 1]);
  const diveX = doorX + dt * 0.2;
  const diveZ = keys(dt, [0, 1], [0.4, -2.2]);
  const diveY = dt < 1 ? Math.sin(Math.PI * dt) * 0.9 + (1 - dt) * 0.3 : 0;
  const lying = G >= B.faceplant && G < 2950;
  const rising = ramp(G, [2950, 3010]);
  const relief = G >= 3060 && G < 3160;
  return (
    <Stage
      cam={cam}
      move={{shake, handheld: 2}}
      light="interior"
      world={<StationPlatform name="KOMOREBI" trainX={depart} doorsOpen={platDoors} />}
      fx={<ImpactFrame frame={G} at={B.faceplant} cx={960} cy={760} />}
    >
      {(c) => {
        if (G < B.faceplant) {
          const p = place(c, [diveX, diveY, diveZ], 1.5);
          return (
            <Rot deg={-80} x={p.x} y={p.y - 160 * p.scale}>
              <MaleCat {...p} frame={f} facing={-1} smear={0.8} pose={{armL: 170, armR: 170, legL: -20, legR: 20, tail: 50, squash: 1.1}} face={{eyes: 'wide', mouth: 'shout', ears: 'flat', sweat: 2}} />
            </Rot>
          );
        }
        const p = place(c, [doorX + 0.2, 0, -2.2], 1.5);
        if (lying) {
          return (
            <>
              <Rot deg={-88} x={p.x} y={p.y}>
                <MaleCat {...p} y={p.y + 30 * p.scale} frame={f} facing={-1} pose={{armL: 170, armR: 170, squash: 0.9}} face={{eyes: 'x', mouth: 'wobble', ears: 'flat'}} />
              </Rot>
              <DizzyStars frame={G} x={p.x - 300 * p.scale} y={p.y - 60 * p.scale} r={80 * p.scale} amount={ramp(G, [B.faceplant + 4, B.faceplant + 10])} />
            </>
          );
        }
        return (
          <>
            <Rot deg={-88 * (1 - rising)} x={p.x} y={p.y}>
              <MaleCat
                {...p}
                frame={f}
                facing={-1}
                pose={
                  rising < 1
                    ? {...pant(f), armL: 40, armR: 40}
                    : relief
                      ? {...idle(f), armL: 20 + Math.sin(f) * 10, armR: 20, squash: 0.97 + Math.sin(f / 6) * 0.02}
                      : G < 3060
                        ? {...idle(f), armL: within(f, 3010, 3060) ? 60 + Math.sin(f * 1.3) * 30 : 10, armR: 10, lean: 6}
                        : {...idle(f), headTilt: 6}
                }
                face={
                  relief
                    ? {eyes: 'happy', mouth: 'smile', ears: 'droop', blush: 0.3}
                    : G >= 3160
                      ? {eyes: 'normal', lookX: 1, mouth: 'smile', ears: 'up'}
                      : {eyes: 'normal', mouth: 'pant', ears: 'droop', sweat: 2}
                }
              />
            </Rot>
            {relief ? (
              <g opacity={1 - ramp(G, [3070, 3110])}>
                <ellipse cx={p.x - 90 * p.scale} cy={p.y - 300 * p.scale - ramp(G, [3060, 3110]) * 40} rx={40 * p.scale} ry={24 * p.scale} fill="#fff" stroke="#141214" strokeWidth={4} />
              </g>
            ) : null}
          </>
        );
      }}
    </Stage>
  );
};
