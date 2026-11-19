import React from 'react';
import {CatLook, CatRig, CatRigProps} from './CatRig';

/** Cast looks — reuse across episodes, or add new ones here. */
export const LOOKS = {
  male: {
    fur: '#fffaf0',
    furShade: '#f4b36a',
    outfit: '#000',
    outfitShade: '#000',
    outfitKind: 'none',
    innerEar: '#ffb8c4',
    markings: 'plain',
    earTip: '#f3a35c',
    tailTip: '#f3a35c',
  },
  female: {
    fur: '#c8bce4',
    furShade: '#b2a5d4',
    outfit: '#000',
    outfitShade: '#000',
    outfitKind: 'none',
    innerEar: '#fff0dc',
    markings: 'plain',
    paw: '#fff0dc',
  },
  kid: {
    fur: '#a9b8c9',
    furShade: '#8e94a3',
    outfit: '#f06a4a',
    outfitShade: '#c94d32',
    outfitKind: 'none',
    innerEar: '#ffb3c1',
    markings: 'socks',
    cap: '#3f7fd6',
    scaleHead: 1.1,
  },
  commuterA: {
    fur: '#d9cbb8',
    furShade: '#b39f86',
    outfit: '#6b6f7a',
    outfitShade: '#4d515b',
    outfitKind: 'none',
    innerEar: '#e9b8b8',
    markings: 'plain',
  },
} satisfies Record<string, CatLook>;

/** Flat background crowd colours (tan, lavender, rust, slate, sand…). */
export const CROWD_FURS = ['#c79a6b', '#d6cdf0', '#c8714a', '#9fb2c9', '#e7d3a8', '#b8b0a6', '#8c7a9e', '#e3b892'];

export const crowdLook = (i: number): CatLook => ({
  fur: CROWD_FURS[i % CROWD_FURS.length],
  furShade: CROWD_FURS[(i + 3) % CROWD_FURS.length],
  outfit: '#000',
  outfitShade: '#000',
  outfitKind: 'none',
  innerEar: '#f2b8b8',
  markings: 'plain',
});

export const elder = (look: CatLook, outfit = '#9a86b8'): CatLook => ({
  ...look,
  fur: '#eeeae4',
  furShade: '#c9c2b8',
  patchA: look.patchA ? '#d8c3ae' : undefined,
  patchB: look.patchB ? '#8d8790' : undefined,
  glasses: true,
  outfit,
  outfitShade: '#6f5d8c',
  outfitKind: 'none',
  headphones: null,
});

type CastProps = Omit<CatRigProps, 'look'> & {look?: CatLook};

/** Shy, clumsy cream/orange tabby in an oversized hoodie. */
export const MaleCat: React.FC<CastProps> = ({look, seed, ...p}) => <CatRig look={look ?? LOOKS.male} seed={seed ?? 'male'} {...p} />;

/** Calm, charming calico with over-ear headphones and a book. */
export const FemaleCat: React.FC<CastProps> = ({look, seed, ...p}) => (
  <CatRig look={look ?? LOOKS.female} seed={seed ?? 'female'} {...p} />
);

/** The kid whose tricycle gets "borrowed". */
export const KidCat: React.FC<CastProps> = ({look, seed, ...p}) => <CatRig look={look ?? LOOKS.kid} seed={seed ?? 'kid'} {...p} />;
