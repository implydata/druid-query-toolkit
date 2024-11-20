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

import awesomeCodeStyle, { configs } from '@awesome-code-style/eslint-config';
import notice from 'eslint-plugin-notice';
import globals from 'globals';

const HEADER_TEMPLATE = `
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

`.trimStart();

const TYPESCRIPT_FILES = ['**/*.ts', '**/*.tsx'];

export default [
  ...awesomeCodeStyle,
  ...configs.typeChecked.map(config => ({ ...config, files: TYPESCRIPT_FILES })),
  {
    plugins: {
      notice,
    },
    rules: {
      'notice/notice': [2, { template: HEADER_TEMPLATE }],
    },
  },
  {
    files: ['*.js', 'script/*.js'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-require-imports': [0],
    },
  },
];
