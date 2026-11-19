import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {Stage} from '../../../engine/Stage';
import {CamParams, place, project, shakeFromEvents} from '../../../engine/CinematicCamera';
import {impact, keys, noise, ramp, stepped, within} from '../../../engine/time';
import {idle} from '../../../engine/motion';
import {MetroInterior, POLE} from '../../../components/world/MetroInterior';
import {FemaleCat, MaleCat} from '../../../components/cats/Cast';
import {DizzyStars, ImpactFrame, Sparkles, SpeedLines, Steam} from '../../../components/fx/Fx';
import {B, SCENES} from '../timeline';
import {Bump, Earbud, faceCam, headScreen, OverlayPole, SeatedCrowd, sideCam} from '../shared';

const TRAVEL_SPEED = 0.28;
const MZ = -1.15; // he stands just behind the pole line
const FZ = -0.86;

export const S2Chivalry: React.FC = () => {
  const G = useCurrentFrame() + SCENES.s2.from;
  const f = stepped(G);
  const travel = G * TRAVEL_SPEED;
  const world = (extra: Partial<React.ComponentProps<typeof MetroInterior>> = {}) => (
    <MetroInterior frame={G} travel={travel} speed={TRAVEL_SPEED} outside="city" sway={0.004} {...extra} />
  );
  const bonkShake = shakeFromEvents(G, [
    {at: B.bonk, amp: 26},
    {at: B.jolt, amp: 18, decay: 0.08},
  ]);

  const MX = within(G, SCENES.s2.from, 600) ? -0.75 : -1.15;
  const FX = 0.75;

  /* ---------------- Shot 2A: awkward standoff + "please, sit" ---------------- */
  if (G < B.bowAntic) {
    const cam = sideCam(0.8);
    const glance = within(f, B.glance, B.glance + 30);
    const please = f >= B.please;
    const pa = ramp(f, [B.please, B.please + 10]);
    return (
      <Stage cam={cam} move={{handheld: 3}} light="interior" world={world()}>
        {(c) => (
          <>
            <SeatedCrowd cam={c} frame={f} moving />
            <MaleCat
              {...place(c, [MX, 0, FZ], 1.5)}
              frame={f}
              earbud
              pose={{...idle(f), armR: 6 + pa * 64, lean: pa * 8, headTurn: please ? 0.5 : -0.4}}
              face={
                please
                  ? {eyes: 'happy', mouth: 'smile', blush: 0.5, ears: 'up'}
                  : glance
                    ? {eyes: 'normal', lookX: -1, mouth: 'flat', sweat: 1, ears: 'droop'}
                    : {eyes: 'normal', lookX: 1, mouth: 'neutral'}
              }
            />
            <FemaleCat
              {...place(c, [FX, 0, FZ], 1.45)}
              frame={f}
              facing={-1}
              holdingR="book"
              pose={{...idle(f, 2), armR: 30, headTilt: please ? 8 : 0}}
              face={glance ? {eyes: 'normal', lookX: 1, mouth: 'neutral'} : please ? {eyes: 'normal', lookX: 1, mouth: 'neutral', brow: -0.4} : {eyes: 'dot', lookY: 0.7, mouth: 'neutral'}}
            />
          </>
        )}
      </Stage>
    );
  }

  /* ---------------- Shot 2B/2C: the over-bow, BONK, earbud launch ---------------- */
  if (G < B.insert[0]) {
    const cam = sideCam(0.95, -0.35);
    // anticipation (lean back) -> violent over-bow -> bonk -> recoil wobble
    const lean =
      f < B.bowAntic + 26
        ? keys(f, [B.bowAntic, B.bowAntic + 26], [0, -14], Easing.out(Easing.quad))
        : f < B.bonk
          ? keys(f, [B.bowAntic + 26, B.bonk], [-14, 40], Easing.in(Easing.cubic))
          : -impact(f, B.bonk, 34, 0.09, 0.55);
    const hit = f >= B.bonk;
    const dazed = hit ? ramp(f, [B.bonk, B.bonk + 6]) * (1 - ramp(f, [B.insert[0] - 10, B.insert[0]])) : 0;
    const earbudFlying = f >= B.earbudPop;
    return (
      <AbsoluteFill>
        <Stage
          cam={cam}
          move={{shake: bonkShake, handheld: 2}}
          light="interior"
          world={world()}
          fx={<ImpactFrame frame={G} at={B.bonk} cx={760} cy={430} />}
        >
          {(c) => {
            const m = place(c, [MX, 0, MZ], 1.5);
            const fe = place(c, [FX, 0, FZ], 1.45);
            const h = headScreen(m, lean, 1);
            // earbud arc: ear -> floor bounces -> slides under her shoe
            const ear = {x: h.x + h.r * 0.95, y: h.y};
            const shoe = {x: fe.x + 18 * fe.scale, y: fe.y - 6};
            const floorY = fe.y - 4;
            const t = G - B.earbudPop;
            let bx = ear.x;
            let by = ear.y;
            let rot = 0;
            if (earbudFlying) {
              const T1 = 28;
              if (t < T1) {
                const u = t / T1;
                bx = ear.x + (shoe.x - 140 - ear.x) * u;
                by = ear.y + (floorY - ear.y) * u - Math.sin(Math.PI * u) * 260;
                rot = t * 40;
              } else if (t < T1 + 18) {
                const u = (t - T1) / 18;
                bx = shoe.x - 140 + 80 * u;
                by = floorY - Math.sin(Math.PI * u) * 70;
                rot = t * 30;
              } else if (t < T1 + 30) {
                const u = (t - T1 - 18) / 12;
                bx = shoe.x - 60 + 40 * u;
                by = floorY - Math.sin(Math.PI * u) * 22;
                rot = t * 20;
              } else {
                const u = Math.min(1, (t - T1 - 30) / 16);
                bx = shoe.x - 20 + 22 * Easing.out(Easing.quad)(u);
                by = floorY;
                rot = 90;
              }
            }
            return (
              <>
                <SeatedCrowd cam={c} frame={f} moving />
                <MaleCat
                  {...m}
                  frame={f}
                  earbud={!earbudFlying}
                  pose={{
                    ...idle(f),
                    lean,
                    armL: f < B.bonk ? 10 + Math.max(0, lean) : 30 + noise(`a${f}`) * 20,
                    armR: f < B.bonk ? 10 + Math.max(0, lean) : 40 + noise(`b${f}`) * 20,
                    squash: f < B.bowAntic + 26 ? 1.05 : hit && f < B.bonk + 4 ? 0.88 : 1,
                    strings: lean * -0.6,
                    tail: lean * 0.8,
                  }}
                  face={
                    hit
                      ? {eyes: f < B.bonk + 8 ? 'x' : 'spiral', mouth: 'wobble', ears: 'flat'}
                      : f >= B.bowAntic + 26
                        ? {eyes: 'shut', mouth: 'smile', blush: 0.5}
                        : {eyes: 'happy', mouth: 'smile', blush: 0.4}
                  }
                />
                <OverlayPole cam={c} x={POLE.x} z={POLE.z} />
                <Bump x={h.x + h.r * 0.15} y={h.y - h.r * 0.95} s={m.scale * 1.3} grow={hit ? ramp(f, [B.bonk, B.bonk + 8]) : 0} />
                <DizzyStars frame={G} x={h.x} y={h.y - h.r * 1.2} r={h.r * 1.25} amount={dazed} />
                <FemaleCat
                  {...fe}
                  frame={f}
                  facing={-1}
                  holdingR="book"
                  pose={{...idle(f, 2), armR: 30}}
                  face={hit ? {eyes: 'dot', lookY: 0.7, mouth: 'neutral'} : {eyes: 'normal', lookX: 1, mouth: 'neutral'}}
                />
                {earbudFlying ? <Earbud x={bx} y={by} s={fe.scale * 0.9} rot={rot} /> : null}
              </>
            );
          }}
        </Stage>
      </AbsoluteFill>
    );
  }

  /* ---------------- Shot 2D: floor-level insert, earbud under her shoe ---------------- */
  if (G < B.insert[1]) {
    const t = ramp(G, [B.insert[0], B.insert[1]]);
    const cam: CamParams = {position: [0.95 - t * 0.1, 0.16, 0.55 - t * 0.25], lookAt: [0.62, 0.12, -0.9], fov: 42};
    return (
      <Stage cam={cam} move={{handheld: 2}} light="interior" world={world()}>
        {(c) => {
          const fe = place(c, [FX, 0, FZ], 1.45);
          const m = place(c, [MX, 0, MZ], 1.5);
          const bud = project(c, [FX - 0.05, 0.03, FZ + 0.12]);
          const glint = within(f, B.insert[0] + 30, B.insert[0] + 60) ? 1.4 : 0;
          return (
            <>
              <MaleCat {...m} frame={f} pose={{...idle(f), lean: 30, headTilt: 10}} face={{eyes: 'wide', lookY: 1, lookX: 0.6, mouth: 'o', ears: 'perk'}} />
              <Earbud x={bud.x} y={bud.y} s={bud.pxPerUnit / 300} rot={90} glint={glint} />
              <FemaleCat {...fe} frame={f} facing={-1} holdingR="book" pose={{...idle(f, 2), armR: 30}} face={{eyes: 'dot', lookY: 0.7}} />
              <Sparkles frame={G} count={4} seed="bud" area={[bud.x - 60, bud.y - 80, 120, 80]} amount={glint ? 1 : 0} />
            </>
          );
        }}
      </Stage>
    );
  }

  /* ---------------- Shot 2E: her close-up — looks up, slow blink, tilt, smirk ---------------- */
  if (G < B.herLook[1]) {
    const L = G - B.herLook[0];
    const cam = faceCam(FX, FZ, 1.25 - ramp(L, [0, 170]) * 0.2, 38, 1.32, -0.25);
    const lookingUp = L >= 22;
    const blink = L >= 50 && L < 74;
    const smirk = L >= 95;
    const eyes = !lookingUp ? 'dot' : blink ? (L < 56 || L >= 68 ? 'half' : 'shut') : smirk ? 'half' : 'normal';
    return (
      <Stage cam={cam} light="interior" world={world()} fx={<svg width={1920} height={1080} style={{position: 'absolute'}}><Sparkles frame={G} count={10} seed="her" amount={ramp(L, [85, 105]) * 0.9} /></svg>}>
        {(c) => (
          <>
            <SeatedCrowd cam={c} frame={f} moving opacity={0.8} />
            <FemaleCat
              {...place(c, [FX, 0, FZ], 1.45)}
              frame={f}
              facing={-1}
              holdingR="book"
              pose={{...idle(f, 2), armR: 30, headTilt: smirk ? 9 : 0}}
              face={{eyes: eyes as 'normal', lookX: lookingUp ? 1 : 0, lookY: lookingUp ? 0 : 0.7, mouth: smirk ? 'smirk' : 'neutral', blush: smirk ? 0.35 : 0}}
            />
          </>
        )}
      </Stage>
    );
  }

  /* ---------------- Shot 2F: his close-up — blush overload ---------------- */
  if (G < B.blush[1]) {
    const L = G - B.blush[0];
    const cam = faceCam(MX, MZ, 1.3 - ramp(L, [0, 220]) * 0.25, 38, 1.32, 0.2);
    const red = ramp(L, [40, 120]);
    const tremble = L > 120 ? noise(`tr${f}`) * 3 : 0;
    return (
      <Stage
        cam={cam}
        move={{dutch: ramp(L, [60, 200], [0, -8]), zoom: 1 + ramp(L, [120, 220]) * 0.06}}
        light="interior"
        world={world()}
        fx={<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(255,80,110,0) 45%, rgba(255,60,90,0.35) 100%)', opacity: red}} />}
      >
        {(c) => {
          const m = place(c, [MX, 0, MZ], 1.5);
          const h = headScreen(m, 0, 1);
          return (
            <>
              <MaleCat
                {...m}
                x={m.x + tremble}
                frame={f}
                pose={{...idle(f), squash: 1 - red * 0.03, armL: -20, armR: -20}}
                face={{
                  eyes: L < 20 ? 'normal' : 'wide',
                  lookX: -0.3,
                  mouth: red > 0.5 ? 'wobble' : 'o',
                  blush: ramp(L, [0, 40]),
                  redFace: red,
                  ears: L > 70 ? 'flat' : 'perk',
                  sweat: L > 120 ? 3 : L > 60 ? 1 : 0,
                }}
              />
              <Bump x={h.x + h.r * 0.15} y={h.y - h.r * 0.95} s={m.scale * 1.3} grow={1} />
              <Steam frame={G} x={h.x} y={h.y - h.r * 1.1} amount={ramp(L, [100, 120])} />
            </>
          );
        }}
      </Stage>
    );
  }

  /* ---------------- Shot 2G: she offers the seat; he short-circuits; train jolts ---------------- */
  if (G < B.offer[1]) {
    const cam = sideCam(0.85);
    const offer = ramp(f, [B.offer[0] + 20, B.offer[0] + 32]);
    const spiral = f >= B.offer[0] + 40;
    const salute = f >= B.offer[0] + 80;
    const jolt = impact(G, B.jolt, 24, 0.07, 0.45);
    return (
      <Stage cam={cam} move={{shake: bonkShake, handheld: 2}} light="interior" world={world()}>
        {(c) => {
          const m = place(c, [-0.75, 0, FZ], 1.5);
          const h = headScreen(m, jolt, 1);
          return (
            <>
              <SeatedCrowd cam={c} frame={f} moving />
              <MaleCat
                {...m}
                frame={f}
                pose={{...idle(f), lean: jolt, armR: salute ? 150 : -10, armL: -6, squash: salute ? 1.06 : 1, tail: 40, strings: -jolt}}
                face={{eyes: spiral ? 'spiral' : 'wide', mouth: salute ? 'grin' : 'wobble', redFace: 0.75, ears: 'flat', sweat: 2}}
              />
              <Bump x={h.x + h.r * 0.15} y={h.y - h.r * 0.95} s={m.scale * 1.3} grow={1} />
              <Steam frame={G} x={h.x} y={h.y - h.r * 1.1} amount={0.8} />
              <FemaleCat
                {...place(c, [FX, 0, FZ], 1.45)}
                frame={f}
                facing={-1}
                holdingR="book"
                pose={{...idle(f, 2), armL: 6 + offer * 80, armR: 30, lean: -jolt * 0.3, headTilt: 8}}
                face={{eyes: offer > 0.5 ? 'happy' : 'normal', lookX: 1, mouth: 'smile', blush: 0.3}}
              />
            </>
          );
        }}
      </Stage>
    );
  }

  /* ---------------- Shot 2H: overthinking push-in, Dutch tilt, heartbeat ---------------- */
  const L = G - B.spiralPush[0];
  const p = ramp(L, [0, 185], [0, 1], Easing.in(Easing.quad));
  const cam = faceCam(-0.75, FZ, 1.6 - p * 0.75, 40 - p * 8, 1.32);
  const beats = [1480, 1530, 1570, 1600, 1622, 1640];
  const hb = beats.reduce((a, b) => a + (G >= b ? Math.exp(-(G - b) / 4) : 0), 0);
  const flash = ramp(G, [SCENES.s2.to - 6, SCENES.s2.to]);
  return (
    <Stage
      cam={cam}
      move={{dutch: -4 - p * 14, zoom: 1 + hb * 0.05, shake: p * 6}}
      light="interior"
      world={world()}
      fx={
        <>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(40,0,10,0) 30%, rgba(40,0,10,0.75) 100%)', opacity: p}} />
          <SpeedLines frame={G} mode="radial" intensity={p} color="#1d1a1f" inner={460} />
          <AbsoluteFill style={{background: '#fff', opacity: flash}} />
        </>
      }
    >
      {(c) => {
        const m = place(c, [-0.75, 0, FZ], 1.5);
        return (
          <MaleCat
            {...m}
            x={m.x + noise(`t2${f}`) * (2 + p * 6)}
            frame={f}
            pose={{...idle(f), armL: -25, armR: -25, squash: 0.98}}
            face={{eyes: 'wide', lookX: noise(`lx${Math.floor(f / 5)}`), lookY: noise(`ly${Math.floor(f / 5)}`) * 0.5, mouth: 'wobble', redFace: 0.6, ears: 'flat', sweat: 3}}
          />
        );
      }}
    </Stage>
  );
};
