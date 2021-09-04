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

async function main() {
  // Do basic check first
  await axios.post('http://localhost:8888/druid/v2/sql', {
    query: `SELECT 123`,
  });

  const calciteRef = await axios.get('https://calcite.apache.org/docs/reference.html');
  const sqlRef = await axios.get(
    'https://raw.githubusercontent.com/apache/druid/master/docs/querying/sql.md',
  );

  let errorMessage;
  try {
    await axios.post('http://localhost:8888/druid/v2/sql', {
      query: `SELECT CURRENT_ROW`,
    });
  } catch (e) {
    errorMessage = e.response.data.errorMessage;
    if (!errorMessage.startsWith('Encountered')) {
      throw new Error('unexpected response from error message');
    }
  }

  const allData = calciteRef.data + sqlRef.data + errorMessage;

  const possibleKeywords = [...new Set(allData.match(/\b[A-Z_]+\b/g)).values()].sort();
  console.log(`Got ${possibleKeywords.length} possible keywords`);

  const reservedKeywords = [];
  const reservedAliases = [];
  for (let keyword of possibleKeywords) {
    try {
      await axios.post('http://localhost:8888/druid/v2/sql', {
        query: `SELECT 123 AS ${keyword}`,
      });
    } catch {
      try {
        await axios.post('http://localhost:8888/druid/v2/sql', {
          query: `SELECT ${keyword} FROM (SELECT 123 AS "${keyword}")`,
        });
        reservedAliases.push(keyword);
      } catch {
        reservedKeywords.push(keyword);
      }
    }
  }

  console.log(
    `Found ${reservedKeywords.length} reserved keywords and ${reservedAliases.length} reserved aliases`,
  );
  console.log('export const RESERVED_KEYWORDS = ' + JSON.stringify(reservedKeywords));
  console.log('export const RESERVED_ALIASES = ' + JSON.stringify(reservedAliases));
}

main();
