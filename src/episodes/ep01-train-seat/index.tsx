import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {AudioDirector} from '../../engine/AudioDirector';
import {AUDIO, EP01_DURATION, SCENES} from './timeline';
import {S1LastSeat} from './scenes/S1LastSeat';
import {S2Chivalry} from './scenes/S2Chivalry';
import {S3Panic} from './scenes/S3Panic';
import {S4Chase} from './scenes/S4Chase';
import {S5SavedSeat} from './scenes/S5SavedSeat';

export {EP01_DURATION};

const SCENE_COMPONENTS: Record<keyof typeof SCENES, React.FC> = {
  s1: S1LastSeat,
  s2: S2Chivalry,
  s3: S3Panic,
  s4: S4Chase,
  s5: S5SavedSeat,
};

export const Ep01TheLastSeat: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {(Object.keys(SCENES) as (keyof typeof SCENES)[]).map((k) => {
      const C = SCENE_COMPONENTS[k];
      const s = SCENES[k];
      return (
        <Sequence key={k} from={s.from} durationInFrames={s.to - s.from} name={`${k.toUpperCase()} · ${s.title}`}>
          <C />
        </Sequence>
      );
    })}
    <AudioDirector plan={AUDIO} />
  </AbsoluteFill>
);
