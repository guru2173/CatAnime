import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../../engine/Stage';
import type {CamParams} from '../../engine/CinematicCamera';
import {MetroInterior} from './MetroInterior';
import {HillStreet, Overpass, OVERPASS_Y, STAIR, Stairwell, StationPlatform, TicketGates, TRACK} from './Sets';

/** Dev composition: frame N shows set N with its hero camera (used for environment QA stills). */
const SETS: {name: string; cam: CamParams; sky: string; light: 'morning' | 'interior'; world: (f: number) => React.ReactNode}[] = [
  {name: 'Metro interior', cam: {position: [0, 1.32, 1.2], lookAt: [0, 1.0, -2], fov: 60}, sky: '#cfe6ff', light: 'interior', world: (f) => <MetroInterior frame={f} speed={0.3} outside="city" />},
  {name: 'Station platform', cam: {position: [-4, 1.5, -6.5], lookAt: [2, 1.2, 1.5], fov: 55}, sky: '#cfe6ff', light: 'interior', world: () => <StationPlatform trainX={4} doorsOpen={1} />},
  {name: 'Stairwell', cam: {position: [-1.5, 0.6, 0.6], lookAt: [4, 2.6, 0], fov: 62}, sky: '#cfe6ff', light: 'interior', world: () => <Stairwell />},
  {name: 'Overpass', cam: {position: [-5, OVERPASS_Y + 1.8, 8], lookAt: [0, OVERPASS_Y + 0.6, 0], fov: 52}, sky: '#cfe6ff', light: 'morning', world: (f) => <Overpass frame={f} />},
  {name: 'Hill street', cam: {position: [20, 3.5, 13], lookAt: [20, 1.0, -4], fov: 55, roll: -6}, sky: '#cfe6ff', light: 'morning', world: () => <HillStreet trainX={24} />},
  {name: 'Ticket gates', cam: {position: [0, 1.6, 7], lookAt: [0, 1.0, -6], fov: 58}, sky: '#cfe6ff', light: 'interior', world: () => <TicketGates />},
];
void STAIR;
void TRACK;

export const EnvPreview: React.FC = () => {
  const f = useCurrentFrame();
  const s = SETS[Math.min(SETS.length - 1, f)];
  return (
    <AbsoluteFill>
      <Stage cam={s.cam} sky={s.sky} light={s.light} world={s.world(f * 10)} fog={[60, 220]} />
    </AbsoluteFill>
  );
};
export const ENV_COUNT = SETS.length;
