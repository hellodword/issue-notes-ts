import { contentDisposition, moment } from '../src/wrap';

describe('wrap', () => {
  test('contentDisposition', () => {
    expect(typeof contentDisposition).toStrictEqual('function');
  });

  test('moment', () => {
    expect(typeof moment).toStrictEqual('function');
  });
});
