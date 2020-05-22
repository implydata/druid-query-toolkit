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

  let reserved = [];
  for (let keyword of keywords) {
    try {
      await axios.post('http://localhost:8888/druid/v2/sql', {
        "query": `SELECT 123 AS ${keyword}`
      });
    } catch {
      reserved.push(keyword);
    }
  }

  console.log(JSON.stringify(reserved));
}

main();