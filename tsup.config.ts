/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { defineConfig } from 'tsup';

const entry = { index: 'src/index.ts' };

export default defineConfig([
  {
    entry,
    format: ['esm', 'cjs'],
    splitting: false,
    sourcemap: true,
  },
  {
    // The browser build is UMD: AMD loaders (such as `require` on ObservableHQ, which is d3-require)
    // get the module through `define`, and a plain <script> tag still gets the `druid` global.
    entry,
    format: ['iife'],
    globalName: 'druid',
    sourcemap: true,
    banner: {
      js: `(function (root, factory) {
  if (typeof define === 'function' && define.amd) define([], factory);
  else if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.druid = factory();
})(typeof self !== 'undefined' ? self : this, function () {`,
    },
    footer: { js: 'return druid;\n});' },
  },
]);
