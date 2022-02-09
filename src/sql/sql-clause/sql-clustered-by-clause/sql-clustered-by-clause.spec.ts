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

import { sane } from '../../../utils';
import { SqlQuery } from '../..';

describe('SqlClusteredByClause', () => {
  describe('#shiftIndexes', () => {
    const sql = SqlQuery.parse(sane`
      SELECT
        COUNT(*) AS "Count",
        isAnonymous,
        cityName,
        flags,
        SUM(added) AS "sum_added"
      FROM wikipedia
      CLUSTERED BY 2, 3, 4
    `);

    it('works', () => {
      expect(sql.clusteredByClause!.shiftIndexes(0).toString()).toEqual(`CLUSTERED BY 3, 4, 5`);
      expect(sql.clusteredByClause!.shiftIndexes(1).toString()).toEqual(`CLUSTERED BY 3, 4, 5`);
      expect(sql.clusteredByClause!.shiftIndexes(2).toString()).toEqual(`CLUSTERED BY 2, 4, 5`);
      expect(sql.clusteredByClause!.shiftIndexes(3).toString()).toEqual(`CLUSTERED BY 2, 3, 5`);
      expect(sql.clusteredByClause!.shiftIndexes(4).toString()).toEqual(`CLUSTERED BY 2, 3, 4`);
      expect(sql.clusteredByClause!.shiftIndexes(5).toString()).toEqual(`CLUSTERED BY 2, 3, 4`);
    });
  });
});
