#!/usr/bin/env node
// Render preview stills for visual QA:  node scripts/render-stills.mjs [comp] [frame ...]
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const [comp = 'Ep01TheLastSeat', ...frames] = process.argv.slice(2);
const list = frames.length ? frames : ['200', '900', '1700', '3800', '5100'];
fs.mkdirSync('out/preview', {recursive: true});
for (const fr of list) {
  const out = `out/preview/${comp}-f${String(fr).padStart(4, '0')}.png`;
  execFileSync('npx', ['remotion', 'still', comp, out, `--frame=${fr}`, '--log=error'], {stdio: 'inherit'});
  console.log('✓', out);
}
