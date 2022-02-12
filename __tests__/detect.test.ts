import { detectFile, detectLanguage } from '../src/detect';

describe('detectLanguage', () => {
  test('ts', async () => {
    const r = await detectLanguage(
      `import { detectFile, detectLanguage } from '../src/detect';`,
    );
    expect(r).toBe('ts');
  });
  test('empty', async () => {
    const r = await detectLanguage('');
    expect(r).toBe('text');
  });
});

describe('detectFile', () => {
  test('bmp', async () => {
    const r = await detectFile(new Buffer([0x42, 0x4d]));
    expect(r).toBe('bmp');
  });
  test('empty', async () => {
    const r = await detectFile(new Buffer(''));
    expect(r).toBe('');
  });
  test('null', async () => {
    const r = await detectFile(null);
    expect(r).toBe('');
  });
});
