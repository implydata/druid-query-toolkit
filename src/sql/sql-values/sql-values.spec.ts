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
import { SqlAlias } from '../sql-alias/sql-alias';
import { SqlExpression } from '../sql-expression';
import { SqlLiteral } from '../sql-literal/sql-literal';
import { SqlQuery } from '../sql-query/sql-query';
import { SqlRecord } from '../sql-record/sql-record';
import { SqlTable } from '../sql-table/sql-table';
import { SqlWithQuery } from '../sql-with-query/sql-with-query';

import { SqlValues } from './sql-values';

describe('SqlValues', () => {
  it.each([
    `VALUES (1), (2)`,
    `VALUES   (1, 2), (3, 4), (5, 6)  ORDER  BY  1  DESC`,
    `VALUES (1, 2), (3, 4), (5, 6) ORDER BY 1 DESC LIMIT 2`,
    `VALUES (1), (2) ORDER BY 1 DESC LIMIT 2 OFFSET 3`,
    `EXPLAIN PLAN FOR VALUES (1, 2)`,
    `INSERT INTO t VALUES (1, 2), (3, 4) PARTITIONED BY ALL`,
    `INSERT INTO t (a, b) VALUES (1, 2), (3, 4) PARTITIONED BY ALL`,
    `REPLACE INTO t OVERWRITE ALL VALUES (1, 2) PARTITIONED BY DAY CLUSTERED BY a`,
    `VALUES (1) UNION ALL VALUES (2)`,
    sane`
      SET x = 1;
      INSERT INTO t VALUES (1) PARTITIONED BY ALL
    `,
  ])('does back and forth with %s', sql => {
    backAndForth(sql, SqlValues);
  });

  it.each([
    `WITH t AS (VALUES (1), (2)) SELECT * FROM t`,
    `SELECT * FROM (VALUES (1), (2) LIMIT 1)`,
  ])('does back and forth with %s', sql => {
    backAndForth(sql, SqlQuery);
  });

  it('wraps a VALUES body in a WITH query', () => {
    backAndForth(`WITH t AS (SELECT 1) (VALUES (1))`, SqlWithQuery);
  });

  it('falls back to reading a trailing alias as an expression', () => {
    expect(SqlExpression.parse(`VALUES (1) AS t`)).toBeInstanceOf(SqlAlias);
  });

  it('parses the ingest wrappers onto the VALUES itself', () => {
    const values = SqlExpression.parse(
      `INSERT INTO t (a, b) VALUES (1, 2) PARTITIONED BY ALL`,
    ) as SqlValues;

    expect(values).toBeInstanceOf(SqlValues);
    expect(values.getInsertIntoTable()).toBeInstanceOf(SqlTable);
    expect(String(values.getInsertIntoTable())).toEqual(`t`);
    expect(String(values.insertClause!.columns)).toEqual(`(a, b)`);
    expect(String(values.partitionedByClause)).toEqual(`PARTITIONED BY ALL`);
    expect(values.records.length()).toEqual(1);
  });

  it('has the query wrapper methods from SqlQueryBase', () => {
    const values = SqlExpression.parse(`VALUES (1), (2) LIMIT 2`) as SqlValues;

    expect(values.hasLimit()).toEqual(true);
    expect(values.getLimitValue()).toEqual(2);
    expect(values.hasOrderBy()).toEqual(false);
    expect(values.hasOffset()).toEqual(false);

    expect(String(values.makeExplain())).toEqual(`EXPLAIN PLAN FOR\nVALUES (1), (2) LIMIT 2`);
    expect(String(values.changeInsertIntoTable('t'))).toEqual(
      `INSERT INTO "t"\nVALUES (1), (2) LIMIT 2`,
    );
    expect(String(values.changeLimitValue(undefined))).toEqual(`VALUES (1), (2)`);
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
