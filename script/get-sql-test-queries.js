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
const axios = require('axios');

const prefix = `/*
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

import { backAndForth, sane } from '../../test-utils';

describe('Druid test queries', () => {
  const queries = [
`;

const postfix = `
  ];
  
  it('all queries work', () => {
    for (const sql of queries) {
      try {
        backAndForth(sql);
      } catch (e) {
        throw new Error(\`problem with \\\`\${sql}\\\`: \${e.message}\`);
      }
    }
  });
});
`;

async function main() {
  const druidRef = await axios.get('https://raw.githubusercontent.com/apache/druid/master/sql/src/test/java/org/apache/druid/sql/calcite/CalciteQueryTest.java');

  const m = druidRef.data.match(/  "SELECT[^\n]*"(?:\s*\+\s*"[^\n]+")*,\n/igm);
  let queries = [];
  for (let ent of m) {
    try {
      queries.push(eval(ent.slice(0, ent.length - 2)));
    } catch (e) {
      if (!ent.includes('+ elementsString +')) {
        console.log('FAIL');
        console.log(ent);
        throw e;
      }
    }
  }

  fs.writeFileSync(
    './src/sql/sql-query/druid-tests.spec.ts',
    prefix + queries.map(query => {
      return '    sane`\n      ' +
        query.replace(/`/g, '\\`').replace(/\n/g, '\n      ') +
        '\n    `,'
    }).join('') + postfix);
}

main();