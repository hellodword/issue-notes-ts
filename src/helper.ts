import { moment } from './wrap';

export function parsePath(p: string) {
  let result: string[];
  result = p.split('/');
  if (result.length > 0) {
    if (result[0] === '.') {
      result = result.slice(1);
    }

    if (result.length === 1 && result[0] === '') {
      result = [];
    }
  }
  return result;
}

export function dateFormat(date: Date, timezone?: string) {
  return moment(date)
    .tz(timezone ? timezone : 'America/Los_Angeles')
    .format('YYYY-MM-DD');
}

export const isURL = /^https?:\/\/[^\r\n]+$/;
