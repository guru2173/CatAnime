import React, {useLayoutEffect} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import {PerspectiveCamera as ThreePerspectiveCamera, Vector3} from 'three';
import {impact, smoothNoise} from './time';

/* ------------------------------------------------------------------ */
/*  2D camera: wraps a whole shot (3D backplate + 2D rigs + FX)        */
/* ------------------------------------------------------------------ */

export type CameraMove = {
  /** 1 = neutral framing. */
  zoom?: number;
  /** Pan in px (positive x moves the view right, i.e. content left). */
  x?: number;
  y?: number;
  /** Dutch angle in degrees. */
  dutch?: number;
  /** Handheld drift amplitude in px (slow). */
  handheld?: number;
  /** Impact shake amplitude in px (fast). */
  shake?: number;
  /** Whip pan: -1..1, 0 = settled. Adds a huge horizontal slide + motion blur. */
  whip?: number;
  /** Transform origin (percent). */
  originX?: number;
  originY?: number;
};

export type ShakeEvent = {at: number; amp: number; decay?: number};

/** Sum of decaying impact shakes (collisions, landings, bonks). */
export const shakeFromEvents = (frame: number, events: ShakeEvent[]) =>
  events.reduce((acc, e) => acc + Math.abs(impact(frame, e.at, e.amp, e.decay ?? 0.15, 1.7)), 0);

export const cameraTransform = (frame: number, m: CameraMove) => {
  const zoom = m.zoom ?? 1;
  const hh = m.handheld ?? 0;
  const sh = m.shake ?? 0;
  const whip = m.whip ?? 0;
  const hx = smoothNoise(frame / 24, 'hh-x') * hh + smoothNoise(frame * 0.9, 'sh-x') * sh;
  const hy = smoothNoise(frame / 27, 'hh-y') * hh * 0.7 + smoothNoise(frame * 0.9 + 50, 'sh-y') * sh;
  const hr = smoothNoise(frame / 40, 'hh-r') * hh * 0.04 + smoothNoise(frame * 0.8, 'sh-r') * sh * 0.05;
  const tx = -(m.x ?? 0) + hx - whip * 1700;
  const ty = -(m.y ?? 0) + hy;
  return {
    transform: `translate(${tx}px, ${ty}px) rotate(${(m.dutch ?? 0) + hr}deg) scale(${zoom})`,
    transformOrigin: `${m.originX ?? 50}% ${m.originY ?? 50}%`,
    filter: Math.abs(whip) > 0.02 ? `blur(${Math.min(40, Math.abs(whip) * 60)}px)` : undefined,
  } as React.CSSProperties;
};

export const CinematicCamera: React.FC<{move: CameraMove; children: React.ReactNode; overscan?: number}> = ({
  move,
  children,
  overscan = 1.06,
}) => {
  const frame = useCurrentFrame();
  const style = cameraTransform(frame, move);
  // Overscan so dutch angles / shakes never reveal the frame edge.
  const needsOverscan = (move.dutch ?? 0) !== 0 || (move.shake ?? 0) > 0 || (move.handheld ?? 0) > 0;
  const os = needsOverscan ? overscan + Math.abs(move.dutch ?? 0) * 0.012 : 1;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <AbsoluteFill style={{...style, transform: `${style.transform} scale(${os})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  3D camera: lives inside <ThreeCanvas>                              */
/* ------------------------------------------------------------------ */

export type Vec3 = [number, number, number];

export type Camera3DProps = {
  position: Vec3;
  lookAt: Vec3;
  fov?: number;
  /** Roll (dutch) in degrees, applied after lookAt. */
  roll?: number;
  /** World-unit shake amplitude. */
  shake?: number;
  handheld?: number;
};

export const Camera3D: React.FC<Camera3DProps> = ({position, lookAt, fov = 45, roll = 0, shake = 0, handheld = 0}) => {
  const camera = useThree((s) => s.camera) as THREE_PerspectiveCamera;
  const frame = useCurrentFrame();
  useLayoutEffect(() => {
    const jx = smoothNoise(frame * 0.9, 'c3-x') * shake + smoothNoise(frame / 30, 'c3-hx') * handheld;
    const jy = smoothNoise(frame * 0.9 + 9, 'c3-y') * shake + smoothNoise(frame / 33, 'c3-hy') * handheld;
    camera.position.set(position[0] + jx, position[1] + jy, position[2]);
    camera.fov = fov;
    camera.near = 0.1;
    camera.far = 600;
    camera.lookAt(lookAt[0] + jx * 0.5, lookAt[1] + jy * 0.5, lookAt[2]);
    if (roll) camera.rotateZ((roll * Math.PI) / 180);
    camera.updateProjectionMatrix();
  });
  return null;
};

type THREE_PerspectiveCamera = import('three').PerspectiveCamera;

/**
 * Vertigo / dolly-zoom solver. Keeps a subject of `subjectWidth` world units
 * the same size on screen while the field of view changes.
 * t: 0..1 progress; returns distance from subject and fov.
 */
export const dollyZoom = (t: number, subjectWidth: number, fovFrom = 60, fovTo = 18) => {
  const fov = fovFrom + (fovTo - fovFrom) * t;
  const distance = subjectWidth / (2 * Math.tan((fov * Math.PI) / 360));
  return {fov, distance};
};

/**
 * Whip-pan envelope around a hard cut at `at`.
 * Before the cut the outgoing shot slides away (0 -> 1), after it the incoming shot settles (-1 -> 0).
 */
export const whipPan = (frame: number, at: number, dur = 8, dir: 1 | -1 = 1) => {
  const t = (frame - at) / dur;
  if (t < -1 || t > 1) return 0;
  return t < 0 ? dir * Math.pow(t + 1, 3) : -dir * Math.pow(1 - t, 3);
};

/* ------------------------------------------------------------------ */
/*  Shared camera params + world->screen projection for 2.5D placement */
/* ------------------------------------------------------------------ */


export type CamParams = Camera3DProps;

/** Apply handheld/shake noise to params so 3D + 2D layers move together. */
export const resolveCam = (frame: number, p: CamParams): CamParams => {
  const shake = p.shake ?? 0;
  const hh = p.handheld ?? 0;
  const jx = smoothNoise(frame * 0.9, 'c3-x') * shake + smoothNoise(frame / 30, 'c3-hx') * hh;
  const jy = smoothNoise(frame * 0.9 + 9, 'c3-y') * shake + smoothNoise(frame / 33, 'c3-hy') * hh;
  return {
    ...p,
    shake: 0,
    handheld: 0,
    position: [p.position[0] + jx, p.position[1] + jy, p.position[2]],
    lookAt: [p.lookAt[0] + jx * 0.5, p.lookAt[1] + jy * 0.5, p.lookAt[2]],
  };
};

export const buildCamera = (p: CamParams, aspect = 16 / 9) => {
  const cam = new ThreePerspectiveCamera(p.fov ?? 45, aspect, 0.05, 600);
  cam.position.set(...p.position);
  cam.lookAt(...p.lookAt);
  if (p.roll) cam.rotateZ(((p.roll ?? 0) * Math.PI) / 180);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  return cam;
};

/**
 * Project a world point to 1920x1080 screen space and return the pixel scale
 * of 1 world unit at that depth — used to glue 2D cat rigs onto 3D sets.
 */
export const project = (p: CamParams, world: Vec3, width = 1920, height = 1080) => {
  const cam = buildCamera(p, width / height);
  const v = new Vector3(...world).project(cam);
  // perspective scale depends on view-space depth (distance along the camera axis), not euclidean distance
  const depth = Math.max(0.05, -new Vector3(...world).applyMatrix4(cam.matrixWorldInverse).z);
  const pxPerUnit = height / (2 * depth * Math.tan(((p.fov ?? 45) * Math.PI) / 360));
  return {x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height, pxPerUnit, behind: v.z > 1};
};

/** Rig placement: CatRig is ~350 units tall, so scale = heightInWorld * pxPerUnit / 350. */
export const place = (p: CamParams, world: Vec3, heightM = 1.5) => {
  const r = project(p, world);
  return {x: r.x, y: r.y, scale: (heightM * r.pxPerUnit) / 350};
};
