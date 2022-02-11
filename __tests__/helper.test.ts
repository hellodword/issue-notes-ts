import { parsePath, dateFormat } from '../src/helper';

describe('parsePath function', () => {
  const name = './a/b/c.d';

  const result = parsePath(name);

  // Assert result
  it('parsePath `{name}`', () => {
    expect(result).toStrictEqual(['a', 'b', 'c.d']);
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
