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
import { SqlLiteral } from '../sql-literal/sql-literal';
import { SqlRecord } from '../sql-record/sql-record';

import { SqlValues } from './sql-values';

describe('SqlValues', () => {
  it.each([
    `VALUES (1), (2)`,
    `VALUES   (1, 2), (3, 4), (5, 6)  ORDER  BY  1  DESC`,
    `VALUES (1, 2), (3, 4), (5, 6) ORDER BY 1 DESC LIMIT 2`,
  ])('does back and forth with %s', sql => {
    backAndForth(sql, SqlValues);
  });

  it('.create', () => {
    expect(
      SqlValues.create([SqlRecord.create([1, 2, 3].map(v => SqlLiteral.create(v)))]).toString(),
    ).toEqual(`(VALUES (1, 2, 3))`);

    expect(
      SqlValues.create([
        SqlRecord.create([1, 2, 3].map(v => SqlLiteral.create(v))),
        SqlRecord.create([4, 5, 6].map(v => SqlLiteral.create(v))),
        SqlRecord.create([7, 8, 9].map(v => SqlLiteral.create(v))),
      ]).toString(),
    ).toEqual(sane`
      (
        VALUES
        (1, 2, 3),
        (4, 5, 6),
        (7, 8, 9)
      )
    `);
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

  it('handles infinite limits', () => {
    const values = SqlValues.create([
      SqlRecord.create([1, 2, 3].map(v => SqlLiteral.create(v))),
    ]).changeLimitValue(2);

    expect(values.toString()).toEqual(sane`
      (
        VALUES (1, 2, 3)
        LIMIT 2
      )
    `);
    expect(values.changeLimitValue(undefined).toString()).toEqual(sane`
      (VALUES (1, 2, 3))
    `);
    expect(values.changeLimitValue(Infinity).toString()).toEqual(sane`
      (VALUES (1, 2, 3))
    `);
  });

  it('throws for invalid limit values', () => {
    const values = SqlValues.create([SqlRecord.create([1, 2, 3].map(v => SqlLiteral.create(v)))]);

    expect(() => values.changeLimitValue(1)).not.toThrowError();
    expect(() => values.changeLimitValue(0)).not.toThrowError();
    expect(() => values.changeLimitValue(-1)).toThrowError('-1 is not a valid limit value');
    expect(() => values.changeLimitValue(-Infinity)).toThrowError(
      '-Infinity is not a valid limit value',
    );
  });
});
