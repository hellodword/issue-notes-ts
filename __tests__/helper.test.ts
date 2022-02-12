import { parsePath, dateFormat, isURL } from '../src/helper';

describe('isURL', () => {
  expect(isURL.test('http://a')).toBe(true);
});

describe('parsePath', () => {
  test('correct', () => {
    expect(parsePath('./a/b/c.d')).toStrictEqual(['a', 'b', 'c.d']);
  });
  test('empty', () => {
    expect(parsePath('')).toStrictEqual([]);
  });
});

describe('dateFormat USA timezone', () => {
  const date = new Date('2022-02-03T23:52:10Z');

  const result = dateFormat(date);

  // Assert result
  it('dateFormat `{date}`', () => {
    expect(result).toBe('2022-02-03');
  });
});

describe('dateFormat UTC+8', () => {
  const date = new Date('2022-02-03T23:52:10Z');

  const result = dateFormat(date, 'Asia/Shanghai');

  // Assert result
  it('dateFormat `{date}`', () => {
    expect(result).toBe('2022-02-04');
  });
});
