import { remark } from 'remark';
import { inspect } from 'unist-util-inspect';
import * as a from './crypto';
import * as b from './detect';
import * as c from './entry';
import * as d from './github';
import * as e from './helper';
import * as f from './parse';
import * as g from './wrap';

console.log(a, b, c, d, e, f, g);

console.log(inspect(remark().parse('>>> test `test` test')));
console.log(inspect(remark().parse('# abc \nhttps://a.b')));
