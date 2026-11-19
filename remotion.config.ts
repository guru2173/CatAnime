import {Config} from '@remotion/cli/config';
import fs from 'node:fs';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
// three.js needs a GL context in headless Chromium; ANGLE (SwiftShader fallback) works on CPU-only boxes.
Config.setChromiumOpenGlRenderer('angle');
Config.setConcurrency(4);

// Use a locally installed headless Chromium when available (offline / sandboxed CI),
// otherwise Remotion downloads its own Chrome Headless Shell.
const localBrowser = [process.env.REMOTION_BROWSER_EXECUTABLE, '/opt/pw-browsers/chromium_headless_shell'].find(
  (p) => p && fs.existsSync(p),
);
if (localBrowser) {
  Config.setBrowserExecutable(localBrowser);
}
