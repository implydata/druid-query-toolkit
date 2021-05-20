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
const { RESERVED_KEYWORDS } = require('../build/sql/reserved-keywords');
const { SPECIAL_FUNCTIONS } = require('../build/sql/special-functions');

async function main() {
  // Do basic check first
  await axios.post('http://localhost:8888/druid/v2/sql', {
    query: `SELECT 123`,
  });

  const legalNames = [
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'NOT',
    'STREAM',
    'EXISTS',
    'JSON_ARRAYAGG',
    'ARRAY',
    'CLASSIFIER',
    'CONVERT',
    'CURSOR',
    'EXTRACT',
    'JSON_EXISTS',
    'JSON_OBJECT',
    'JSON_OBJECTAGG',
    'JSON_QUERY',
    'JSON_VALUE',
    'MATCH_NUMBER',
    'MULTISET',
    'OVERLAY',
    'PERIOD',
    'POSITION',
    'SUBSTRING',
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
        console.error(`${k} : No error`);
      } else if (
        errorMessage.includes('No match found for function signature') ||
        errorMessage.includes('Invalid number of arguments to function')
      ) {
        legalNames.push(k);
      } else if (
        !(
          errorMessage.startsWith(`Encountered "${k}"`) ||
          errorMessage.startsWith(`Encountered "("`) ||
          errorMessage.startsWith(`Encountered "${k} ("`)
        )
      ) {
        console.error(`${k} : ${errorMessage.split('\n')[0]}`);
      }
    }
  }

  console.log(JSON.stringify(legalNames.sort()));
}

main();
