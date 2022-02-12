import { Octokit } from '@octokit/rest';
import { isCommentMinimized, getPathSha } from '../src/github';
vi.mock('axios');
vi.mock('@octokit/rest');

describe('getPathSha', (): void => {
  test('empty path', () => {
    const args = {
      rest: new Octokit(),
      owner: 'torvalds',
      repo: 'linux',
      sha: 'v5.17-rc3',
      path: '',
    };
    return getPathSha(args).then((result) => {
      expect(result).toStrictEqual({});
    });
  });

  test('wrong branch', () => {
    const args = {
      rest: new Octokit(),
      owner: 'torvalds',
      repo: 'linux',
      sha: 'v999.99',
      path: 'virt/Makefile',
    };
    return getPathSha(args)
      .then(() => {
        expect(false).toBe(true);
      })
      .catch((reason) => expect(reason.status).toBe(404));
  });

  test('wrong path', () => {
    const args = {
      rest: new Octokit(),
      owner: 'torvalds',
      repo: 'linux',
      sha: 'v5.17-rc3',
      path: 'virt1/Makefile',
    };
    return getPathSha(args).then((result) => {
      expect(result).toStrictEqual({});
    });
  });

  test('correct', () => {
    const args = {
      rest: new Octokit(),
      owner: 'torvalds',
      repo: 'linux',
      sha: 'v5.17-rc3',
      path: 'virt/Makefile',
    };
    return getPathSha(args).then((result) => {
      expect(result).toStrictEqual({
        name: 'Makefile',
        sha: '1cfea9436af995672dac6fae55eb12d1e5cafc1a',
      });
    });
  });

  test('cb', () => {
    const args = {
      rest: new Octokit(),
      owner: 'torvalds',
      repo: 'linux',
      sha: 'v5.17-rc3',
      path: 'virt/?',
      cb: (item: string) => {
        return item === 'Makefile';
      },
    };
    return getPathSha(args).then((result) => {
      expect(result).toStrictEqual({
        name: 'Makefile',
        sha: '1cfea9436af995672dac6fae55eb12d1e5cafc1a',
      });
    });
  });
});

describe('isCommentMinimized', (): void => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('minimized', () => {
    const args = {
      owner: 'isaacs',
      repo: 'github',
      issueNumber: 1133,
      issueCommentId: 363996601,
    };

    const promise = isCommentMinimized(args);

    return promise.then((result) => {
      expect(result).toBe(true);
    });
  });

  test('unminimized', () => {
    const args = {
      owner: 'isaacs',
      repo: 'github',
      issueNumber: 1133,
      issueCommentId: 374220000,
    };

    const promise = isCommentMinimized(args);

    return promise.then((result) => {
      expect(result).toBe(false);
    });
  });

  test('exception', () => {
    const args = {
      owner: 'isaacs',
      repo: 'github',
      issueNumber: 0,
      issueCommentId: 0,
    };

    const promise = isCommentMinimized(args);

    return promise
      .then(() => {
        expect(true).toBe(false);
      })
      .catch((error) => {
        expect(error.toString()).toBe(
          'Error: Request failed with status code 404',
        );
      });
  });
});
