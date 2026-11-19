import type React from 'react';
import {Ep01TheLastSeat, EP01_DURATION} from './ep01-train-seat';

export type EpisodeEntry = {
  id: string;
  title: string;
  component: React.FC;
  durationInFrames: number;
};

/** Episode registry — new episodes are appended here (scripts/new-episode.mjs does it for you). */
export const EPISODES: EpisodeEntry[] = [
  {id: 'Ep01TheLastSeat', title: 'The Last Seat on the 8:15 Train', component: Ep01TheLastSeat, durationInFrames: EP01_DURATION},
  // @new-episode-anchor
];
