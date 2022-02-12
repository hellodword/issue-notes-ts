/* eslint-disable @typescript-eslint/no-explicit-any */
// https://github.com/rollup/rollup/issues/1267#issuecomment-446681320

import * as contentDispositionNamespace from 'content-disposition';
const contentDisposition =
  (contentDispositionNamespace as any).default || contentDispositionNamespace;

import * as MomentTimezoneNamespace from 'moment-timezone';
const moment =
  (MomentTimezoneNamespace as any).default || MomentTimezoneNamespace;

// import * as visit from 'unist-util-visit';
// const oriVisit = visit.visit;

export { contentDisposition, moment };
