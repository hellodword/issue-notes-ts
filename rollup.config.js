// plugin-node-resolve and plugin-commonjs are required for a rollup bundled project
// to resolve dependencies from node_modules. See the documentation for these plugins
// for more details.
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default {
  input: 'src/entry.ts',
  output: {
    exports: 'named',
    format: 'cjs',
    file: 'dist/index.js',
    sourcemap: true,
  },
  plugins: [typescript(), commonjs(), nodeResolve({ browser: false }), json()],
};
