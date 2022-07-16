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

import { backAndForth } from '../../test-utils';
import { sane } from '../../utils';
import { SqlExpression } from '../sql-expression';

import { SqlValues } from './sql-values';

describe('SqlValues', () => {
  it('things that work', () => {
    const queries: string[] = [
      `VALUES   (1, 2), (3, 4), (5, 6)  ORDER  BY  1  DESC`,
      `VALUES (1, 2), (3, 4), (5, 6) ORDER BY 1 DESC LIMIT 2`,
    ];

    for (const sql of queries) {
      try {
        backAndForth(sql, SqlValues);
      } catch (e) {
        console.log(`Problem with: \`${sql}\``);
        throw e;
      }
    }
  });

  it('prettifies single', () => {
    expect(SqlExpression.parse(`Values   (1, 2   , 'V')`).prettify().toString()).toEqual(
      `VALUES (1, 2, 'V')`,
    );
  });

  it('prettifies multi', () => {
    expect(SqlExpression.parse(`Values   (1, 2),   (3, 4),   (5, 6)`).prettify().toString())
      .toEqual(sane`
      VALUES
      (1, 2),
      (3, 4),
      (5, 6)
    `);
  });
});
