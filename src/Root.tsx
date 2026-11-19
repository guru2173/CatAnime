import React from 'react';
import {Composition, Folder} from 'remotion';
import {CastSheet} from './components/cats/CastSheet';
import {ENV_COUNT, EnvPreview} from './components/world/EnvPreview';
import {EPISODES} from './episodes';
import {FPS, HEIGHT, WIDTH} from './engine/time';

export const RemotionRoot: React.FC = () => (
  <>
    {EPISODES.map((ep) => (
      <Composition
        key={ep.id}
        id={ep.id}
        component={ep.component}
        durationInFrames={ep.durationInFrames}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    ))}
    <Folder name="Dev">
      <Composition id="CastSheet" component={CastSheet} durationInFrames={60} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="EnvPreview" component={EnvPreview} durationInFrames={ENV_COUNT} fps={FPS} width={WIDTH} height={HEIGHT} />
    </Folder>
  </>
);
