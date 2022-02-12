import crypto from 'crypto';

function sha1(data: Buffer): string {
  const hash = crypto.createHash('sha1');
  hash.update(data);
  return hash.digest('hex');
}

export { sha1 };
