import crypto from 'crypto';

export function sha1(data: Buffer): string {
  const hash = crypto.createHash('sha1');
  hash.update(data);
  return hash.digest('hex');
}
