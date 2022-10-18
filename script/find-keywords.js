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
const path = require('path');
const axios = require('axios');

async function checkAsAlias(keyword) {
  try {
    const resp = await axios.post('http://localhost:8888/druid/v2/sql', {
      query: `SELECT 123 AS ${keyword}`,
    });

    return resp.data[0]?.[keyword] === 123;
  } catch {
    return false;
  }
}

async function checkAsReference(keyword) {
  try {
    const resp = await axios.post('http://localhost:8888/druid/v2/sql', {
      query: `SELECT ${keyword} FROM (SELECT 123 AS "${keyword}")`,
    });

    return resp.data[0]?.[keyword] === 123;
  } catch {
    return false;
  }
}

async function main() {
  // Do basic check first
  await axios.post('http://localhost:8888/druid/v2/sql', {
    query: `SELECT 123`,
  });

  const urlsToGet = [
    'https://calcite.apache.org/docs/reference.html',
    'https://raw.githubusercontent.com/apache/druid/master/docs/querying/sql.md',
    'https://raw.githubusercontent.com/apache/druid/master/docs/querying/sql-data-types.md',
    'https://raw.githubusercontent.com/apache/druid/master/docs/querying/sql-operators.md',
    'https://raw.githubusercontent.com/apache/druid/master/docs/multi-stage-query/reference.md',
  ];

  const texts = await Promise.all(
    urlsToGet.map(async url => {
      const resp = await axios.get(url);
      return resp.data;
    }),
  );

  try {
    await axios.post('http://localhost:8888/druid/v2/sql', {
      query: `SELECT CURRENT_ROW`,
    });
  } catch (e) {
    const errorMessage = e.response.data.errorMessage;
    if (!errorMessage.startsWith('Encountered')) {
      throw new Error('unexpected response from error message');
    }
    texts.push(errorMessage);
  }

  const allData = texts.join('\n');

  const possibleKeywords = [...new Set(allData.match(/\b[A-Z_]+\b/g)).values()].sort();

  if (possibleKeywords.length < 895) {
    throw new Error(`Expected at least 895 possible keywords, did something move?`);
  }
  console.log(`Got ${possibleKeywords.length} possible keywords`);

  const reservedKeywords = [];
  const reservedAliases = [];
  for (let keyword of possibleKeywords) {
    if (await checkAsAlias(keyword)) {
      // All good nothing to do
    } else if (await checkAsReference(keyword)) {
      reservedAliases.push(keyword);
    } else {
      reservedKeywords.push(keyword);
    }
  }

  console.log(
    `Found ${reservedKeywords.length} reserved keywords and ${reservedAliases.length} reserved aliases`,
  );

  fs.writeFileSync(
    path.join(__dirname, '../src/sql/reserved-keywords.ts'),
    `
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

export const RESERVED_KEYWORDS = ${JSON.stringify(reservedKeywords, undefined, 2)};

export const RESERVED_ALIASES = ${JSON.stringify(reservedAliases, undefined, 2)};
`.trim(),
  );
}

main();
