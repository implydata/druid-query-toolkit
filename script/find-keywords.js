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

const keywords = ["ALL","ALTER","APPLY","AS","ASC","ATTRIBUTES","BY","CATALOG","CROSS","CUBE","DATABASE","DELETE","DESC","DESCRIBE","DISTINCT","EXCEPT","EXCLUDING","EXPLAIN","EXTEND","FETCH","FIRST","FOLLOWING","FOR","FROM","FULL","GROUP","GROUPING","HAVING","IMPLEMENTATION","INCLUDING","INNER","INSERT","INTERSECT","INTO","JOIN","JSON","LAST","LATERAL","LEFT","LIMIT","MATCHED","MERGE","MINUS","NATURAL","NEXT","NOT","NULL","NULLS","OF","OFFSET","ON","ONLY","ORDER","ORDINALITY","OUTER","PARTITION","PLAN","PRECEDING","RANGE","RESET","RIGHT","ROLLUP","ROW","ROWS","SCHEMA","SELECT","SESSION","SET","SETS","SPECIFIC","STATEMENT","STREAM","SYSTEM","TABLE","THEN","TYPE","UNION","UNNEST","UPDATE","UPSERT","USING","VALUES","WHEN","WHERE","WINDOW","WITH","WITHOUT","XML"];

async function main() {
  // do basic check
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