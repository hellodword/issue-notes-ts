/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { isURL } from './helper';

// import { remark } from 'remark';
// import { Root } from 'mdast';

import { Node } from 'unist';
import { Parent } from 'unist-util-visit-parents';

// import { u } from 'unist-builder';
// import { remove } from 'unist-util-remove';
// import { modifyChildren } from 'unist-util-modify-children';
// import { inspect } from 'unist-util-inspect';
import { visit as oriVisit } from 'unist-util-visit';
import { BuildVisitor } from 'unist-util-visit/complex-types';
import { remark } from 'remark';

// import { split } from 'shlex';
// import yargs from 'yargs';

// import axios from 'axios';
// import { detectLanguage, detectFile } from './detect';

// (async () => {
//   console.log(1);

//   await axios
//     .get(
//       'https://github.com/hluwa/FRIDA-DEXDump/raw/master/frida_dexdump/__init__.py',
//     )
//     .then(async (r) => {
//       console.log(await detectLanguage(r.data.toString()));
//     });

//   await axios
//     .get('http://google.com/favicon.ico', {
//       responseType: 'arraybuffer',
//     })
//     .then(async (r) => {
//       console.log(await detectFile(r.data));
//     });
// })();

console.dir(remark().parse('![abcdefg](http://a.b)'), { depth: null });

// fix intellisense bug
export function visit(tree: Node, visitor: BuildVisitor, reverse?: boolean) {
  oriVisit(tree, visitor, reverse);
}

export function isInlineCommand(_node: Node) {
  const node = _node as Parent;
  return (
    !!node.children &&
    node.children.length === 1 &&
    node.children[0].type === 'blockquote' &&
    // 2
    !!(node.children[0] as Parent).children &&
    (node.children[0] as Parent).children.length === 1 &&
    (node.children[0] as Parent).children[0].type === 'blockquote' &&
    // 3
    !!((node.children[0] as Parent).children[0] as Parent).children &&
    ((node.children[0] as Parent).children[0] as Parent).children.length ===
      1 &&
    ((node.children[0] as Parent).children[0] as Parent).children[0].type ===
      'paragraph' &&
    // 适配 >>> code `http://a.b/__init__.py` 防止转义
    // >>> cmd `a` b `c`
    // 4
    !!(
      ((node.children[0] as Parent).children[0] as Parent).children[0] as Parent
    ).children &&
    (((node.children[0] as Parent).children[0] as Parent).children[0] as Parent)
      .children.length >= 1 &&
    ((
      ((node.children[0] as Parent).children[0] as Parent).children[0] as Parent
    ).children[0].type === 'text' ||
      (
        ((node.children[0] as Parent).children[0] as Parent)
          .children[0] as Parent
      ).children[0].type === 'inlineCode')
  );
}

export function getInlineCommand(tree: Node) {
  const result = [];
  const paragraph = (
    (((tree as Parent).children[0] as Parent).children[0] as Parent)
      .children[0] as Parent
  ).children;
  for (let i = 0; i < paragraph.length; i++) {
    const c = paragraph[i] as any;
    if (c.value && c.value !== '') {
      result.push(c.value);
    }
  }
  return result;
}

export function markChildren(tree: Node, key: string) {
  (tree as any)[key] = true;
  visit(tree, (node: any) => {
    node[key] = true;
  });
}

export function only(tree: Node, key: string) {
  let result = true;
  visit(tree, (node: any) => {
    if (node.type !== 'root' && node.type !== 'paragraph' && !node[key]) {
      result = false;
    }
  });
  return result;
}

export function onlyTitleAndLink(tree: Node) {
  const texts: string[] = [];
  visit(tree, (node) => {
    if ((node as any).isInlineCommand) {
      return;
    }
    switch (node.type) {
      case 'heading': {
        texts.push(getText(node as Parent));
        break;
      }
      case 'paragraph': {
        texts.push(getText(node as Parent));
        break;
      }
    }
  });

  if (texts.length === 2) {
    if (isURL.test(texts[0]) && texts[1] && texts[1] !== '') {
      return {
        title: texts[1],
        link: texts[0],
      };
    }
    if (isURL.test(texts[1]) && texts[0] && texts[0] !== '') {
      return {
        title: texts[0],
        link: texts[1],
      };
    }
  }

  return undefined;
}

export function getText(tree: Node) {
  let result = '';
  visit(tree, (node) => {
    if ((!result || result === '') && node.type === 'text') {
      result = (node as any).value;
    }
  });
  return result;
}

// export function parseMarkdown(markdown: string) {
//   const tree: Node = remark().parse(markdown);

//   visit(tree, (node) => {
//     if (isInlineCommand(node as Parent)) {
//       markChildren(node as Parent, 'isInlineCommand');
//       console.log(getInlineCommand(node as Parent));
//     }
//   });

//   const tl = onlyTitleAndLink(tree);
//   console.log(tl);
//   console.log(remark().stringify(tree as Root));

//   remove(tree, (node) => {
//     return (node as any).isInlineCommand;
//   });

//   console.log(remark().stringify(tree as Root));

//   const tree2: any = u('root', [
//     u('paragraph', [u('text', '1')]),
//     u('heading', [u('text', '2')]),
//     u('paragraph', [u('text', '3')]),
//     u('paragraph', [u('text', '4')]),
//   ]);
//   console.log(inspect(tree));
//   console.log(inspect(tree2));
//   console.log(remark().stringify(tree2));

//   const tree3: any = u(
//     'code',
//     {
//       lang: 'html',
//     },
//     '<head></head>',
//   );
//   console.log(inspect(tree3));
//   console.log(remark().stringify(tree3));

//   const modifier = function (node, index, parent) {
//     if (node.type === 'heading') {
//       parent.children.splice(index, 1, tree3);
//       return index + 1;
//     }
//   };
//   const modify = modifyChildren(modifier);
//   modify(tree2);

//   console.log(inspect(tree2));
//   console.log(remark().stringify(tree2));
//   visit(tree, (node) => {
//     console.log(node.data);
//   });

//   return { tree: tree };
// }

// type parseMarkdownResult = {
//   tree?: Node;
//   title?: string;
//   descriptions?: string[];
//   author?: string;
//   img?: string;
//   jump?: string;
//   del?: string[];
//   code?: {
//     lang: string;
//     name: string;
//     link: string;
//   };
//   archive?: {
//     title: string;
//     author?: string;
//     date?: string;
//     link: string;
//     engine: string[];
//   };
// };

// type MyArgs = {
//   node: Node;
//   descriptions?: string[];
//   title: string;
//   author?: string;
//   date?: string;
//   link: string;
//   engine: string[];
// };

// export function parseMarkdown(markdown: string): Map<string, MyArgs> {
//   const result: parseMarkdownResult = {};
//   result.tree = remark().parse(markdown);

//   if (!result.tree) {
//     onlyTitleAndLink(null);
//     remove(null as Root, null, null);
//   }

//   visit(result.tree, (node, _index, parent: Parent) => {
//     switch (node.type) {
//       case 'blockquote': {
//         if (parent && parent.type === 'blockquote') {
//           break;
//         }

//         if (isInlineCommand(node)) {
//           markChildren(node, 'isInlineCommand');
//           yargs(split(getInlineCommand(node).join(' ')))
//             .command({
//               command: [
//                 'desc <descriptions...>',
//                 'description <descriptions...>',
//               ],
//               handler: (argv: yargs.Arguments<{ descriptions?: string[] }>) => {
//                 result.descriptions = argv.descriptions;
//               },
//             })
//             .command({
//               command: 'author [author]',
//               handler: (argv: yargs.Arguments<{ author: string }>) => {
//                 result.author = argv.author;
//               },
//             })
//             .command({
//               command: ['img [link]', 'image [link]'],
//               handler: (argv: yargs.Arguments<{ link: string }>) => {
//                 result.img = argv.link;
//               },
//             })
//             .command({
//               command: ['jump [link]', 'jumplink [link]'],
//               handler: (argv: yargs.Arguments<{ link: string }>) => {
//                 result.jump = argv.link;
//               },
//             })
//             .command({
//               command: ['del [link]', 'delete [link]'],
//               handler: (argv: yargs.Arguments<{ link: string }>) => {
//                 if (!result.del) {
//                   result.del = [];
//                 }
//                 result.del.push(argv.link);
//               },
//             })
//             .command({
//               command: 'code [link]',
//               builder: (_yargs: yargs.Argv) => {
//                 return _yargs
//                   .option('lang', {
//                     type: 'string',
//                   })
//                   .option('name', {
//                     type: 'string',
//                   });
//               },
//               handler: (
//                 argv: yargs.Arguments<
//                   { lang: string } & { name: string } & { link: string }
//                 >,
//               ) => {
//                 result.code = {
//                   lang: argv.lang,
//                   name: argv.name,
//                   link: argv.link,
//                 };
//               },
//             })
//             .command({
//               command: 'archive [link]',
//               builder: (_yargs: yargs.Argv) => {
//                 return _yargs
//                   .option('title', {
//                     type: 'string',
//                   })
//                   .option('author', {
//                     type: 'string',
//                   })
//                   .option('engine', {
//                     type: 'string',
//                   })
//                   .option('date', {
//                     type: 'string',
//                   });
//               },
//               handler: (
//                 argv: yargs.Arguments<
//                   { title: string } & { author: string } & { date: string } & {
//                     engine: string;
//                   } & { link: string }
//                 >,
//               ) => {
//                 result.archive = {
//                   link: argv.link,
//                   title: argv.title,
//                   author: argv.author,
//                   date: argv.date,
//                   engine:
//                     typeof argv.engine === 'string'
//                       ? [argv.engine]
//                       : argv.engine,
//                 };
//               },
//             })
//             .parse();
//         }

//         break;
//       }
//       case 'text': {
//         if (!result.title || result.title === '') {
//           if (!(node as any).isInlineCommand) {
//             result.title = getText(node);
//           }
//         }
//         break;
//       }
//     }
//   });

//   console.log(result);
//   if (result) {
//     return {};
//   }

//   // if (tree) {
//   //   return { tree: tree };
//   // }
//   // const tl = onlyTitleAndLink(tree);
//   // console.log(tl);
//   // console.log(remark().stringify(tree as Root));

//   // remove(tree, (node) => {
//   //   return (node as any).isInlineCommand;
//   // });

//   // console.log(remark().stringify(tree as Root));

//   const tree2: any = u('root', [
//     u('paragraph', [u('text', '1')]),
//     u('heading', [u('text', '2')]),
//     u('paragraph', [u('text', '3')]),
//     u('paragraph', [u('text', '4')]),
//   ]);
//   // console.log(inspect(tree));
//   console.log(inspect(tree2));
//   console.log(remark().stringify(tree2));

//   const tree3: any = u(
//     'code',
//     {
//       lang: 'html',
//     },
//     '<head></head>',
//   );
//   console.log(inspect(tree3));
//   console.log(remark().stringify(tree3));

//   const modifier = function (node: Node, index: number, parent: Parent) {
//     console.log('mode', node);
//     if (node.type === 'heading') {
//       parent.children.splice(index, 1, tree3);
//       // return index + 1;
//     }
//     // return undefined;
//   };
//   const modify = modifyChildren(modifier);
//   modify(tree2);

//   console.log(inspect(tree2));
//   console.log(remark().stringify(tree2));
//   // visit(tree, (node) => {
//   //   console.log(node.data);
//   // });

//   return result;
// }
