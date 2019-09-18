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

import { sqlParserFactory } from './parser/druidsql';
import { FUNCTIONS } from './test-utils';

const parser = sqlParserFactory(FUNCTIONS);

describe('Playground 1', () => {
  it('remove first column in group by', () => {
    const tree = parser(`SELECT
  "page", "count", "user",
  COUNT(*) AS "Count"
FROM "wikipedia"
GROUP BY 1,2,3
ORDER BY "Count" DESC`)
      .removeGroupBy('page')
      .toString();

    expect(tree).toMatchInlineSnapshot(`
      "SELECT
        \\"count\\", \\"user\\", COUNT(*) AS \\"Count\\"
      FROM \\"wikipedia\\"
      GROUP BY 1,2
      ORDER BY \\"Count\\" DESC"
    `);
  });
});
