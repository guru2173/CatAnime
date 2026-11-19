---
name: cat-anime-director
description: Direct, build and QA zero-dialogue 2.5D cat-anime episodes in the CatAnime repo (Remotion + three.js low-poly sets, 12fps SVG cat rigs, rotoscope inserts, procedural SFX and beat-synced classical music). Use when asked to make a new episode, add or edit scenes, retime beats, add sound effects or music cues, change characters or sets, or render previews of CatAnime.
---

# Cat Anime Director

You are directing episodes for **CatAnime**: 2D flipnote-style cats acting over flat low-poly 3D sets, with no dialogue.
Camera moves, character acting and sound carry the whole story.

## Architecture (what to reuse, never rewrite)

| Layer | File | Use it for |
|---|---|---|
| Time | `src/engine/time.ts` | `stepped(frame)` = 12fps holds for **all character animation**; `ramp`, `keys`, `noise`, `impact`, `beatPulse` |
| Shot | `src/engine/Stage.tsx` | One shot = `<Stage cam move world light sky>{(cam) => rigs}</Stage>`. 3D backplate + SVG overlay + `fx` layer under one camera |
| Camera | `src/engine/CinematicCamera.tsx` | `CamParams` (3D position/lookAt/fov/roll/shake), `move` (2D dutch/zoom/shake/whip), `dollyZoom()`, `whipPan()`, `shakeFromEvents()`, **`place(cam, [x,y,z], heightM)`** to glue a rig to a world position, `project()` for props |
| Audio | `src/engine/AudioDirector.tsx` | `AudioPlan` = music movements (drop-in file + procedural fallback), SFX cues, ambience beds, duck windows; `onBeat()` snaps cues to the grid |
| Motion | `src/engine/motion.ts` | `idle`, `walk`, `run` (returns `smear`), `pant` |
| Cast | `src/components/cats/Cast.tsx` | `MaleCat` (cream, orange ear/tail tips, round pin-prick eyes), `FemaleCat` (lavender, almond amber eyes), `KidCat`, `crowdLook(i)`, `elder(look)` |
| Rig | `src/components/cats/CatRig.tsx` | `pose` (lean, headTilt, armL/R, legL/R, lift, sit, squash, tail, handScale, hop) and `face` (eyes, mouth, ears up/perk/flat/droop, blush, redFace, sweat, brow) |
| Sets | `src/components/world/` | `MetroInterior`, `StationPlatform`, `Train`/`TrainCar`, `Stairwell`, `Overpass`, `HillStreet` (+ tilt helper in S4), `TicketGates`; primitives `Box/Cyl/Plane/Building/Tree` |
| FX | `src/components/fx/Fx.tsx` | `SpeedLines`, `Sparkles`, `HeartStream`, `DizzyStars`, `Steam`, `ImpactFrame`, `FilmGrain`, `ThoughtCloud`, `PanicOrbit`, `MusicNote`, `TitleText` |
| Rotoscope | `src/components/RotoscopeCut.tsx` | `<RotoscopeCut shot="hand-pole" \| "eyes" \| "hand-door" frame progress/>` hard-cut inserts |
| Episode | `src/episodes/epNN-slug/` | `timeline.ts` (SCENES, beats `B`, `AUDIO`), `shared.tsx`, `scenes/S*.tsx`, `index.tsx` |

## Commands

```bash
npm install
node scripts/generate-sfx.mjs              # all SFX + placeholder score (deterministic)
npm run new-episode -- 02 "Title" 90       # scaffold + register Ep02Title (90s)
npx tsc --noEmit                           # must be zero errors
scripts/contact-sheet.sh out/preview/sheet.png 120 480 900   # tiled QA stills
npx remotion still <CompId> out/preview/x.png --frame=N
npx remotion render <CompId> out/<name>.mp4  # full render (slow on CPU — ask before doing it)
```

## Workflow for a new episode

1. **Beat sheet first.** Write the story as 3–6 scenes in `timeline.ts`: `SCENES` (frame ranges) and `B` (named beats in
   global frames). Every gag needs anticipation → action → reaction → hold.
2. **Audio plan next** (`AUDIO`): one music movement per emotional act (light → chase → climax → silence), SFX at each beat,
   ambience beds, and `ducks` wherever a heartbeat, a sting or silence should cut through. Snap musical hits with `onBeat()`.
3. **Scenes**: one component per scene; inside, branch by `G` (global frame) into shots. Use `f = stepped(G)` for rigs and the
   smooth `G` for cameras and 3D motion (that contrast is the look).
4. **Place rigs in world space** with `place(cam, [x, y, z], 1.5)` (Him 1.5, Her 1.45, kid 1.0, seated crowd 1.15).
   Draw order = depth order (far first). Use `OverlayPole`/`Rot` from `ep01-train-seat/shared.tsx` for occlusion and lying/diving.
5. **QA loop (mandatory):** `npx tsc --noEmit`, then render a contact sheet across every shot and *look at it*. Fix framing,
   cropped heads, off-screen rigs, z-fighting and black edges, then re-render.

## Directing rules of thumb

- **Cameras:** dolly-zoom (`dollyZoom`) on eye-contact freezes; Dutch angle (`move.dutch`) grows with overthinking; impact shake
  via `shakeFromEvents`; `whipPan` + `anime_whoosh` between locations; radial `SpeedLines` for realization, horizontal for travel.
- **Platform/station cameras look toward +z, so world +x is screen-left.** Flip `facing` and use `Math.min/abs` for rects.
- **Ears carry emotion:** perk on surprise, flat on panic, droop when flustered or exhausted. Her default eyes are almond,
  half-lidded (`'dot'`/`'half'`); his are huge round ovals (`'wide'` for shock).
- **Rotoscope** only at the 1–2 peak panic beats, 2–4 s, hard-cut in on `vine_boom`, out on `anime_whoosh`.
- Keep close-ups at `faceCam(x, z, ≥1.6, ~40)`: closer than that crops the head.
- Avoid the face-on-camera heads of the crowd covering the leads: `SeatedCrowd` takes `empty`/`skip`/`opacity`.

## SFX library (`public/sfx/`, regenerate with `node scripts/generate-sfx.mjs`)

`heartbeat_sub` · `train_ambience` (loop) · `door_chime` · `comic_bonk` · `earbud_pop` · `anime_whoosh` · `vine_boom` ·
`tricycle_bell` · `footsteps_sprint` · `romantic_sparkle`. Add a new sound by writing a block in `scripts/generate-sfx.mjs`
with the DSP helpers in `scripts/lib/dsp.mjs` (`sine`, `saw`, `noiseBuf`, `bell`, `bandpassSweep`, `reverb`, `drive`, `makeLoop`).
Vary existing sounds with a cue's `playbackRate` before synthesizing new ones.

## Music

Movements reference a drop-in file (`public/music/*.mp3`, git-ignored) plus a procedural fallback. Tell the user to add their
YouTube Audio Library downloads with the names in the README. Then update `bpm`/`startAt` so beat-synced cues land.
