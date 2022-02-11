import { Octokit } from '@octokit/rest';
import axios from 'axios';
import { parsePath } from './helper';

export async function getPathSha(args: {
  rest: Octokit;
  owner: string;
  repo: string;
  sha: string;
  path: string;
  cb?: (item: string) => boolean;
}): Promise<{
  sha?: string;
  name?: string;
}> {
  const paths = parsePath(args.path);
  if (!paths || paths.length === 0) {
    return Promise.resolve({});
  }

  let result: { sha?: string; name?: string } = {
    sha: args.sha,
  };

  for (let i = 0; i < paths.length; i++) {
    result.name = paths[i];

    result = await args.rest.git
      .getTree({
        owner: args.owner,
        repo: args.repo,
        tree_sha: result.sha,
      })
      .then((response) => {
        for (const j in response.data.tree) {
          if (args.cb && i === paths.length - 1) {
            if (args.cb(response.data.tree[j].path)) {
              return Promise.resolve({
                sha: response.data.tree[j].sha,
                name: response.data.tree[j].path,
              });
            }
          } else if (response.data.tree[j].path === result.name) {
            return Promise.resolve({
              sha: response.data.tree[j].sha,
              name: response.data.tree[j].path,
            });
          }
        }
        return Promise.resolve({});
      })
      .catch((reason) => {
        return Promise.reject(reason);
      });

    if (!result.sha) {
      break;
    }
  }

  return Promise.resolve(result);
}

export async function isCommentMinimized(args: {
  owner: string;
  repo: string;
  issueNumber: string | number;
  issueCommentId: string | number;
}): Promise<boolean> {
  return axios
    .get(
      `https://github.com/${args.owner}/${args.repo}/issues/${args.issueNumber}`,
    )
    .then((response) => {
      return Promise.resolve(
        new RegExp(`"issuecomment-${args.issueCommentId}"`, 'gm').test(
          response.data,
        ) &&
          !new RegExp(
            `"issuecomment-${args.issueCommentId}-permalink"`,
            'gm',
          ).test(response.data),
      );
    })
    .catch((error) => {
      return Promise.reject(error);
    });
}
