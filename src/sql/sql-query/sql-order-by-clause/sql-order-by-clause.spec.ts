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

import { sane } from '../../../test-utils';
import { SqlQuery } from '../..';

describe('SqlOrderByClause', () => {
  describe('#shiftIndexes', () => {
    const sql = SqlQuery.parse(sane`
      SELECT
        isAnonymous,
        COUNT(*) AS "Count",
        SUM(added) AS "sum_added",
        SUM(deleted) AS "sum_deleted"
      FROM wikipedia
      GROUP BY 1
      ORDER BY 2 DESC, 3, 4 ASC
    `);

    it('works', () => {
      expect(sql.orderByClause!.shiftIndexes(0).toString()).toEqual(`ORDER BY 3 DESC, 4, 5 ASC`);
      expect(sql.orderByClause!.shiftIndexes(1).toString()).toEqual(`ORDER BY 3 DESC, 4, 5 ASC`);
      expect(sql.orderByClause!.shiftIndexes(2).toString()).toEqual(`ORDER BY 2 DESC, 4, 5 ASC`);
      expect(sql.orderByClause!.shiftIndexes(3).toString()).toEqual(`ORDER BY 2 DESC, 3, 5 ASC`);
      expect(sql.orderByClause!.shiftIndexes(4).toString()).toEqual(`ORDER BY 2 DESC, 3, 4 ASC`);
    });
  });
});
