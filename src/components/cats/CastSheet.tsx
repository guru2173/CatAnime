import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {stepped} from '../../engine/time';
import {run} from '../../engine/motion';
import {elder, FemaleCat, KidCat, LOOKS, MaleCat} from './Cast';

/** Model sheet: every cast member + key expressions. Handy when designing new episodes. */
export const CastSheet: React.FC = () => {
  const frame = stepped(useCurrentFrame());
  const r = run(6);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#f4d2ad 0 62%, #f3f1ec 62% 100%)'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        {/* row 1: leads, neutral + key reactions */}
        <MaleCat x={170} y={500} scale={1.15} frame={frame} earbud face={{eyes: 'normal', mouth: 'neutral'}} />
        <MaleCat x={420} y={500} scale={1.15} frame={frame} earbud face={{eyes: 'wide', mouth: 'open', ears: 'perk', sweat: 2}} pose={{armL: 30, armR: 30}} />
        <MaleCat x={670} y={500} scale={1.15} frame={frame} face={{eyes: 'wide', mouth: 'wobble', ears: 'flat', redFace: 1, sweat: 3}} pose={{armL: -25, armR: -25}} />
        <MaleCat x={940} y={500} scale={1.15} frame={frame} pose={{...r, smear: undefined} as never} face={{eyes: 'wide', mouth: 'open', brow: 1}} />
        <FemaleCat x={1250} y={500} scale={1.12} frame={frame} facing={-1} holdingR="book" pose={{armR: 40}} face={{eyes: 'dot', lookY: 0.6, mouth: 'neutral'}} />
        <FemaleCat x={1500} y={500} scale={1.12} frame={frame} facing={-1} pose={{headTilt: 8, armL: 70}} holdingL="earbud" face={{eyes: 'half', lookX: 1, mouth: 'smirk', blush: 0.4}} />
        <FemaleCat x={1750} y={500} scale={1.12} frame={frame} facing={-1} face={{eyes: 'happy', mouth: 'smile', blush: 0.6}} />
        {/* row 2: sitting, extras */}
        <MaleCat x={240} y={1000} scale={1} frame={frame} pose={{sit: true}} face={{eyes: 'normal', mouth: 'smile', blush: 1}} borrowedCup="#7fd6c8" />
        <FemaleCat x={430} y={1000} scale={1} frame={frame} pose={{sit: true}} headphonesMode="one-side" face={{eyes: 'happy', mouth: 'smile'}} />
        <KidCat x={760} y={1040} scale={0.75} frame={frame} face={{eyes: 'angry', mouth: 'shout', brow: 1}} pose={{armR: 160}} />
        <MaleCat look={elder(LOOKS.male)} x={1060} y={1040} scale={0.95} frame={frame} holdingR="cane" pose={{armR: 20}} face={{eyes: 'happy', mouth: 'smile'}} />
        <FemaleCat look={elder(LOOKS.female)} x={1290} y={1040} scale={0.95} frame={frame} face={{eyes: 'happy', mouth: 'smile', blush: 0.5}} />
        <MaleCat x={1600} y={1040} scale={1} frame={frame} face={{eyes: 'spiral', mouth: 'grin', ears: 'droop'}} pose={{lean: 10, armL: 50, armR: 140}} />
      </svg>
    </AbsoluteFill>
  );
};
