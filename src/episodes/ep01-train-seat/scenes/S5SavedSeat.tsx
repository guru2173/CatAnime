import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {Stage} from '../../../engine/Stage';
import {CamParams, place, project} from '../../../engine/CinematicCamera';
import {keys, ramp, stepped} from '../../../engine/time';
import {pant, walk} from '../../../engine/motion';
import {DOOR_XS, MetroInterior, SEAT_XS, SEAT_Z} from '../../../components/world/MetroInterior';
import {FemaleCat, KidCat, MaleCat} from '../../../components/cats/Cast';
import {HeartStream, MusicNote, Sparkles, TitleText} from '../../../components/fx/Fx';
import {B, SCENES} from '../timeline';
import {Earbud, headScreen, SeatedCrowd, sideCam} from '../shared';

const HER_SEAT = 5;
const SAVED_SEAT = 4;
const HX = -0.62; // where he stands, facing her
const HZ = -0.86;

export const S5SavedSeat: React.FC = () => {
  const G = useCurrentFrame() + SCENES.s5.from;
  const f = stepped(G);
  const doorsOpen = G < B.share[0] + 10 ? ramp(G, [B.doorway[0], B.doorway[0] + 20]) : 1 - ramp(G, [B.share[0] + 10, B.share[0] + 40]);
  const departT = Math.max(0, G - 5150);
  const travel = 0.5 * 0.0012 * departT * departT;
  const moving = G >= 5150;
  const bagOnSeat = G < B.bagLift[0] + 20;
  const world = (
    <MetroInterior
      frame={G}
      doorsOpen={doorsOpen}
      outside={moving && travel > 30 ? 'city' : 'station'}
      travel={travel}
      speed={moving ? 0.1 : 0}
      stationName="SAKURA-DORI"
      emptySeats={[2, 3, 4, 5, 6]}
      bagSeats={bagOnSeat ? [SAVED_SEAT] : []}
    />
  );
  const crowdEmpty = [2, 3, 4, 5, 6];
  const herPos: [number, number, number] = [SEAT_XS[HER_SEAT], 0.44, SEAT_Z + 0.05];
  const seatPos: [number, number, number] = [SEAT_XS[SAVED_SEAT] - 0.04, 0.44, SEAT_Z + 0.05];

  /* ---------- A. Doors open: exhausted in the doorway ---------- */
  if (G < B.doorway[1]) {
    const L = G - B.doorway[0];
    const cam: CamParams = {position: [-2.0, 1.3, 0.9], lookAt: [DOOR_XS[0] - 0.2, 1.05, -2.2], fov: 50};
    const stepIn = ramp(L, [80, 115]);
    return (
      <Stage cam={cam} light="interior" world={world}>
        {(c) => (
          <MaleCat
            {...place(c, [DOOR_XS[0], 0, keys(stepIn, [0, 1], [-2.9, -2.0])], 1.5)}
            frame={f}
            facing={1}
            pose={stepIn > 0 && stepIn < 1 ? walk(f, 0.8, 0.6) : pant(f)}
            face={{eyes: L < 50 ? 'normal' : 'wide', lookX: L < 50 ? 0 : 1, mouth: 'pant', ears: 'droop', sweat: 3}}
          />
        )}
      </Stage>
    );
  }

  /* ---------- E. Easter egg: the kid glares through the window as the train leaves ---------- */
  if (G >= B.easterEgg[0]) {
    const L = G - B.easterEgg[0];
    const fade = ramp(G, [B.end[0], B.end[0] + 30]);
    const cam = sideCam(0.95, 0.2, 1.2, 56);
    return (
      <AbsoluteFill>
        <Stage cam={cam} light="interior" world={world} fx={<AbsoluteFill style={{background: '#000', opacity: fade}} />}>
          {(c) => {
            // window strip behind the bench (y 0.98..1.95 on the far wall)
            const tl = project(c, [-4, 1.95, -2.02]);
            const br = project(c, [4, 0.98, -2.02]);
            const kidX = 1.7 - 0.00018 * L * L;
            const kid = place(c, [kidX, 0.85, -2.35], 1.05);
            const him = place(c, seatPos, 1.5);
            const her = place(c, herPos, 1.45);
            const hh = headScreen(him, 0, 1, true);
            return (
              <>
                <clipPath id="egg-win">
                  <rect x={Math.min(tl.x, br.x)} y={tl.y} width={Math.abs(br.x - tl.x)} height={br.y - tl.y} />
                </clipPath>
                <g clipPath="url(#egg-win)">
                  <KidCat {...kid} frame={f} facing={1} pose={{armR: 150 + Math.sin(f * 1.5) * 20, armL: 60, squash: 1.05}} face={{eyes: 'angry', mouth: 'shout', brow: 1, ears: 'flat'}} />
                  <rect x={Math.min(tl.x, br.x)} y={tl.y} width={Math.abs(br.x - tl.x)} height={br.y - tl.y} fill="#cfe6ff" opacity={0.18} />
                </g>
                <SeatedCrowd cam={c} frame={f} empty={crowdEmpty} moving />
                <MaleCat {...him} frame={f} earbud pose={{sit: true, headTilt: 8}} face={{eyes: 'happy', mouth: 'smile', blush: 0.8, ears: 'up'}} />
                <Earbud x={hh.x - hh.r * 0.95} y={hh.y} s={him.scale * 1.2} />
                <FemaleCat {...her} frame={f} facing={-1} earbud pose={{sit: true, headTilt: -6}} face={{eyes: 'happy', mouth: 'smile', blush: 0.5}} />
                {[0, 1, 2].map((k) => {
                  const t = ((G + k * 22) % 66) / 66;
                  return <MusicNote key={k} x={(him.x + her.x) / 2 + Math.sin(t * 6 + k) * 30} y={hh.y - 60 - t * 160} s={0.9} opacity={1 - t} />;
                })}
              </>
            );
          }}
        </Stage>
        {G >= B.end[0] ? <TitleText frame={G} text="fin." sub="The Last Seat on the 8:15 Train" opacity={ramp(G, [B.end[0] + 22, B.end[0] + 40])} /> : null}
      </AbsoluteFill>
    );
  }

  /* ---------- B/C/D. The saved seat: earbud returned, backpack lifted, shared earbud ---------- */
  const closeIn = ramp(G, [B.share[0], B.share[0] + 70]);
  const cam = sideCam(0.75 + closeIn * 0.6, closeIn * 0.3, 1.2 - closeIn * 0.15, 58);
  const lookUp = G >= B.handBack[0] + 10;
  const offer = ramp(G, [B.handBack[0] + 40, B.handBack[0] + 52], [0, 1], Easing.out(Easing.back(1.4)));
  const taken = G >= 4872;
  const lift = ramp(G, [B.bagLift[0] + 10, B.bagLift[0] + 30]);
  const pat = G >= B.bagLift[0] + 50 && G < B.bagLift[1];
  const sitT = ramp(G, [B.share[0], B.share[0] + 24], [0, 1], Easing.inOut(Easing.cubic));
  const seated = sitT >= 1;
  const shareOffer = ramp(G, [5040, 5056]);
  const shared = G >= B.sparkle;
  const walkIn = ramp(G, [B.handBack[0], B.handBack[0] + 30]);
  return (
    <Stage cam={cam} light="interior" world={world} fx={null}>
      {(c) => {
        const her = place(c, herPos, 1.45);
        const standPos = place(c, [keys(walkIn, [0, 1], [-1.8, HX]), 0, HZ], 1.5);
        const seatPl = place(c, seatPos, 1.5);
        const him = seated ? seatPl : {x: standPos.x + (seatPl.x - standPos.x) * sitT, y: standPos.y + (seatPl.y - standPos.y) * sitT, scale: standPos.scale + (seatPl.scale - standPos.scale) * sitT};
        const hh = headScreen(him, 0, 1, seated);
        return (
          <>
            <SeatedCrowd cam={c} frame={f} empty={crowdEmpty} />
            <FemaleCat
              {...her}
              frame={f}
              facing={-1}
              earbud={!(shareOffer > 0 && !shared) || shared}
              holdingR={!taken && offer > 0 ? 'earbud' : shareOffer > 0 && !shared ? 'earbud' : 'none'}
              holdingL={lift > 0.5 && G < B.share[0] ? 'backpack' : 'none'}
              pose={{
                sit: true,
                armR: !taken ? 6 + offer * 70 : pat ? 75 + Math.sin(f * 1.2) * 18 : shareOffer > 0 && !shared ? 6 + shareOffer * 75 : 6,
                armL: lift > 0 && G < B.share[0] ? 20 : 6,
                handScale: 1.3,
                headTilt: lookUp ? -8 : 0,
              }}
              face={
                !lookUp
                  ? {eyes: 'dot', lookY: 0.6, mouth: 'neutral'}
                  : shared
                    ? {eyes: 'happy', mouth: 'smile', blush: 0.6}
                    : {eyes: 'half', lookX: 1, mouth: 'smile', blush: 0.35}
              }
            />
            <MaleCat
              {...him}
              frame={f}
              facing={1}
              earbud={seated || G >= 4990}
              holdingR={taken && G < 4990 ? 'earbud' : 'none'}
              pose={
                seated
                  ? {sit: true, headTilt: shared ? 8 : 0, armL: 6, armR: shared ? 6 : 6 + shareOffer * 20}
                  : sitT > 0
                    ? {squash: 0.9, lean: 10}
                    : walkIn < 1
                      ? walk(f, 0.8, 0.6)
                      : {...pant(f), lean: 10, armR: G >= 4855 && G < 4990 ? 70 : 14, handScale: 1.3}
              }
              face={
                shared
                  ? {eyes: 'shut', mouth: 'smile', blush: 1, ears: 'up'}
                  : seated
                    ? {eyes: 'wide', lookX: 1, mouth: 'wobble', blush: 1, redFace: 0.4, ears: 'perk'}
                    : taken
                      ? {eyes: 'sparkle', lookX: 1, mouth: 'o', blush: 0.8, ears: 'perk'}
                      : {eyes: 'wide', lookX: 1, mouth: 'pant', sweat: 2, ears: 'droop'}
              }
            />
            {shared ? <Earbud x={hh.x - hh.r * 0.95} y={hh.y} s={him.scale * 1.2} /> : null}
            <Sparkles frame={G} count={8} seed="give" area={[her.x - 260, her.y - 520 * her.scale, 300, 200]} amount={G >= 4860 && G < 4900 ? 1 : 0} />
            {shared ? <HeartStream frame={G} x={(him.x + her.x) / 2} y={hh.y - 40} start={B.sparkle} count={12} spread={180} /> : null}
            {shared ? <Sparkles frame={G} count={30} seed="fin" amount={ramp(G, [B.sparkle, B.sparkle + 15])} /> : null}
            {shared
              ? [0, 1, 2].map((k) => {
                  const t = ((G + k * 22) % 66) / 66;
                  return <MusicNote key={k} x={(him.x + her.x) / 2 + Math.sin(t * 6 + k) * 30} y={hh.y - 80 - t * 160} s={0.9} opacity={1 - t} />;
                })
              : null}
          </>
        );
      }}
    </Stage>
  );
};
