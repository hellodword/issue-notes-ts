import { Octokit } from '@octokit/rest';
import type { RequestError } from '@octokit/request-error';
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';

import mockAxios from 'jest-mock-axios';
import { HttpResponse } from 'jest-mock-axios/dist/lib/mock-axios-types';

import { getPathSha, isCommentMinimized } from '../src/github';

const _404_ERROR: RequestError = {
  message: 'Not Found',
  status: 404,
  name: 'HttpError',
  code: 404,
  request: null,
  response: {
    url: '',
    data: null,
    status: 404,
    headers: {},
  },
  headers: {},
};

jest.mock('@octokit/rest', () => {
  const Octokit = class MockOctokit {
    // static plugin = () => Octokit

    // authenticate = () => undefined

    git = {
      getTree: jest
        .fn()
        .mockImplementation(async function name(
          params?: RestEndpointMethodTypes['git']['getTree']['parameters'],
        ) {
          if (params.owner === 'torvalds' && params.repo === 'linux') {
            switch (params.tree_sha) {
              case 'v5.17-rc3': {
                return Promise.resolve({
                  data: {
                    tree: [
                      {
                        path: 'virt',
                        mode: '040000',
                        type: 'tree',
                        sha: 'f0034938500fb945d505eac9dfa3b82b0b239ef4',
                      },
                    ],
                  },
                });
              }
              case 'f0034938500fb945d505eac9dfa3b82b0b239ef4': {
                return Promise.resolve({
                  data: {
                    tree: [
                      {
                        path: 'Makefile',
                        mode: '100644',
                        type: 'blob',
                        sha: '1cfea9436af995672dac6fae55eb12d1e5cafc1a',
                      },
                    ],
                  },
                });
              }
            }
          }
          return Promise.reject(_404_ERROR);
        }),
    };
  };
  return { Octokit };
});

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
    return getPathSha(args).catch((reason) =>
      // eslint-disable-next-line jest/no-conditional-expect
      expect(reason).toStrictEqual(_404_ERROR),
    );
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
  afterEach((): void => {
    mockAxios.reset();
  });

  const correctResponseObj: HttpResponse = {
    data: `  <div class=" timeline-comment-group js-minimizable-comment-group js-targetable-element TimelineItem-body my-0 " id="issuecomment-363996601">
    <div class="ml-n3 minimized-comment position-relative  js-comment">

  <div class=" timeline-comment-group js-minimizable-comment-group js-targetable-element TimelineItem-body my-0 " id="issuecomment-374220000">
  <div class="ml-n3 timeline-comment unminimized-comment comment previewable-edit js-task-list-container js-comment timeline-comment--caret"
      data-body-version="0084efdc2caae774849e0fd8cddd6171c6ef60461f29ae9e0e7ea67716cef832">
      <clipboard-copy aria-label="Copy link" for="issuecomment-374220000-permalink" role="menuitem" data-view-component="true" class="dropdown-item btn-link">
      <a href="#issuecomment-374220000" id="issuecomment-374220000-permalink" class="Link--secondary js-timestamp"><relative-time datetime="2018-03-19T13:56:24Z" class="no-wrap">Mar 19, 2018</relative-time></a>

      </option></form><form class="js-comment-update" id="issuecomment-374220000-edit-form" action="/isaacs/github/issue_comments/374220000" accept-charset="UTF-8" method="post"><input type="hidden" name="_method" value="put" autocomplete="off" /><input type="hidden" data-csrf="true" name="authenticity_token" value="k6TPJIjM9Fr6T5PZFZM/Fh4U2HhDYd9qmFq1BOBYkA0rZZ+PCO9LR4afTApe5U89nzggfK4L5OSxRjtU0op5mA==" />
      <include-fragment

loading="lazy"
src="/isaacs/github/issue_comments/374220000/edit_form?textarea_id=issuecomment-374220000-body&amp;comment_context="
class="previewable-comment-form js-comment-edit-form-deferred-include-fragment"
>
     `,
  };

  test('minimized', () => {
    const args = {
      owner: 'isaacs',
      repo: 'github',
      issueNumber: 1133,
      issueCommentId: 363996601,
    };

    const promise = isCommentMinimized(args);

    mockAxios.mockResponse(correctResponseObj);

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

    mockAxios.mockResponse(correctResponseObj);

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

    mockAxios.mockError(new Error('Request failed with status code 404'));

    return (
      promise
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .then(() => {})
        .catch((error) => {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(error.toString()).toBe(
            'Error: Request failed with status code 404',
          );
        })
    );
  });
});
