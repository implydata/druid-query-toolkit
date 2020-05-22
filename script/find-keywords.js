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
    "query": `SELECT 123`
  });

  const calciteRef = await axios.get('https://calcite.apache.org/docs/reference.html');
  const sqlRef = await axios.get('https://raw.githubusercontent.com/apache/druid/master/docs/querying/sql.md');

  const allData = calciteRef.data + sqlRef.data;

  const possibleKeywords = [...new Set(allData.match(/\b[A-Z]+\b/g)).values()].sort();
  console.log(`Got ${possibleKeywords.length} possible keywords`);

  let reservedKeywords = [];
  for (let keyword of possibleKeywords) {
    try {
      await axios.post('http://localhost:8888/druid/v2/sql', {
        "query": `SELECT 123 AS ${keyword}`
      });
    } catch {
      reservedKeywords.push(keyword);
    }
  }

  console.log(`Found ${reservedKeywords.length} reserved keywords`);
  console.log(JSON.stringify(reservedKeywords));
}

main();