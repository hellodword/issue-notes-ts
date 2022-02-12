import {
  isInlineCommand,
  getInlineCommand,
  visit,
  markChildren,
  only,
  onlyTitleAndLink,
  getText,
} from '../src/parse';
import { u } from 'unist-builder';
// import { inspect } from 'unist-util-inspect';

describe('isInlineCommand', () => {
  test('true', () => {
    const root = u('blockquote', [
      u('blockquote', [u('blockquote', [u('paragraph', [u('text', 'test')])])]),
    ]);
    expect(isInlineCommand(root)).toBe(true);
  });
  test('inlineCode', () => {
    const root = u('blockquote', [
      u('blockquote', [
        u('blockquote', [
          u('paragraph', [u('inlineCode', 'test'), u('text', 'test')]),
        ]),
      ]),
    ]);
    expect(isInlineCommand(root)).toBe(true);
  });
  test('false', () => {
    const root = u('root');
    expect(isInlineCommand(root)).toBe(false);
  });
});
describe('visit', () => {
  test('visit', () => {
    const root = u('blockquote', [
      u('blockquote', [u('blockquote', [u('paragraph', [u('text', 'test')])])]),
    ]);
    let count = 0;
    visit(root, () => {
      count++;
    });
    expect(count).toBe(5);
  });
});

describe('getInlineCommand', () => {
  test('true', () => {
    const root = u('blockquote', [
      u('blockquote', [u('blockquote', [u('paragraph', [u('text', 'test')])])]),
    ]);
    expect(getInlineCommand(root)).toStrictEqual(['test']);
  });
});

describe('markChildren', () => {
  test('true', () => {
    const root = u('blockquote', [
      u('blockquote', [u('blockquote', [u('paragraph', [u('text', 'test')])])]),
    ]);
    markChildren(root, 'markChildren');
    expect(root['markChildren']).toBe(true);
  });
});

describe('only', () => {
  test('false', () => {
    const root = u('blockquote', [
      u('blockquote', [u('blockquote', [u('paragraph', [u('text', 'test')])])]),
    ]);
    expect(only(root, 'markChildren')).toBe(false);
  });
});
describe('onlyTitleAndLink', () => {
  test('true', () => {
    const root = u('root', [
      u('heading', [u('text', 'text')]),
      u('paragraph', [u('text', 'https://a.b')]),
    ]);
    const r = onlyTitleAndLink(root);
    expect(r.title).toBe('text');
  });
  test('link', () => {
    const root = u('root', [
      u('paragraph', [u('text', 'https://a.b')]),
      u('heading', [u('text', 'text')]),
    ]);
    const r = onlyTitleAndLink(root);
    expect(r.title).toBe('text');
  });
  test('false', () => {
    const root = u('root', [
      u('heading', [u('text', 'text')]),
      u('paragraph', [u('inlineCode', 'test'), u('text', 'https://a.b')]),
    ]);
    markChildren(root, 'isInlineCommand');
    const r = onlyTitleAndLink(root);
    expect(r.link).toBeUndefined();
  });
  test('false', () => {
    const root = u('root', [
      u('heading', [u('text', 'text')]),
      u('paragraph', [u('inlineCode', 'test'), u('text', 'https://a.b')]),
      u('html', '<!-- -->'),
    ]);
    const r = onlyTitleAndLink(root);
    expect(r.link).toBeUndefined();
  });
});

describe('getText', () => {
  test('true', () => {
    const root = u('paragraph', [u('text', 'test'), u('text', 'test')]);

    expect(getText(root)).toBe('test');
  });
});
