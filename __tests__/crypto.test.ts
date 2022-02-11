import { sha1 } from '../src/crypto';

describe('wrap', () => {
  test('contentDisposition', () => {
    const data = Buffer.from('123456');
    expect(sha1(data)).toBe('7c4a8d09ca3762af61e59520943dc26494f8941b');
  });
});
