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

const axios = require('axios');
const { RefName, SqlFunction } = require('../dist');
const { RESERVED_KEYWORDS } = RefName;
const { SPECIAL_FUNCTIONS } = SqlFunction;

async function main() {
  // Do basic check first
  await axios.post('http://localhost:8888/druid/v2/sql', {
    query: `SELECT 123`,
  });

  const legalNames = [
    'ARRAY',
    'CAST',
    'CLASSIFIER',
    'CONVERT',
    'CURSOR',
    'EXISTS',
    'EXTRACT',
    'GROUPING',
    'JSON_ARRAYAGG',
    'JSON_EXISTS',
    'JSON_OBJECT',
    'JSON_OBJECTAGG',
    'JSON_QUERY',
    'JSON_VALUE',
    'LOCAL',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'MATCH_NUMBER',
    'MULTISET',
    'NOT',
    'OVERLAY',
    'PERIOD',
    'POSITION',
    'STREAM',
    'SUBSTRING',
    'TABLE',
    'UNNEST',
    'USER',
  ];
  for (const k of RESERVED_KEYWORDS) {
    if (SPECIAL_FUNCTIONS.includes(k)) continue;
    if (['GROUPING', 'CASE', 'CAST'].includes(k)) continue;
    if (legalNames.includes(k)) continue;

    try {
      await axios.post('http://localhost:8888/druid/v2/sql', {
        query: `SELECT ${k}(1)`,
      });
      legalNames.push(k);
    } catch (e) {
      const { errorMessage } = e.response.data;

      if (!errorMessage) {
        throw new Error(`Invalid error for: ${k}`);
      } else if (
        errorMessage.startsWith(`Incorrect syntax near the keyword '${k}' at line 1, column 8.`) ||
        errorMessage.startsWith(
          `Received an unexpected token [(] (line [1], column [${`SELECT ${k}(`.length}])`,
        )
      ) {
        // Truly illegal
      } else {
        if (
          !(
            errorMessage.startsWith(`No match found for function signature ${k}`) ||
            errorMessage.startsWith(
              `Invalid number of arguments to function '${k}'. Was expecting`,
            ) ||
            errorMessage.startsWith(
              `OVER clause is necessary for window functions (line [1], column [8])`,
            )
          )
        ) {
          console.error(`${k} : ${errorMessage.split('\n')[0]}`);
        }
        legalNames.push(k);
      }
    }
  }

  legalNames.sort();

  console.log('-----------------------------');
  console.log(`Found ${legalNames.length} legal function names:`);
  console.log(JSON.stringify(legalNames));
}

main();
