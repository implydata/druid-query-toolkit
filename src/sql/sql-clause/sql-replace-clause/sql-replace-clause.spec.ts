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

import { backAndForth } from '../../../test-utils';
import {
  SqlColumn,
  SqlExpression,
  SqlQuery,
  SqlReplaceClause,
  SqlTable,
  SqlWhereClause,
} from '../..';

describe('SqlReplaceClause', () => {
  describe('parses', () => {
    it.each([
      `REPLACE INTO t OVERWRITE ALL SELECT * FROM x PARTITIONED BY DAY`,
      `replace  into  "t"  overwrite  all SELECT * FROM x`,
      `REPLACE INTO t (a, b) OVERWRITE ALL SELECT 1, 2`,
      `REPLACE INTO t OVERWRITE WHERE __time >= TIMESTAMP '2020-01-01' SELECT * FROM x`,
      `REPLACE INTO t\nOVERWRITE\nWHERE a = 1 AND b = 2\nSELECT * FROM x`,
    ])('does back and forth with %s', sql => {
      backAndForth(sql, SqlQuery);
    });

    it('parses the table, columns and where clause', () => {
      const clause = SqlQuery.parse(
        `REPLACE INTO t (a, b) OVERWRITE WHERE a = 1 SELECT 1, 2`,
      ).replaceClause!;

      expect(clause).toBeInstanceOf(SqlReplaceClause);
      expect(clause.table).toBeInstanceOf(SqlTable);
      expect(String(clause.columns)).toEqual(`(a, b)`);
      expect(String(clause.whereClause)).toEqual(`WHERE a = 1`);
    });

    it('parses ALL without a where clause', () => {
      const clause = SqlQuery.parse(`REPLACE INTO t OVERWRITE all SELECT 1`).replaceClause!;

      expect(clause.whereClause).toBeUndefined();
      expect(clause.keywords.all).toEqual('all');
    });
  });

  describe('.create', () => {
    it('creates a clause from a table name', () => {
      expect(SqlReplaceClause.create('t').toString()).toEqual(`REPLACE INTO "t" OVERWRITE ALL`);
    });

    it('creates a clause from a table expression', () => {
      expect(SqlReplaceClause.create(SqlTable.create('t', 'ns')).toString()).toEqual(
        `REPLACE INTO "ns"."t" OVERWRITE ALL`,
      );
    });

    it('returns the same instance when given a replace clause', () => {
      const clause = SqlReplaceClause.create('t');

      expect(SqlReplaceClause.create(clause)).toBe(clause);
    });

    it('wraps a where expression in a where clause', () => {
      expect(SqlReplaceClause.create('t', SqlExpression.parse(`a = 1`)).toString()).toEqual(
        `REPLACE INTO "t" OVERWRITE WHERE a = 1`,
      );
    });

    it('accepts a where clause', () => {
      expect(
        SqlReplaceClause.create(
          't',
          SqlWhereClause.create(SqlExpression.parse(`a = 1`)),
        ).toString(),
      ).toEqual(`REPLACE INTO "t" OVERWRITE WHERE a = 1`);
    });
  });

  describe('#changeTable', () => {
    const clause = SqlQuery.parse(`replace into t (a) overwrite all SELECT 1`).replaceClause!;

    it('accepts a string', () => {
      expect(clause.changeTable('u').toString()).toEqual(`replace into "u" (a) overwrite all`);
    });

    it('accepts an expression', () => {
      expect(clause.changeTable(SqlTable.create('u', 'ns')).toString()).toEqual(
        `replace into "ns"."u" (a) overwrite all`,
      );
    });
  });

  describe('#_walkInner', () => {
    const clause = SqlReplaceClause.create('t', SqlExpression.parse(`a = 1`));

    it('returns the same instance when nothing changes', () => {
      expect(clause.walk(ex => ex)).toBe(clause);
    });

    it('substitutes the table', () => {
      expect(
        clause.walk(ex => (ex instanceof SqlTable ? SqlTable.create('u') : ex)).toString(),
      ).toEqual(`REPLACE INTO "u" OVERWRITE WHERE a = 1`);
    });

    it('substitutes inside the where clause', () => {
      expect(
        clause.walk(ex => (ex instanceof SqlColumn ? SqlColumn.create('b') : ex)).toString(),
      ).toEqual(`REPLACE INTO "t" OVERWRITE WHERE "b" = 1`);
    });

    it('stops when the table walk returns undefined', () => {
      expect(
        clause._walkHelper([], ex => (ex instanceof SqlTable ? undefined : ex), false),
      ).toBeUndefined();
    });

    it('stops when the where clause walk returns undefined', () => {
      expect(
        clause._walkHelper([], ex => (ex instanceof SqlWhereClause ? undefined : ex), false),
      ).toBeUndefined();
    });

    it('throws when the table is replaced by something that is not an expression', () => {
      expect(() =>
        clause.walk(ex =>
          ex instanceof SqlTable ? SqlWhereClause.create(SqlExpression.parse(`x`)) : ex,
        ),
      ).toThrow('expression walker must return a SQL expression');
    });
  });

  describe('#changeWhereClause', () => {
    it('adds a where clause in place of ALL', () => {
      const clause = SqlQuery.parse(`REPLACE INTO t OVERWRITE ALL SELECT 1`).replaceClause!;

      expect(
        clause.changeWhereClause(SqlWhereClause.create(SqlExpression.parse(`a = 1`))).toString(),
      ).toEqual(`REPLACE INTO t OVERWRITE WHERE a = 1`);
    });

    it('goes back to ALL when the where clause is removed', () => {
      const clause = SqlQuery.parse(`replace into t overwrite where a = 1 SELECT 1`).replaceClause!;

      const changed = clause.changeWhereClause(undefined);

      expect(changed.whereClause).toBeUndefined();
      expect(changed.toString()).toEqual(`replace into t overwrite ALL`);
    });
  });
});
