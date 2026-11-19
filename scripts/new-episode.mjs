#!/usr/bin/env node
// Scaffold a new CatAnime episode and register it.
//   node scripts/new-episode.mjs 02 "The Umbrella Swap" [durationSeconds=60]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [num, title, secs = '60'] = process.argv.slice(2);
if (!num || !title) {
  console.error('usage: node scripts/new-episode.mjs <NN> "<Title>" [durationSeconds]');
  process.exit(1);
}
const nn = String(num).padStart(2, '0');
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const pascal = title.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
const compId = `Ep${nn}${pascal}`;
const dir = path.join(root, 'src', 'episodes', `ep${nn}-${slug}`);
const frames = Math.round(Number(secs) * 30);
if (fs.existsSync(dir)) {
  console.error(`✗ ${dir} already exists`);
  process.exit(1);
}
fs.mkdirSync(path.join(dir, 'scenes'), {recursive: true});

fs.writeFileSync(
  path.join(dir, 'timeline.ts'),
  `import type {AudioPlan} from '../../engine/AudioDirector';

/** Episode ${nn} — "${title}". ${frames} frames @ 30fps. */
export const DURATION = ${frames};

export const SCENES = {
  s1: {from: 0, to: ${frames}, title: 'Cold open'},
} as const;

/** Global-frame story beats. */
export const B = {
  enter: 30,
  reaction: 120,
} as const;

export const AUDIO: AudioPlan = {
  music: [
    {
      id: 'mvt1',
      title: 'Mozart – Eine Kleine Nachtmusik',
      file: 'music/ep${nn}-mvt1.mp3',
      fallback: 'music/placeholder_mvt1_nachtmusik.wav',
      from: 0,
      to: ${frames},
      volume: 0.45,
      bpm: 128,
    },
  ],
  ambience: [{src: 'sfx/train_ambience.wav', from: 0, to: ${frames}, volume: 0.3}],
  ducks: [],
  sfx: [
    {src: 'sfx/anime_whoosh.wav', at: B.enter - 6, volume: 0.5},
    {src: 'sfx/heartbeat_sub.wav', at: B.reaction, volume: 1},
  ],
};
`,
);

fs.writeFileSync(
  path.join(dir, 'scenes', 'S1ColdOpen.tsx'),
  `import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Stage} from '../../../engine/Stage';
import {place} from '../../../engine/CinematicCamera';
import {idle, walk} from '../../../engine/motion';
import {keys, stepped} from '../../../engine/time';
import {MetroInterior} from '../../../components/world/MetroInterior';
import {FemaleCat, MaleCat} from '../../../components/cats/Cast';
import {SeatedCrowd, sideCam} from '../../ep01-train-seat/shared';
import {B, SCENES} from '../timeline';

export const S1ColdOpen: React.FC = () => {
  const G = useCurrentFrame() + SCENES.s1.from;
  const f = stepped(G); // 12fps flipnote holds for characters
  const x = keys(G, [B.enter, B.enter + 80], [-3, -0.7]);
  const walking = G > B.enter && G < B.enter + 80;
  return (
    <Stage cam={sideCam(0.6)} move={{handheld: 3}} light="interior" world={<MetroInterior frame={G} speed={0.25} />}>
      {(c) => (
        <>
          <SeatedCrowd cam={c} frame={f} moving />
          <MaleCat {...place(c, [x, 0, -0.86], 1.5)} frame={f} earbud pose={walking ? walk(f) : idle(f)} face={G > B.reaction ? {eyes: 'wide', ears: 'perk', mouth: 'o'} : {}} />
          <FemaleCat {...place(c, [0.8, 0, -0.86], 1.45)} frame={f} facing={-1} earbud pose={idle(f, 2)} face={{eyes: 'dot', lookY: 0.6}} />
        </>
      )}
    </Stage>
  );
};
`,
);

fs.writeFileSync(
  path.join(dir, 'index.tsx'),
  `import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {AudioDirector} from '../../engine/AudioDirector';
import {AUDIO, DURATION, SCENES} from './timeline';
import {S1ColdOpen} from './scenes/S1ColdOpen';

export const ${compId.toUpperCase()}_DURATION = DURATION;

const SCENE_COMPONENTS: Record<keyof typeof SCENES, React.FC> = {s1: S1ColdOpen};

export const ${compId}: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {(Object.keys(SCENES) as (keyof typeof SCENES)[]).map((k) => {
      const C = SCENE_COMPONENTS[k];
      const s = SCENES[k];
      return (
        <Sequence key={k} from={s.from} durationInFrames={s.to - s.from} name={s.title}>
          <C />
        </Sequence>
      );
    })}
    <AudioDirector plan={AUDIO} />
  </AbsoluteFill>
);
`,
);

const reg = path.join(root, 'src', 'episodes', 'index.ts');
let r = fs.readFileSync(reg, 'utf8');
r = r.replace(
  "import {Ep01TheLastSeat, EP01_DURATION} from './ep01-train-seat';",
  `import {Ep01TheLastSeat, EP01_DURATION} from './ep01-train-seat';\nimport {${compId}, ${compId.toUpperCase()}_DURATION} from './ep${nn}-${slug}';`,
);
r = r.replace(
  '  // @new-episode-anchor',
  `  {id: '${compId}', title: ${JSON.stringify(title)}, component: ${compId}, durationInFrames: ${compId.toUpperCase()}_DURATION},\n  // @new-episode-anchor`,
);
fs.writeFileSync(reg, r);

console.log(`✓ Scaffolded ${path.relative(root, dir)}  →  composition "${compId}" (${frames} frames)`);
console.log(`  Preview:  npx remotion still ${compId} out/preview/${compId}.png --frame=150`);
