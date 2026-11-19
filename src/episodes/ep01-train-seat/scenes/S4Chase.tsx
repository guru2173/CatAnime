import React from 'react';
import {Easing, useCurrentFrame} from 'remotion';
import {Stage} from '../../../engine/Stage';
import {CamParams, place, project, shakeFromEvents, Vec3} from '../../../engine/CinematicCamera';
import {keys, noise, ramp, stepped} from '../../../engine/time';
import {idle, pant, run} from '../../../engine/motion';
import {GATE_XS, HILL_SLOPE, HillStreet, Overpass, OVERPASS_Y, STAIR, Stairwell, StationPlatform, TicketGates, TRACK} from '../../../components/world/Sets';
import {FemaleCat, KidCat, MaleCat} from '../../../components/cats/Cast';
import {ImpactFrame, Sparkles, SpeedLines} from '../../../components/fx/Fx';
import {B, SCENES} from '../timeline';
import {Earbud, faceCam, Rot, Tricycle} from '../shared';

/** Local hill-street coordinates → world (the street group is tilted by -HILL_SLOPE around z). */
const hill = ([x, y, z]: Vec3): Vec3 => {
  const c = Math.cos(HILL_SLOPE);
  const s = Math.sin(HILL_SLOPE);
  return [x * c + y * s, -x * s + y * c, z];
};

const WIN_X = -3.8; // a window on the train car (local x)
const departX = (G: number) => (G >= B.depart1 ? 0.5 * 0.0006 * (G - B.depart1) ** 2 : 0);

export const S4Chase: React.FC = () => {
  const G = useCurrentFrame() + SCENES.s4.from;
  const f = stepped(G);

  /* ---------- 1. Through the departing window, she holds up his earbud ---------- */
  if (G < B.window[1]) {
    const L = G - B.window[0];
    const tx = departX(G);
    const wx = tx + WIN_X;
    const camX = wx + 0.5;
    const cam: CamParams = {position: [camX - 0.6, 1.35, -3.6], lookAt: [camX, 1.3, 0.3], fov: 46};
    const touch = L >= 30;
    const shock = L >= 45;
    const himX = wx + 1.25 - Math.max(0, G - B.window[0] - 80) * 0.03;
    return (
      <Stage cam={cam} move={{handheld: 3}} light="interior" world={<StationPlatform name="KOMOREBI" trainX={tx} />}>
        {(c) => {
          // window rectangle on screen
          const a = project(c, [wx - 0.41, 1.88, 0.07]);
          const b = project(c, [wx + 0.41, 1.02, 0.07]);
          const her = place(c, [wx + 0.05, 0.05, 0.8], 1.45);
          const m = place(c, [himX, 0, -1.4], 1.5);
          const budX = Math.min(a.x, b.x) + Math.abs(b.x - a.x) * 0.5;
          const budY = a.y + (b.y - a.y) * 0.35;
          return (
            <>
              <clipPath id="win">
                <rect x={Math.min(a.x, b.x)} y={a.y} width={Math.abs(b.x - a.x)} height={b.y - a.y} />
              </clipPath>
              <g clipPath="url(#win)">
                <rect x={Math.min(a.x, b.x)} y={a.y} width={Math.abs(b.x - a.x)} height={b.y - a.y} fill="#f6efe2" />
                <FemaleCat {...her} frame={f} facing={1} earbud pose={{...idle(f, 2), armR: 150, handScale: 1.5}} face={{eyes: 'half', lookX: 1, mouth: 'smirk', blush: 0.3}} />
                <Earbud x={budX} y={budY} s={her.scale * 2.2} glint={1.2} />
                <rect x={Math.min(a.x, b.x)} y={a.y} width={Math.abs(b.x - a.x)} height={b.y - a.y} fill="#bfe0ff" opacity={0.28} />
                <path d={`M ${Math.min(a.x, b.x) + 20} ${b.y} L ${Math.min(a.x, b.x) + 80} ${a.y} L ${Math.min(a.x, b.x) + 110} ${a.y} L ${Math.min(a.x, b.x) + 50} ${b.y} Z`} fill="#fff" opacity={0.35} />
              </g>
              <MaleCat
                {...m}
                frame={f}
                facing={1}
                pose={touch ? {...idle(f), armR: 150, handScale: 1.3} : idle(f)}
                face={shock ? {eyes: 'wide', lookX: 1, mouth: 'open', ears: 'perk', sweat: 2} : {eyes: 'normal', lookX: 1, mouth: 'smile'}}
              />
              <Sparkles frame={G} count={5} seed="bud2" area={[budX - 60, budY - 60, 120, 120]} amount={shock ? 1 : 0} />
            </>
          );
        }}
      </Stage>
    );
  }

  /* ---------- 2. Resolve: determination close-up + crouch ---------- */
  if (G < B.resolve[1]) {
    const L = G - B.resolve[0];
    const crouch = ramp(L, [20, 50]);
    const cam = faceCam(0, -1.6, 2.2 - crouch * 0.3, 44, 1.2 - crouch * 0.15);
    return (
      <Stage
        cam={cam}
        move={{zoom: 1 + crouch * 0.08, shake: crouch * 4}}
        light="interior"
        world={<StationPlatform name="KOMOREBI" trainX={departX(G)} />}
        fx={<SpeedLines frame={G} mode="radial" intensity={0.4 + crouch * 0.6} inner={380} />}
      >
        {(c) => (
          <MaleCat
            {...place(c, [0, 0, -1.6], 1.5)}
            frame={f}
            pose={{...idle(f), squash: 1 - crouch * 0.15, lean: crouch * 18, armL: 20 - crouch * 50, armR: 20 - crouch * 50, tail: 40}}
            face={{eyes: 'wide', mouth: 'flat', brow: 1, ears: 'perk', redFace: 0}}
          />
        )}
      </Stage>
    );
  }

  /* ---------- 3. Sprint up the stairwell (smear frames) ---------- */
  if (G < B.stairs[1]) {
    const t = ramp(G, [B.stairs[0], B.stairs[1] - 10], [0, 1], Easing.linear);
    const total = STAIR.steps * STAIR.run + 2.5;
    const x = -1 + t * total;
    const y = Math.max(0, Math.min(STAIR.steps * STAIR.rise, ((x + STAIR.run / 2) / STAIR.run) * STAIR.rise));
    const cam: CamParams = {position: [x - 2.6, y + 0.5, 1.0], lookAt: [x + 1.5, y + 1.3, -0.3], fov: 66};
    const r = run(f, 1.2);
    return (
      <Stage cam={cam} move={{shake: 3}} light="interior" world={<Stairwell />} fx={<SpeedLines frame={G} mode="horizontal" intensity={0.5} dir={-1} />}>
        {(c) => <MaleCat {...place(c, [x, y, -0.2], 1.5)} frame={f} pose={r} smear={r.smear} face={{eyes: 'wide', mouth: 'shout', brow: 1, ears: 'flat', sweat: 1}} />}
      </Stage>
    );
  }

  /* ---------- 4. Overpass sprint + railing vault ---------- */
  if (G < B.overpass[1]) {
    const runZ = keys(G, [B.overpass[0], B.vault], [-9, 2], Easing.linear);
    const vt = ramp(G, [B.vault, B.overpass[1]], [0, 1], Easing.linear);
    // slow-mo hang at the apex
    const vs = vt < 0.35 ? vt / 0.35 * 0.45 : vt < 0.6 ? 0.45 + ((vt - 0.35) / 0.25) * 0.1 : 0.55 + ((vt - 0.6) / 0.4) * 0.45;
    const vaulting = G >= B.vault;
    const px = vaulting ? vs * 3.4 : 0;
    const pz = vaulting ? 2 + vs * 1.5 : runZ;
    const py = OVERPASS_Y + (vaulting ? Math.sin(Math.PI * Math.min(1, vs * 1.6)) * 1.6 - Math.max(0, vs - 0.62) * 9 : 0);
    const cam: CamParams = {position: [-6.5, OVERPASS_Y + 1.6, pz - 1.5], lookAt: [0.6, OVERPASS_Y + 0.9, pz + 0.4], fov: 50};
    const r = run(f, 1.25);
    const apex = vt > 0.3 && vt < 0.62;
    return (
      <Stage
        cam={cam}
        move={{zoom: apex ? 1.08 : 1}}
        light="morning"
        sky="#cfe6ff"
        fog={[60, 200]}
        world={<Overpass frame={G} />}
        fx={apex ? <SpeedLines frame={G} mode="radial" intensity={0.6} color="#ffffff" inner={360} /> : <SpeedLines frame={G} mode="horizontal" intensity={0.35} dir={-1} />}
      >
        {(c) => {
          const p = place(c, [px, py, pz], 1.5);
          return vaulting ? (
            <Rot deg={vs * 50} x={p.x} y={p.y - 160 * p.scale}>
              <MaleCat {...p} frame={f} pose={{legL: 70, legR: -30, liftL: 60, liftR: 40, armL: 160, armR: 120, tail: 60, lean: 10}} face={{eyes: apex ? 'wide' : 'wide', mouth: apex ? 'grin' : 'shout', brow: 1, ears: 'flat'}} />
            </Rot>
          ) : (
            <MaleCat {...p} frame={f} pose={r} smear={r.smear} face={{eyes: 'wide', mouth: 'shout', brow: 1, ears: 'flat'}} />
          );
        }}
      </Stage>
    );
  }

  /* ---------- 5. Hilltop: lands by the kid's tricycle, borrows it ---------- */
  if (G < B.street[1]) {
    const L = G - B.street[0];
    const land = ramp(L, [0, 6]);
    const grab = G >= B.grabTrike;
    const mounted = G >= B.grabTrike + 20;
    const cam: CamParams = {position: hill([5.2, 1.6, 7.5]), lookAt: hill([5.2, 0.9, 0]), fov: 50, roll: -6};
    const shake = shakeFromEvents(G, [{at: B.street[0] + 6, amp: 18}]);
    return (
      <Stage cam={cam} move={{shake}} light="morning" sky="#cfe6ff" fog={[70, 220]} world={<HillStreet trainX={-14} />} fx={<ImpactFrame frame={G} at={B.street[0] + 6} cx={760} cy={700} />}>
        {(c) => {
          const kid = place(c, hill([7.4, 0, 2.6]), 1.0);
          const trikeX = mounted ? 5.0 : 6.5;
          const tr = place(c, hill([trikeX, 0, 2.7]), 1.5);
          const m = place(c, hill([mounted ? 5.0 : 4.6, (1 - land) * 3 + (mounted ? 0.18 : 0), 2.5]), 1.5);
          return (
            <>
              <Tricycle x={tr.x} y={tr.y} s={tr.scale * 1.15} />
              <KidCat
                {...kid}
                frame={f}
                facing={-1}
                pose={grab ? {...idle(f), armR: 150 + Math.sin(f) * 20, armL: 40} : {...idle(f), armL: 30}}
                face={grab ? {eyes: 'angry', mouth: 'shout', brow: 1, ears: 'flat'} : {eyes: 'normal', lookX: 1, mouth: 'o', ears: 'perk'}}
              />
              <MaleCat
                {...m}
                frame={f}
                pose={mounted ? {sit: true, legL: 0, armL: 70, armR: 70, lean: 10} : land < 1 ? {squash: 1.15, armL: 150, armR: 150} : grab ? {...idle(f), armR: 80, lean: 12} : {...idle(f), squash: L < 12 ? 0.85 : 1}}
                face={grab ? {eyes: 'wide', mouth: 'grin', brow: 1, ears: 'perk', blush: 0.3} : {eyes: 'wide', lookX: 1, mouth: 'o', ears: 'perk'}}
              />
            </>
          );
        }}
      </Stage>
    );
  }

  /* ---------- 6. Downhill tricycle race beside the elevated train ---------- */
  if (G < B.ride[1]) {
    const L = G - B.ride[0];
    const T = B.ride[1] - B.ride[0];
    const u = L / T;
    const x = 5 + 150 * (u * u * 0.55 + u * 0.45);
    const v = (150 * (2 * u * 0.55 + 0.45)) / T; // m per frame
    const trainX = x - 28 + u * 30;
    const cam: CamParams = {position: hill([x + 0.8, 2.0, 7.0]), lookAt: hill([x + 1.2, 2.6, -3]), fov: 56, roll: -5};
    const bells = [3890, 4010, 4150, 4255];
    const ring = bells.some((b) => G >= b && G < b + 18);
    return (
      <Stage
        cam={cam}
        move={{shake: 2 + u * 4, handheld: 2}}
        light="morning"
        sky="#cfe6ff"
        fog={[70, 240]}
        world={<HillStreet trainX={trainX} />}
        fx={<SpeedLines frame={G} mode="horizontal" intensity={0.35 + u * 0.5} dir={-1} />}
      >
        {(c) => {
          const tr = place(c, hill([x, 0, 2.6]), 1.5);
          const m = place(c, hill([x - 0.1, 0.18, 2.5]), 1.5);
          const knees = Math.sin(f * 1.4) * 25;
          const kid = place(c, hill([7.4, 0, 2.6]), 1.0);
          const trainHead = project(c, hill([trainX + 27.6, TRACK.height + 2.6, TRACK.z]));
          return (
            <>
              {L < 90 ? <KidCat {...kid} frame={f} facing={1} pose={{...idle(f), armR: 150 + Math.sin(f) * 25}} face={{eyes: 'angry', mouth: 'shout', brow: 1, ears: 'flat'}} /> : null}
              <Tricycle x={tr.x} y={tr.y} s={tr.scale * 1.15} spin={-x * 6} />
              <MaleCat
                {...m}
                frame={f}
                pose={{sit: true, legL: knees, legR: -knees, liftL: 30, liftR: 30, armL: 75, armR: 75, lean: 8 + u * 10, tail: 70, hop: Math.abs(noise(`bump${f}`)) * -6}}
                face={{eyes: 'wide', mouth: u > 0.6 ? 'grin' : 'shout', brow: 1, ears: 'flat', sweat: 1}}
              />
              {ring ? (
                <g stroke="#141214" strokeWidth={4} strokeLinecap="round">
                  {[0, 1, 2].map((k) => (
                    <line key={k} x1={tr.x + 110 * tr.scale} y1={tr.y - (140 + k * 18) * tr.scale} x2={tr.x + (140 + k * 6) * tr.scale} y2={tr.y - (150 + k * 26) * tr.scale} />
                  ))}
                </g>
              ) : null}
              {v > 0 && trainHead.x > 0 && trainHead.x < 1920 && u > 0.7 ? <Sparkles frame={G} count={3} seed="race" area={[trainHead.x - 60, trainHead.y - 60, 120, 120]} /> : null}
            </>
          );
        }}
      </Stage>
    );
  }

  /* ---------- 7. Ticket gate burst ---------- */
  if (G < B.gate[1]) {
    const z = keys(G, [B.gate[0], B.gateBurst, B.gate[1]], [11, 0.4, -4.5], Easing.linear);
    const burst = ramp(G, [B.gateBurst - 1, B.gateBurst + 4], [0, 1], Easing.out(Easing.back(2)));
    const cam: CamParams = {position: [1.2, 1.3, -4.6], lookAt: [0, 1.0, 3], fov: 54};
    const r = run(f, 1.3);
    const shake = shakeFromEvents(G, [{at: B.gateBurst, amp: 22}]);
    return (
      <Stage cam={cam} move={{shake}} light="interior" sky="#fff6e8" world={<TicketGates burstGate={2} burst={burst} />} fx={<ImpactFrame frame={G} at={B.gateBurst} />}>
        {(c) => <MaleCat {...place(c, [GATE_XS[2], 0, z], 1.5)} frame={f} pose={{...r, headTurn: 0}} smear={G > B.gateBurst ? 0.9 : r.smear} face={{eyes: 'wide', mouth: 'shout', brow: 1, ears: 'flat', sweat: 2}} />}
      </Stage>
    );
  }

  /* ---------- 8. Next station: skid to a stop as the train glides in ---------- */
  const p = ramp(G, [B.arrive[0], 4560], [0, 1], Easing.out(Easing.quad));
  const trainX = -70 * (1 - p);
  const skid = ramp(G, [B.skid, B.skid + 18]);
  const himX = keys(G, [B.arrive[0], B.skid, B.skid + 18], [-9, 0.8, 2], Easing.linear);
  const cam: CamParams = {position: [-1.2, 1.3, -6.2], lookAt: [0.8, 1.1, 0.8], fov: 50};
  const arrived = G >= B.skid + 18;
  const r = run(f, 1.3);
  return (
    <Stage cam={cam} move={{handheld: 2}} light="interior" world={<StationPlatform name="SAKURA-DORI" accent="#c9506a" trainX={trainX} />}>
      {(c) => {
        const m = place(c, [himX, 0, -1.5], 1.5);
        return (
          <>
            {G < B.skid ? (
              <MaleCat {...m} frame={f} facing={-1} pose={r} smear={r.smear} face={{eyes: 'wide', mouth: 'shout', brow: 1, ears: 'flat'}} />
            ) : arrived ? (
              <MaleCat {...m} frame={f} pose={pant(f)} face={{eyes: 'normal', lookX: 1, mouth: 'pant', ears: 'droop', sweat: 3}} />
            ) : (
              <MaleCat {...m} frame={f} facing={-1} pose={{lean: -24, legL: 30, legR: 20, armL: 60, armR: 90, squash: 0.94}} face={{eyes: 'wide', mouth: 'open', ears: 'flat'}} />
            )}
            {!arrived && G >= B.skid
              ? [0, 1, 2, 3].map((k) => <circle key={k} cx={m.x + (40 + k * 30) * m.scale} cy={m.y - 10 - k * 4} r={(16 + k * 6) * m.scale * (1 - skid * 0.5)} fill="#efe7da" stroke="#141214" strokeWidth={3} opacity={1 - skid} />)
              : null}
          </>
        );
      }}
    </Stage>
  );
};

