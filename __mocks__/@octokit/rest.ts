import type { RequestError } from '@octokit/request-error';
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';

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

const Octokit = class {
  git = {
    getTree: vi.fn(async function name(
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

export { Octokit };
