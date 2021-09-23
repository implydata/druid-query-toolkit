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

import { backAndForth, sane } from '../../test-utils';
import { SqlBase } from '../sql-base';

import { SqlQuery } from './sql-query';

describe('Uber Query', () => {
  const sql = sane`
    WITH temp_t1 AS (SELECT * FROM blah), temp_t2 AS (SELECT * FROM blah2)
    SELECT
      col1 AS "Col1",
      CASE WHEN colA = 1 THEN 3 ELSE 4 END AS "SomeCase1",
      CASE colB WHEN 1 THEN 'One' WHEN 2 THEN 'Two' ELSE 'Other' END AS "SomeCase2",
      EXTRACT(EPOCH FROM "time"),
      EXTRACT(MICROSECOND FROM "time"),
      EXTRACT(MILLISECOND FROM "time"),
      EXTRACT(SECOND FROM "time"),
      EXTRACT(MINUTE FROM "time"),
      EXTRACT(HOUR FROM "time"),
      EXTRACT(DAY FROM "time"),
      EXTRACT(DOW FROM "time"),
      EXTRACT(ISODOW FROM "time"),
      EXTRACT(DOY FROM "time"),
      EXTRACT(WEEK FROM "time"),
      EXTRACT(MONTH FROM "time"),
      EXTRACT(QUARTER FROM "time"),
      EXTRACT(YEAR FROM "time"),
      EXTRACT(ISOYEAR FROM "time"),
      EXTRACT(DECADE FROM "time"),
      EXTRACT(CENTURY FROM "time"),
      EXTRACT(MILLENNIUM FROM "time"),
      SUM(blah) FILTER (WHERE col2 = 'moon')
    FROM t1, t2 AS t2As
    LEFT JOIN t3 ON t1.col = t3.col
    FULL JOIN t4
    WHERE col1 = ?
      AND col2 <> 'B'
      AND col3 < CURRENT_TIMESTAMP - INTERVAL '1' DAY
      AND col4 > 4
      AND col5 <= 3
      AND col6 >= 3
      AND NOT (col7 IS NULL OR col8 IS NOT NULL)
      AND col8 BETWEEN TIMESTAMP '2020-01-01' AND TIMESTAMP '2020-01-01 02:03:04'
      AND col9 BETWEEN SYMMETRIC TIMESTAMP '2020-01-01' AND TIMESTAMP '2020-01-01 02:03:04'
      AND col10 NOT BETWEEN SYMMETRIC TIMESTAMP '2020-01-01' AND TIMESTAMP '2020-01-01 02:03:04'
      AND col11 LIKE '%a%'
      AND col12 LIKE '%a%' ESCAPE 'a'
    GROUP BY
      1,
      col7
    HAVING "Col1" = 'lol'
    ORDER BY COUNT(*) DESC, 1 ASC, 4
    LIMIT 100
    OFFSET 5
  `;

  let query: SqlQuery;
  try {
    query = SqlQuery.parse(sql);
  } catch (e) {
    console.log(e);
    throw e;
  }

  it('works back and forth', () => {
    backAndForth(sql);
  });

  it('walk it all', () => {
    expect(query.walkPostorder(t => SqlBase.fromValue(t.valueOf())).toString()).toEqual(sql);
  });

  it('resetOwnKeywords', () => {
    expect(query.walkPostorder(t => t.resetOwnKeywords()).toString()).toEqual(sql);
  });

  it('.getUsedColumns', () => {
    expect(query.getUsedColumns()).toEqual([
      'Col1',
      'blah',
      'col',
      'col1',
      'col10',
      'col11',
      'col12',
      'col2',
      'col3',
      'col4',
      'col5',
      'col6',
      'col7',
      'col8',
      'col9',
      'colA',
      'colB',
      'time',
    ]);
  });

  it('has things', () => {
    expect(query.hasStarInSelect()).toEqual(false);
    expect(query.hasFrom()).toEqual(true);
    expect(query.hasJoin()).toEqual(true);
    expect(query.hasWhere()).toEqual(true);
    expect(query.hasGroupBy()).toEqual(true);
    expect(query.hasHaving()).toEqual(true);
    expect(query.hasOrderBy()).toEqual(true);
    expect(query.hasLimit()).toEqual(true);
    expect(query.hasOffset()).toEqual(true);
  });

  it('remove one thing', () => {
    expect(query.changeFromExpressions(undefined).hasFrom()).toEqual(false);
    // expect(query. ? .hasJoin()).toEqual(false);
    expect(query.changeWhereExpression(undefined).hasWhere()).toEqual(false);
    expect(query.changeGroupByExpressions(undefined).hasGroupBy()).toEqual(false);
    expect(query.changeHavingExpression(undefined).hasHaving()).toEqual(false);
    expect(query.changeOrderByExpressions(undefined).hasOrderBy()).toEqual(false);
    expect(query.changeLimitValue(undefined).hasLimit()).toEqual(false);
    expect(query.changeOffsetValue(undefined).hasOffset()).toEqual(false);
  });
});
