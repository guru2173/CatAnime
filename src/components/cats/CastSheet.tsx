import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {stepped} from '../../engine/time';
import {run} from '../../engine/motion';
import {FemaleCat, KidCat, MaleCat} from './Cast';
import type {EarShape} from './CatRig';

const Label: React.FC<{x: number; y: number; children: string}> = ({x, y, children}) => (
  <text x={x} y={y} textAnchor="middle" fontFamily="sans-serif" fontWeight={800} fontSize={24} fill="#3a2a1c" stroke="#fff6ea" strokeWidth={6} paintOrder="stroke">
    {children}
  </text>
);

/** Model sheet: cast + key reactions. Handy when designing new episodes. */
export const CastSheet: React.FC = () => {
  const frame = stepped(useCurrentFrame());
  const {smear, ...sprint} = run(6);
  const ears: EarShape[] = ['up', 'perk', 'flat', 'droop'];
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#f4d2ad 0 66%, #f3f1ec 66% 100%)'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <MaleCat x={200} y={640} scale={1.15} frame={frame} earbud face={{eyes: 'normal', mouth: 'neutral'}} />
        <Label x={200} y={690}>HIM</Label>
        <FemaleCat x={520} y={640} scale={1.12} frame={frame} facing={-1} earbud face={{eyes: 'dot', mouth: 'neutral'}} pose={{tail: 10}} />
        <Label x={520} y={690}>HER</Label>
        <MaleCat x={870} y={640} scale={1.15} frame={frame} earbud pose={{armL: 40, armR: 40, squash: 1.04}} face={{eyes: 'wide', mouth: 'open', ears: 'flat', sweat: 1}} />
        <Label x={870} y={690}>(a) PIN-PRICK SHOCK</Label>
        <MaleCat x={1220} y={640} scale={1.15} frame={frame} pose={{armL: -28, armR: -28, squash: 0.97}} face={{eyes: 'wide', lookY: 0.4, mouth: 'wobble', ears: 'droop', redFace: 1, blush: 1, sweat: 3}} />
        <Label x={1220} y={690}>(b) CRIMSON BLUSH</Label>
        <MaleCat x={1610} y={640} scale={1.15} frame={frame} pose={sprint} smear={0.85} face={{eyes: 'wide', mouth: 'open', brow: 1, ears: 'flat'}} />
        <Label x={1610} y={690}>(c) 12FPS SPRINT SMEAR</Label>
        {/* ear expression strip */}
        {ears.map((e, i) => (
          <g key={e}>
            <FemaleCat x={170 + i * 230} y={1010} scale={0.62} frame={frame} facing={-1} face={{eyes: e === 'flat' ? 'wide' : e === 'perk' ? 'wide' : e === 'droop' ? 'half' : 'normal', mouth: e === 'droop' ? 'smirk' : 'neutral', ears: e, blush: e === 'droop' ? 0.5 : 0}} />
            <Label x={170 + i * 230} y={1062}>{`ears: ${e}`}</Label>
          </g>
        ))}
        <FemaleCat x={1130} y={1010} scale={0.62} frame={frame} face={{eyes: 'happy', mouth: 'smile', blush: 0.7}} />
        <Label x={1130} y={1062}>soft smile</Label>
        <KidCat x={1420} y={1010} scale={0.5} frame={frame} face={{eyes: 'angry', mouth: 'shout', brow: 1, ears: 'flat'}} pose={{armR: 160}} />
        <Label x={1420} y={1062}>tricycle kid</Label>
        <MaleCat x={1700} y={1010} scale={0.62} frame={frame} face={{eyes: 'heart', mouth: 'grin', ears: 'perk', blush: 0.8}} />
        <Label x={1700} y={1062}>smitten</Label>
      </svg>
    </AbsoluteFill>
  );
};
