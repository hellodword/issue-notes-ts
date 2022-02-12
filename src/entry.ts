import * as core from '@actions/core';
import { Context } from '@actions/github/lib/context';
import { GitHub } from '@actions/github/lib/utils';
import * as glob from '@actions/glob';
import * as io from '@actions/io';
import * as exec from '@actions/exec';

import { Octokit } from '@octokit/rest';
import type { RequestError } from '@octokit/request-error';

import { getPathSha, isCommentMinimized } from './github';

import { split } from 'shlex';

import yargs from 'yargs';

import axios from 'axios';

import { contentDisposition } from './wrap';
import { remark } from 'remark';

import {
  isInlineCommand,
  onlyTitleAndLink,
  markChildren,
  getInlineCommand,
  getText,
  only,
  visit,
} from './parse';

import { isURL } from './helper';

import { sanitize } from 'string-sanitizer';

import { Root } from 'mdast';

import { Node } from 'unist';
import { Parent } from 'unist-util-visit-parents';

import { u } from 'unist-builder';
// import { remove } from 'unist-util-remove';
import { modifyChildren } from 'unist-util-modify-children';
// import { inspect } from 'unist-util-inspect';
// import { visit as oriVisit } from 'unist-util-visit';
// import { BuildVisitor } from 'unist-util-visit/complex-types';
import { detectFile, detectLanguage } from './detect';
import { sha1 } from './crypto';

import fs from 'fs';

export const BRANCH_NAME = 'gh-pages';
export const BASE_PATH_POSTS_NORMAL = '_posts';
export const BASE_PATH_POSTS_ARCHIVES = '_posts/archives';
export const BASE_PATH_ARCHIVES = 'archives';
export const BASE_PATH_PICTURE = 'assets/img';
export const BASE_PATH_CODE = 'assets/code';
export const PREFIX = '1970-01-01';

export const ARCHIVE_ENGINES = ['ArchiveBox', 'cairn', 'obelisk', 'rivet'];

export async function convertEntry(args: {
  context: Context;
  github: InstanceType<typeof GitHub>;
  core?: typeof core;
  exec?: typeof exec;
  glob?: typeof glob;
  io?: typeof io;
}) {
  console.log('context.eventName', args.context.eventName);
  console.log('context.payload.action', args.context.payload.action);

  switch (args.context.eventName) {
    case 'issues': {
      const createdAt = args.context.payload.issue.created_at;
      const issueNumber = args.context.payload.issue.number;
      const issueCommentId = 0;
      const updatedAt =
        args.context.payload.issue.updated_at ||
        args.context.payload.issue.created_at;
      const rawBody = args.context.payload.issue.body;
      const rawTitle = args.context.payload.issue.title;

      switch (args.context.payload.action) {
        case 'opened': {
          return createPost({
            rest: args.github.rest as Octokit,
            ...args.context.repo,
            issueNumber,
            issueCommentId,
            createdAt,
            updatedAt,
            rawBody,
            rawTitle,
          });
        }
        case 'edited': {
          return createPost({
            rest: args.github.rest as Octokit,
            ...args.context.repo,
            issueNumber,
            issueCommentId,
            createdAt,
            updatedAt,
            rawBody,
            rawTitle,
          });
        }
        case 'deleted': {
          return deletePost({
            rest: args.github.rest as Octokit,
            ...args.context.repo,
            issueNumber,
            issueCommentId,
          });
        }
        case 'reopened': {
          return createPost({
            rest: args.github.rest as Octokit,
            ...args.context.repo,
            issueNumber,
            issueCommentId,
            createdAt,
            updatedAt,
            rawBody,
            rawTitle,
          });
        }
        case 'transferred':
        case 'pinned':
        case 'unpinned':
        case 'closed':
        case 'assigned':
        case 'unassigned':
        case 'labeled':
        case 'unlabeled':
        case 'locked':
        case 'unlocked':
        case 'milestoned':
        case 'demilestoned': {
          throw new Error(`Unsupported yet ${args.context.payload.action}`);
        }
        default: {
          throw new Error(`Unknown action ${args.context.payload.action}`);
        }
      }
    }
    case 'issue_comment': {
      const createdAt = args.context.payload.comment.created_at;
      const issueNumber = args.context.payload.issue.number;
      const issueCommentId = args.context.payload.comment.id;
      const updatedAt =
        args.context.payload.comment.updated_at ||
        args.context.payload.comment.created_at;
      const rawBody = args.context.payload.comment.body;
      const rawTitle = args.context.payload.comment.title;

      switch (args.context.payload.action) {
        case 'created': {
          return createPost({
            rest: args.github.rest as Octokit,
            ...args.context.repo,
            issueNumber,
            issueCommentId,
            createdAt,
            updatedAt,
            rawBody,
            rawTitle,
          });
        }
        case 'edited': {
          let minimized = false;

          if (
            args.context.payload.changes &&
            args.context.payload.changes.body &&
            args.context.payload.changes.body.from &&
            args.context.payload.changes.body.from ===
              args.context.payload.comment.body
          ) {
            // hide(minimize)/unhide 会触发 edited，但是 event payload 中不会有信息。
            // github 没有提供 api，请求页面来判断
            minimized = await isCommentMinimized({
              ...args.context.repo,
              issueNumber,
              issueCommentId,
            });
          }

          return createPost({
            rest: args.github.rest as Octokit,
            ...args.context.repo,
            issueNumber,
            issueCommentId,
            createdAt,
            updatedAt,
            rawBody,
            rawTitle,
            minimized,
          });
        }
        case 'deleted': {
          return deletePost({
            rest: args.github.rest as Octokit,
            ...args.context.repo,
            issueNumber,
            issueCommentId,
          });
        }
        default: {
          throw new Error(`Unknown action ${args.context.payload.action}`);
        }
      }
    }
    default: {
      throw new Error(`Unknown event ${args.context.eventName}`);
    }
  }
}

function buildRawLink(args: {
  owner: string;
  repo: string;
  issueNumber: number;
  issueCommentId: number;
}) {
  return `${args.issueCommentId}` === '0'
    ? `https://github.com/${args.owner}/${args.repo}/issues/${args.issueNumber}`
    : `https://github.com/${args.owner}/${args.repo}/issues/${args.issueNumber}#issuecomment-${args.issueCommentId}`;
}

function buildArchiveHeader(filename: string) {
  let headArchives = '';
  for (let i = 0; i < ARCHIVE_ENGINES.length; i++) {
    headArchives += `
  - name: ${ARCHIVE_ENGINES[i]}
    url: "${BASE_PATH_ARCHIVES}/${ARCHIVE_ENGINES[
      i
    ].toLowerCase()}/${filename}.html"
`;
  }
  return headArchives;
}

async function deleteArchive(args: {
  rest: Octokit;
  owner: string;
  repo: string;
  issueNumber: number;
  issueCommentId: number;
  filename: string;
}) {
  console.log('deleteArchive', args.filename);

  const filepath = `${BASE_PATH_POSTS_ARCHIVES}/${PREFIX}-${args.filename}.md`;

  await getPathSha({
    rest: args.rest,
    owner: args.owner,
    repo: args.repo,
    sha: BRANCH_NAME,
    path: filepath,
  })
    .then(async (sha) => {
      console.log('deleteArchive', 'getPathSha', sha);
      if (!sha || !sha.sha || sha.sha === '') {
        return;
      }

      await args.rest.repos
        .deleteFile({
          owner: args.owner,
          repo: args.repo,
          branch: BRANCH_NAME,
          path: filepath,
          message: `delete archive ${
            sha.name
          } via github-actions${'\n\n'}${buildRawLink(args)}`,
          sha: sha.sha,
        })
        .then((response) => {
          console.log('deleteArchive', 'deleteFile', response.status);
        });
    })
    .catch((reason) => {
      console.log('deleteArchive', 'getPathSha', reason);
    });
}

async function deletePost(args: {
  rest: Octokit;
  owner: string;
  repo: string;
  issueNumber: number;
  issueCommentId: number;
}) {
  console.log(
    'deletePost',
    'issueNumber',
    args.issueNumber,
    'issueCommentId',
    args.issueCommentId,
  );

  // issue 5 的所有都存在一个文件夹 _posts/5/1970-01-01-5-123456.md
  await getPathSha({
    rest: args.rest,
    owner: args.owner,
    repo: args.repo,
    sha: BRANCH_NAME,
    path: `${BASE_PATH_POSTS_NORMAL}/${args.issueNumber}/?`,
    cb: (item) => {
      return (
        item.indexOf(`-${args.issueNumber}-${args.issueCommentId}.md`) !== -1
      );
    },
  })
    .then(async (sha) => {
      console.log('deletePost', 'getPathSha', sha);
      if (!sha || !sha.sha || sha.sha === '') {
        return;
      }

      await args.rest.repos
        .deleteFile({
          owner: args.owner,
          repo: args.repo,
          branch: BRANCH_NAME,
          path: `${BASE_PATH_POSTS_NORMAL}/${args.issueNumber}/${sha.name}`,
          message: `delete ${
            sha.name
          } via github-actions${'\n\n'}${buildRawLink(args)}`,
          sha: sha.sha,
        })
        .then((response) => {
          console.log('deletePost', 'deleteFile', response.status);
        });
    })
    .catch((reason) => {
      console.log('deletePost', 'getPathSha', reason);
    });

  return;
}

function yargsArgToString(key: any) {
  if (!key) {
    return undefined;
  }

  if (typeof key === 'string') {
    return key as string;
  }

  if (typeof key === 'object' && key.length && key.length > 0) {
    return key[0];
  }
  return undefined;
}

async function createPost(args: {
  rest: Octokit;
  owner: string;
  repo: string;
  issueNumber: number;
  issueCommentId: number;
  createdAt: string | null;
  updatedAt: string | null;
  rawBody: string | null;
  rawTitle: string | null;
  minimized?: boolean;
}) {
  console.log(
    'createPost',
    args.issueNumber,
    args.issueCommentId,
    args.createdAt,
    args.updatedAt,
    args.rawTitle,
    !!args.minimized,
  );
  console.log('createPost', args.rawBody);
  const result: {
    needEdit: boolean;
    root?: Node;
    title?: string;
    descriptions?: string[];
    author?: string;
    img?: {
      link: string;
      node: Node;
    }[];
    jump?: string;
    del?: string[];
    code?: {
      lang: string;
      name: string;
      link: string;
      node: Node;
    }[];
    archive?: {
      title: string;
      author?: string;
      date?: string;
      link: string;
      engine: string[];
      // node: Node;
      filename?: string;
    }[];
    body?: string;
  } = {
    needEdit: false,
    title: args.rawTitle,
  };

  result.root = remark().parse(args.rawBody);

  visit(result.root, (node, _index, parent: Parent) => {
    console.log(node.type);
    switch (node.type) {
      case 'text': {
        if (!result.title || result.title === '') {
          if (!(node as any).isInlineCommand) {
            result.title = getText(node);
          }
        }
        break;
      }
      case 'blockquote': {
        if (parent && parent.type === 'blockquote') {
          break;
        }

        if (isInlineCommand(node)) {
          markChildren(node, 'isInlineCommand');
          yargs(split(getInlineCommand(node).join(' ')))
            .command({
              command: [
                'desc <descriptions...>',
                'description <descriptions...>',
              ],
              handler: (argv: yargs.Arguments<{ descriptions?: string[] }>) => {
                console.log('yargs.handler', 'desc', argv);
                if (!result.descriptions) {
                  result.descriptions = [];
                }
                result.descriptions.push(...argv.descriptions);
              },
            })
            .command({
              command: 'author [author]',
              handler: (argv: yargs.Arguments<{ author: string }>) => {
                console.log('yargs.handler', 'author', argv);
                result.author = yargsArgToString(argv.author);
              },
            })
            .command({
              command: ['img [link]', 'image [link]'],
              handler: async (argv: yargs.Arguments<{ link: string }>) => {
                console.log('yargs.handler', 'img', argv);
                if (!result.img) {
                  result.img = [];
                }
                result.img.push({
                  node: node,
                  link: yargsArgToString(argv.link),
                });
              },
            })
            .command({
              command: ['jump [link]', 'jumplink [link]'],
              handler: (argv: yargs.Arguments<{ link: string }>) => {
                console.log('yargs.handler', 'jump', argv);
                result.jump = yargsArgToString(argv.link);
              },
            })
            .command({
              command: ['del [link]', 'delete [link]'],
              handler: (argv: yargs.Arguments<{ link: string }>) => {
                console.log('yargs.handler', 'del', argv);
                if (!result.del) {
                  result.del = [];
                }
                result.del.push(yargsArgToString(argv.link));
              },
            })
            .command({
              command: 'code [link]',
              builder: (_yargs: yargs.Argv) => {
                return _yargs
                  .option('lang', {
                    type: 'string',
                  })
                  .option('name', {
                    type: 'string',
                  });
              },
              handler: (
                argv: yargs.Arguments<
                  { lang: string } & { name: string } & { link: string }
                >,
              ) => {
                console.log('yargs.handler', 'code', argv);
                if (!result.code) {
                  result.code = [];
                }
                result.code.push({
                  node: node,
                  lang: yargsArgToString(argv.lang),
                  name: yargsArgToString(argv.name),
                  link: yargsArgToString(argv.link),
                });
              },
            })
            .command({
              command: 'archive [link]',
              builder: (_yargs: yargs.Argv) => {
                return _yargs
                  .option('title', {
                    type: 'string',
                  })
                  .option('author', {
                    type: 'string',
                  })
                  .option('engine', {
                    type: 'string',
                  })
                  .option('date', {
                    type: 'string',
                  });
              },
              handler: (
                argv: yargs.Arguments<
                  { title: string } & { author: string } & { date: string } & {
                    engine: string;
                  } & { link: string }
                >,
              ) => {
                console.log('yargs.handler', 'archive', argv);
                if (!result.archive) {
                  result.archive = [];
                }
                argv.link = yargsArgToString(argv.link);
                if (!isURL.test(argv.link)) {
                  console.log('yargs.handler', 'archive', '!isURL', argv.link);
                  return;
                }
                let engine = [];
                if (typeof argv.engine === 'string') {
                  engine = [argv.engine];
                } else if (argv.engine && (argv.engine as any).length) {
                  for (let j = 0; j < (argv.engine as any).length; j++) {
                    engine.push(argv.engine[j]);
                  }
                }

                if (!engine || engine.length === 0) {
                  engine = ['all']; // default
                }

                result.archive.push({
                  link: argv.link,
                  title: yargsArgToString(argv.title),
                  author: yargsArgToString(argv.author),
                  date: yargsArgToString(argv.date),
                  engine: engine,
                });
              },
            })
            // https://yargs.js.org/docs/#api-reference-stringkey
            // .string('_') will result in non-hyphenated arguments being interpreted as strings, regardless of whether they resemble numbers.
            .string('_')
            .parse();
        }

        break;
      }
    }
  });

  console.log('result.img', !!result.img);
  if (result.img) {
    for (let i = 0; i < result.img.length; i++) {
      if (
        !result.img[i].link ||
        result.img[i].link === '' ||
        !isURL.test(result.img[i].link)
      ) {
        continue;
      }
      const imgNode = u('image', {
        title: null,
        alt: result.img[i].link,
        url: result.img[i].link,
      });
      await axios
        .get(result.img[i].link, {
          responseType: 'arraybuffer',
        })
        .then(async (response) => {
          console.log(response);
          let ext = await detectFile(response.data);
          if (!ext || ext === '') {
            ext = 'jpg';
          }
          const sha1Hex = sha1(response.data);
          // 上传到 assets/img/${sha1Hex}.${ext}
          await args.rest.repos
            .createOrUpdateFileContents({
              owner: args.owner,
              repo: args.repo,
              branch: BRANCH_NAME,
              path: `${BASE_PATH_PICTURE}/${sha1Hex}.${ext}`,
              message: `add ${sha1Hex}.${ext} via github-actions${'\n\n'}${buildRawLink(
                args,
              )}${'\n'}${result.img[i].link}`,
              content: response.data.toString('base64'),
            })
            .then((response) => {
              if (response.status >= 200 && response.status < 300) {
                imgNode.url = `https://raw.githubusercontent.com/${args.owner}/${args.repo}/${BRANCH_NAME}/${BASE_PATH_PICTURE}/${sha1Hex}.${ext}`;
              }
            })
            .catch((reason: RequestError) => {
              // 已经存在
              if (
                reason &&
                (reason.status === 422 ||
                  (reason.response && reason.response.status === 422))
              ) {
                imgNode.url = `https://raw.githubusercontent.com/${args.owner}/${args.repo}/${BRANCH_NAME}/${BASE_PATH_PICTURE}/${sha1Hex}.${ext}`;
              }
            });
        })
        .catch((reason) => {
          console.log(reason);
        })
        .finally(() => {
          const modifier = function (node, index, parent) {
            if (node.type === result.img[i].node) {
              parent.children.splice(index, 1, imgNode);
              return index + 1;
            }
            return undefined;
          };
          const modify = modifyChildren(modifier);
          modify(result.root as Parent);

          result.needEdit = true;
        });
    }
  }

  console.log('result.code', !!result.code);
  if (result.code) {
    for (let i = 0; i < result.code.length; i++) {
      if (
        !result.code[i].link ||
        result.code[i].link === '' ||
        !isURL.test(result.code[i].link)
      ) {
        continue;
      }
      // 优先用传参
      let fileName = result.code[i].name;
      let lang = result.code[i].lang;
      await axios
        .get(result.code[i].link)
        .then(async (response) => {
          // 其次读取 content-disposition
          if (!fileName || fileName === '') {
            if (
              response.headers &&
              response.headers['content-disposition'] &&
              response.headers['content-disposition'] !== ''
            ) {
              const disposition = contentDisposition(
                response.headers['content-disposition'],
              );
              if (disposition && disposition.parameters) {
                if (
                  disposition.parameters.filename &&
                  disposition.parameters.filename !== ''
                ) {
                  if (!fileName || fileName === '') {
                    fileName = disposition.parameters.filename;
                  }
                }
                if (
                  disposition.parameters.name &&
                  disposition.parameters.name !== ''
                ) {
                  if (!fileName || fileName === '') {
                    fileName = disposition.parameters.name;
                  }
                }
              }
            }
          }

          // 尝试从 fileName 中获取 lang
          if (!lang || lang === '') {
            lang = (fileName || '').match(/[^.]+$/)[0];
          }

          // 识别
          if (!lang || lang === '') {
            lang = await detectLanguage(response.data);
          }

          const comment = getInlineCommand(result.code[i].node).join(' ');
          const commentNode = u('html', `<!-- ${comment} -->`);

          const codeNode = u('code', { lang: lang }, response.data);

          const modifier = function (node, index, parent) {
            if (node.type === result.code[i].node) {
              parent.children.splice(index, 1, codeNode);
              parent.children.splice(index, 0, commentNode);
              return index + 1;
            }
            return undefined;
          };
          const modify = modifyChildren(modifier);
          modify(result.root as Parent);

          result.needEdit = true;
        })
        .catch((reason) => {
          console.log(reason);
        });
    }
  }

  const tl = onlyTitleAndLink(result.root);

  console.log('onlyTitleAndLink', tl);
  if (tl) {
    result.title = tl.title;
    result.jump = tl.link;
    result.body = `[${result.title}](${result.jump})`;
  } else {
    result.body = remark().stringify(result.root as Root);
  }

  console.log('result.jump', result.jump);
  console.log('result.title', result.title);
  console.log('result.body', result.body);

  const onlyInlineCommands = only(result.root, 'isInlineCommand');
  console.log('onlyInlineCommands', onlyInlineCommands);

  if (!onlyInlineCommands) {
    // 生成 posts
    const pathPost = `${BASE_PATH_POSTS_NORMAL}/${args.issueNumber}/${PREFIX}-${args.issueNumber}-${args.issueCommentId}.md`;
    await getPathSha({
      rest: args.rest,
      owner: args.owner,
      repo: args.repo,
      sha: BRANCH_NAME,
      path: pathPost,
    })
      .then(async (sha) => {
        const description = result.descriptions
          ? result.descriptions.join('\n').replace(/^[ \t]*/gm, '  ')
          : '';
        const post = `---
layout: post
published: ${!args.minimized}
author: "${result.author || 'Notes'}"
title:  "${result.title}"
date:   ${args.updatedAt}
${
  description && description !== '' ? `description: |${'\n'}${description}` : ''
}
${result.jump && result.jump !== '' ? `jumplink: ${result.jump}` : ''}
---

${result.body}
`;
        await args.rest.repos
          .createOrUpdateFileContents({
            owner: args.owner,
            repo: args.repo,
            branch: BRANCH_NAME,
            path: pathPost,
            message: `${sha.sha ? 'update' : 'add'} ${args.issueNumber}-${
              args.issueCommentId
            }.md via github-actions${'\n\n'}${buildRawLink(
              args,
            )}${'\n'}${pathPost}${'\n'}${result.title}`,
            content: Buffer.from(post, 'utf8').toString('base64'),
            sha: sha.sha ? sha.sha : '',
          })
          .then((response) => {
            console.log('upload post', response.status);
          })
          .catch((reason) => {
            console.log('upload post', reason);
            // 失败了不修改 issue 内容
            result.needEdit = false;
          });
      })
      .catch((reason) => {
        console.log(reason);
      });
  }

  console.log('result.needEdit', result.needEdit);

  if (result.needEdit) {
    if (`${args.issueCommentId}` === '0') {
      // issue
      await args.rest.issues
        .update({
          owner: args.owner,
          repo: args.repo,
          issue_number: args.issueNumber,
          body: result.body,
          title: args.rawTitle, // 不改变 issue 标题
        })
        .then((response) => {
          console.log('update issue', response.status);
        })
        .then((reason) => {
          console.log('update issue', reason);
        });
    } else {
      // comment
      await args.rest.issues
        .updateComment({
          owner: args.owner,
          repo: args.repo,
          comment_id: args.issueCommentId,
          body: result.body,
        })
        .then((response) => {
          console.log('update issue comment', response.status);
        })
        .then((reason) => {
          console.log('update issue comment', reason);
        });
    }
  }

  console.log('result.del', result.del);

  if (result.del) {
    for (let i = 0; i < result.del.length; i++) {
      if (!result.del[i] || result.del[i] === '') {
        continue;
      }
      console.log('delete', result.del[i]);
      const match = /(\/(\d+)-(\d+)\.html)|(\/(\d+)#issuecomment-(\d+)$)/.exec(
        result.del[i],
      );
      if (match && match.length > 0) {
        const issueNumber = parseInt(match[2] || match[5]);
        const issueCommentId = parseInt(match[3] || match[6]);
        await deletePost({
          rest: args.rest,
          owner: args.owner,
          repo: args.repo,
          issueNumber: issueNumber,
          issueCommentId: issueCommentId,
        });
      } else {
        // delete archive
        const filename = sanitize(result.del[i]);
        await deleteArchive({
          rest: args.rest,
          owner: args.owner,
          repo: args.repo,
          issueNumber: args.issueNumber,
          issueCommentId: args.issueCommentId,
          filename: filename,
        });
      }
    }
  }

  console.log('result.archive', result.archive);

  if (result.archive && ARCHIVE_ENGINES.length > 0) {
    for (let i = 0; i < result.archive.length; i++) {
      if (
        !result.archive[i] ||
        result.archive[i].link === '' ||
        !result.archive[i].title ||
        result.archive[i].title === ''
      ) {
        continue;
      }
      result.archive[i].filename = sanitize(result.archive[i].link);

      console.log(`result.archive[${i}].filename`, result.archive[i].filename);

      const archivePostPath = `${BASE_PATH_POSTS_ARCHIVES}/${PREFIX}-${result.archive[i].filename}.md`;

      await getPathSha({
        rest: args.rest,
        owner: args.owner,
        repo: args.repo,
        sha: BRANCH_NAME,
        path: archivePostPath,
      })
        .then(async (sha) => {
          const post = `---
layout: null
date: ${args.updatedAt}
title: |
  ${result.archive[i].title}
author: "${result.archive[i].author || 'Archive'}"
jumplink: ${result.archive[i].link}
archives: ${buildArchiveHeader(result.archive[i].filename)}
---

[${result.archive[i].title}](${result.archive[i].link})
`;
          await args.rest.repos
            .createOrUpdateFileContents({
              owner: args.owner,
              repo: args.repo,
              branch: BRANCH_NAME,
              path: archivePostPath,
              message: `${sha.sha ? 'update' : 'add'} archive ${
                result.archive[i].filename
              }.html via github-actions${'\n\n'}${buildRawLink(
                args,
              )}${'\n'}${archivePostPath}${'\n'}${
                result.archive[i].title
              }${'\n'}${result.archive[i].link}`,
              content: Buffer.from(post, 'utf8').toString('base64'),
              sha: sha.sha ? sha.sha : '',
            })
            .then((response) => {
              console.log('upload archive post', response.status);
            })
            .catch((reason) => {
              console.log('upload archive post', reason);
            });
        })
        .catch((reason) => {
          console.log(reason);
        });
    }
  }

  // 传回 github actions 进行 archive
  return {
    archive: result.archive,
  };
}

export async function archiveEntry(args: {
  context: Context;
  github: InstanceType<typeof GitHub>;
  core?: typeof core;
  exec?: typeof exec;
  glob?: typeof glob;
  io?: typeof io;
  engine: string;
  filename: string;
  link: string;
}) {
  const issueNumber = args.context.payload.issue.number;
  const issueCommentId =
    args.context.eventName === 'issues' ? 0 : args.context.payload.comment.id;

  console.log('archiveEntry', args.engine, args.filename);
  const contentArchive = fs.readFileSync(
    `./archives/${args.engine}/index.html`,
  );

  const pathArchive = `${BASE_PATH_ARCHIVES}/${args.engine}/${args.filename}.html`;

  await getPathSha({
    rest: args.github.rest as Octokit,
    owner: args.context.repo.owner,
    repo: args.context.repo.repo,
    sha: BRANCH_NAME,
    path: pathArchive,
  })
    .then(async (sha) => {
      await args.github.rest.repos
        .createOrUpdateFileContents({
          owner: args.context.repo.owner,
          repo: args.context.repo.repo,
          branch: BRANCH_NAME,
          path: pathArchive,
          message: `${sha.sha ? 'update' : 'add'} archive[${args.engine}] ${
            args.filename
          }.html via github-actions${'\n\n'}${buildRawLink({
            owner: args.context.repo.owner,
            repo: args.context.repo.repo,
            issueNumber: issueNumber,
            issueCommentId: issueCommentId,
          })}${'\n'}${args.link}`,
          content: contentArchive.toString('base64'),
          sha: sha.sha ? sha.sha : '',
        })
        .then((response) => {
          console.log(`upload archive[${args.engine}] post`, response.status);
        })
        .catch((reason) => {
          console.log(`upload archive[${args.engine}] post`, reason);
        });
    })
    .catch((reason) => {
      console.log(reason);
    });
}
