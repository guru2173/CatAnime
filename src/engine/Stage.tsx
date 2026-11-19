import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Color, Fog} from 'three';
import {Camera3D, CameraMove, CamParams, CinematicCamera, resolveCam} from './CinematicCamera';
import {HEIGHT, WIDTH} from './time';

export type LightPreset = 'morning' | 'interior' | 'golden' | 'dream';

const LIGHTS: Record<LightPreset, {sky: string; ground: string; hemi: number; sun: string; sunI: number; sunPos: [number, number, number]; amb: number}> = {
  morning: {sky: '#eef6ff', ground: '#d9c4a4', hemi: 1.9, sun: '#fff1d2', sunI: 1.2, sunPos: [6, 10, 7], amb: 0.5},
  interior: {sky: '#fffaf0', ground: '#d8c8b0', hemi: 2.1, sun: '#fff0d8', sunI: 0.9, sunPos: [-4, 6, 8], amb: 0.6},
  golden: {sky: '#ffd9b0', ground: '#8a6a58', hemi: 1.2, sun: '#ffb46b', sunI: 2.4, sunPos: [-8, 4, 6], amb: 0.3},
  dream: {sky: '#ffe6f4', ground: '#d8c6ff', hemi: 1.6, sun: '#fff', sunI: 1.4, sunPos: [3, 8, 6], amb: 0.5},
};

export const Lights: React.FC<{preset?: LightPreset}> = ({preset = 'morning'}) => {
  const l = LIGHTS[preset];
  return (
    <>
      <hemisphereLight args={[l.sky, l.ground, l.hemi]} />
      <directionalLight color={l.sun} intensity={l.sunI} position={l.sunPos} />
      <ambientLight intensity={l.amb} />
    </>
  );
};

export type StageProps = {
  cam: CamParams;
  /** 2D post-camera move (dutch, shake, whip, zoom) applied to the whole composite. */
  move?: CameraMove;
  world: React.ReactNode;
  sky?: string;
  fog?: [number, number];
  light?: LightPreset;
  /** 2D overlay in 1920x1080 SVG space; receives the resolved camera for world->screen placement. */
  children?: (cam: CamParams) => React.ReactNode;
  /** Extra HTML overlay layers (FX) that also ride the 2D camera. */
  fx?: React.ReactNode;
};

/** A 2.5D shot: low-poly three.js backplate + 2D SVG rigs + FX, all under one cinematic camera. */
export const Stage: React.FC<StageProps> = ({cam, move = {}, world, sky = '#cfe8ff', fog, light = 'morning', children, fx}) => {
  const frame = useCurrentFrame();
  const rc = resolveCam(frame, cam);
  return (
    <CinematicCamera move={move}>
      <AbsoluteFill style={{background: sky}}>
        <ThreeCanvas
          width={WIDTH}
          height={HEIGHT}
          gl={{antialias: true, preserveDrawingBuffer: true}}
          dpr={1}
          onCreated={({scene}) => {
            scene.background = new Color(sky);
            if (fog) scene.fog = new Fog(sky, fog[0], fog[1]);
          }}
        >
          <Camera3D {...rc} />
          <Lights preset={light} />
          {world}
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill>
        <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{overflow: 'visible'}}>
          {children ? children(rc) : null}
        </svg>
      </AbsoluteFill>
      {fx}
    </CinematicCamera>
  );
};
