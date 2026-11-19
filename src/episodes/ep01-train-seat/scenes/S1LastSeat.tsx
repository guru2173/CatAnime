import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../../../engine/Stage';
import {CamParams, dollyZoom, place} from '../../../engine/CinematicCamera';
import {keys, ramp, stepped} from '../../../engine/time';
import {idle, walk} from '../../../engine/motion';
import {MetroInterior} from '../../../components/world/MetroInterior';
import {FemaleCat, MaleCat} from '../../../components/cats/Cast';
import {Sparkles, SpeedLines, TitleText} from '../../../components/fx/Fx';
import {B, SCENES} from '../timeline';
import {SeatedCrowd, sideCam} from '../shared';


export const S1LastSeat: React.FC = () => {
  const G = useCurrentFrame() + SCENES.s1.from;
  const f = stepped(G);

  /* ---------- character blocking (world space) ---------- */
  const maleT = ramp(f, [B.enter, B.enter + 95]);
  const femT = ramp(f, [B.enter + 12, B.enter + 105]);
  const stepIn = ramp(f, [B.step, B.step + 14]);
  const maleX = keys(maleT, [0, 0.3, 0.55, 1], [-3.65, -3.6, -2.6, -0.98]) + stepIn * 0.3;
  const maleZ = keys(maleT, [0, 0.3, 0.55, 1], [-3.6, -2.1, -1.2, -0.86]);
  const femX = keys(femT, [0, 0.3, 0.55, 1], [3.65, 3.6, 2.6, 0.98]) - stepIn * 0.3;
  const femZ = keys(femT, [0, 0.3, 0.55, 1], [-3.6, -2.1, -1.2, -0.86]);
  const maleWalking = maleT > 0 && maleT < 1;
  const femWalking = femT > 0 && femT < 1;

  const noticed = f >= B.notice;
  const locked = f >= B.step + 14;

  const malePose = maleWalking ? walk(f, 1.1) : stepIn > 0 && stepIn < 1 ? walk(f, 1.6, 0.6) : idle(f);
  const femPose = femWalking ? walk(f, 1, 0.8) : stepIn > 0 && stepIn < 1 ? walk(f, 1.6, 0.5) : idle(f, 2);

  const maleFace = locked
    ? {eyes: 'wide' as const, mouth: 'o' as const, ears: 'perk' as const, blush: ramp(f, [B.step + 14, B.lock], [0, 0.6])}
    : noticed
      ? {eyes: 'normal' as const, lookX: 1, lookY: 0.4, ears: 'perk' as const, mouth: 'neutral' as const}
      : {eyes: 'normal' as const, lookX: 0.6, mouth: 'neutral' as const};
  const femFace = locked
    ? {eyes: 'normal' as const, lookX: 0.7, mouth: 'neutral' as const}
    : noticed
      ? {eyes: 'half' as const, lookX: 0.8, lookY: 0.4, mouth: 'neutral' as const}
      : {eyes: 'dot' as const, lookY: 0.6, mouth: 'neutral' as const};

  /* ---------- shots ---------- */
  // Shot D: VERTIGO dolly-zoom on locked eyes
  if (G >= B.lock && G < B.vertigoEnd) {
    const t = ramp(G, [B.lock, B.vertigoEnd - 10], [0, 1]);
    const {fov, distance} = dollyZoom(t, 2.3, 24, 78);
    const subject: [number, number, number] = [0, 1.2, -0.86];
    const cam: CamParams = {position: [0, 1.3, subject[2] + distance], lookAt: [0, 1.18, subject[2]], fov};
    const hb = Math.max(
      Math.exp(-Math.max(0, G - B.heart1) / 5) * (G >= B.heart1 ? 1 : 0),
      Math.exp(-Math.max(0, G - B.heart1 - 8) / 5) * (G >= B.heart1 + 8 ? 1 : 0),
      Math.exp(-Math.max(0, G - B.heart2) / 5) * (G >= B.heart2 ? 1 : 0),
      Math.exp(-Math.max(0, G - B.heart2 - 8) / 5) * (G >= B.heart2 + 8 ? 1 : 0),
    );
    const blinkF = f >= 336 && f < 352;
    return (
      <AbsoluteFill>
        <Stage
          cam={cam}
          move={{zoom: 1 + hb * 0.045}}
          light="interior"
          sky="#ffe9d6"
          world={<MetroInterior frame={G} doorsOpen={1} outside="station" />}
          fx={
            <AbsoluteFill style={{pointerEvents: 'none'}}>
              <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(255,170,200,0) 35%, rgba(255,120,170,0.55) 100%)'}} />
              <SpeedLines frame={G} mode="radial" intensity={0.45} color="#ffffff" inner={520} />
              <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
                <Sparkles frame={G} count={26} seed="v1" amount={ramp(G, [B.lock, B.lock + 20])} />
              </svg>
            </AbsoluteFill>
          }
        >
          {(c) => {
            const m = place(c, [-0.68, 0, subject[2]], 1.5);
            const fe = place(c, [0.68, 0, subject[2]], 1.45);
            return (
              <>
                <SeatedCrowd cam={c} frame={f} opacity={0.45} />
                <MaleCat {...m} frame={f} facing={1} earbud pose={{...idle(f), headTilt: -4}} face={{eyes: 'sparkle', lookX: 1, mouth: 'o', ears: 'perk', blush: 0.9}} />
                <FemaleCat
                  {...fe}
                  frame={f}
                  facing={-1}
                  holdingR="book"
                  pose={{...idle(f, 2), armR: 30, headTilt: blinkF ? 6 : 0}}
                  face={{eyes: blinkF ? (f < 344 ? 'half' : 'shut') : 'normal', lookX: 1, mouth: blinkF ? 'smile' : 'neutral', blush: 0.4}}
                />
              </>
            );
          }}
        </Stage>
      </AbsoluteFill>
    );
  }

  // Shots A/B/C/E: side view across the car
  const push = keys(G, [0, B.enter, B.lock, B.vertigoEnd, SCENES.s1.to], [0, 0.35, 0.75, 0.2, 0.3]);
  const doors = G < B.chime1 + 10 ? 1 : 1 - ramp(G, [B.chime1 + 10, B.chime1 + 40]);
  const cam = sideCam(push);
  const shock = G >= B.vertigoEnd;
  return (
    <AbsoluteFill>
      <Stage
        cam={cam}
        move={{handheld: 3}}
        light="interior"
        sky="#e6f2ff"
        world={<MetroInterior frame={G} doorsOpen={doors} outside="station" stationName="KOMOREBI" />}
        fx={
          <>
            {G < B.title[1] + 10 ? (
              <TitleText
                frame={G}
                text={'The Last Seat on the 8:15 Train'}
                sub="Episode 1"
                opacity={keys(G, [B.title[0], B.title[0] + 15, B.title[1] - 10, B.title[1]], [0, 1, 1, 0])}
                y={-300}
              />
            ) : null}
          </>
        }
      >
        {(c) => {
          const seat = place(c, [0, 0.5, -1.62], 1);
          const m = place(c, [maleX, 0, maleZ], 1.5);
          const fe = place(c, [femX, 0, femZ], 1.45);
          return (
            <>
              <SeatedCrowd cam={c} frame={f} />
              {/* the last empty seat glows */}
              <Sparkles frame={G} count={6} seed="seat" area={[seat.x - 70, seat.y - 90, 140, 90]} amount={keys(G, [20, 60, B.lock], [0, 1, 0.6])} />
              {G >= B.enter - 10 ? (<MaleCat
                {...m}
                frame={f}
                facing={1}
                earbud
                pose={shock ? {...idle(f), armL: -10, armR: -10, squash: 1.03} : malePose}
                face={shock ? {eyes: 'wide', mouth: 'wobble', ears: 'up', blush: 0.8, sweat: 1, lookX: 1} : maleFace}
              />) : null}
              {G >= B.enter ? (<FemaleCat
                {...fe}
                frame={f}
                facing={-1}
                holdingR="book"
                pose={{...femPose, armR: 30 + (femPose.armR ?? 0) * 0.3}}
                face={shock ? {eyes: 'normal', lookX: 1, mouth: 'neutral', blush: 0.3} : femFace}
              />) : null}
            </>
          );
        }}
      </Stage>
    </AbsoluteFill>
  );
};
