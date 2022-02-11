/* eslint-disable @typescript-eslint/no-explicit-any */
// https://github.com/rollup/rollup/issues/1267#issuecomment-446681320

import * as contentDispositionNamespace from 'content-disposition';
export const contentDisposition =
  (contentDispositionNamespace as any).default || contentDispositionNamespace;

import * as MomentTimezoneNamespace from 'moment-timezone';
export const moment =
  (MomentTimezoneNamespace as any).default || MomentTimezoneNamespace;
