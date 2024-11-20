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

const fs = require('fs');
const peg = require('peggy');
const tspegjs = require('ts-pegjs');

const header = fs.readFileSync('./src/sql/parser/druidsql.header.js', 'utf-8');
const rules = fs.readFileSync('./src/sql/parser/druidsql.pegjs', 'utf-8');

let parser;
try {
  parser = peg.generate(header + '\n\n' + rules, {
    output: 'source',
    plugins: [tspegjs],
  });
} catch (e) {
  console.error('Failed to compile');
  console.error(e.message);
  console.error(e.location);
  process.exit(1);
}

const wrappedParser = `
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

/* eslint-disable */

import * as S from '..';

${parser}

`;

// Write to src
fs.writeFileSync('./src/sql/parser/index.ts', wrappedParser);
