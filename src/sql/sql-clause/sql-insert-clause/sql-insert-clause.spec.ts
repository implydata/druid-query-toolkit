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
import { SqlExpression, SqlFunction, SqlInsertClause, SqlQuery, SqlTable } from '../..';

describe('SqlInsertClause', () => {
  describe('parses', () => {
    it('parses a column list as columns, not as function arguments', () => {
      const query = SqlQuery.parse(`INSERT INTO t (a, b) SELECT 1, 2 PARTITIONED BY ALL`);
      const insertClause = query.insertClause!;

      expect(insertClause.table).toBeInstanceOf(SqlTable);
      expect(String(insertClause.table)).toEqual(`t`);
      expect(String(insertClause.columns)).toEqual(`(a, b)`);
    });

    it('still treats an EXTERN target followed by AS as a function', () => {
      const query = SqlQuery.parse(
        `INSERT INTO EXTERN(S3(bucket => 'b')) AS CSV SELECT * FROM tbl`,
      );
      const insertClause = query.insertClause!;

      expect(insertClause.table).toBeInstanceOf(SqlFunction);
      expect(insertClause.columns).toBeUndefined();
      expect(insertClause.format).toEqual('CSV');
    });

    it.each([
      `INSERT INTO t (a, b) SELECT 1, 2 PARTITIONED BY ALL`,
      `INSERT INTO "t" ("a", "b") SELECT 1, 2`,
      `INSERT INTO EXTERN(S3(bucket => 'b')) AS CSV SELECT * FROM tbl`,
      `INSERT INTO EXTERN(S3(bucket => 'b'))   AS   CSV SELECT 1`,
    ])('does back and forth with %s', sql => {
      backAndForth(sql, SqlQuery);
    });

    it('preserves the casing of the INSERT, INTO and AS keywords', () => {
      const sql = `insert into extern(local(x => 'y')) as csv SELECT 1`;
      const query = SqlQuery.parse(sql);

      expect(query.insertClause!.keywords).toEqual({
        insert: 'insert',
        into: 'into',
        as: 'as',
      });
      expect(String(query)).toEqual(sql);
    });
  });

  describe('does not parse', () => {
    it('rejects a column list on an export target', () => {
      // The column list and the export format are mutually exclusive: the target is either a
      // function with `AS <format>` or a table with a column list, never both. If this ever
      // parsed it would not round trip, since the clause renders the columns before the AS.
      expect(() =>
        SqlQuery.parse(`INSERT INTO EXTERN(S3(bucket => 'b')) AS CSV (a, b) SELECT 1`),
      ).toThrow();
    });
  });

  describe('.create', () => {
    it('creates a clause from a table name', () => {
      expect(SqlInsertClause.create('t').toString()).toEqual(`INSERT INTO "t"`);
    });

    it('creates a clause from a table expression', () => {
      expect(SqlInsertClause.create(SqlTable.create('t', 'ns')).toString()).toEqual(
        `INSERT INTO "ns"."t"`,
      );
    });

    it('returns the same instance when given an insert clause', () => {
      const clause = SqlInsertClause.create('t');

      expect(SqlInsertClause.create(clause)).toBe(clause);
    });
  });

  describe('#changeTable', () => {
    it('accepts an expression', () => {
      const query = SqlQuery.parse(`insert into t (a) SELECT 1`);

      expect(query.insertClause!.changeTable(SqlTable.create('u', 'ns')).toString()).toEqual(
        `insert into "ns"."u" (a)`,
      );
    });

    it('keeps the format when the clause is changed', () => {
      const query = SqlQuery.parse(`INSERT INTO EXTERN(S3(bucket => 'b')) AS CSV SELECT 1`);
      const changed = query.insertClause!.changeTable('t');

      expect(changed.format).toEqual('CSV');
      expect(String(changed)).toEqual(`INSERT INTO "t" AS CSV`);
    });
  });

  describe('#_walkInner', () => {
    const clause = SqlInsertClause.create('t');

    it('returns the same instance when nothing changes', () => {
      expect(clause.walk(ex => ex)).toBe(clause);
    });

    it('substitutes the table', () => {
      expect(
        clause.walk(ex => (ex instanceof SqlTable ? SqlTable.create('u') : ex)).toString(),
      ).toEqual(`INSERT INTO "u"`);
    });

    it('substitutes inside an export target', () => {
      const exportClause = SqlQuery.parse(
        `INSERT INTO EXTERN(local(path => 'a')) AS CSV SELECT 1`,
      ).insertClause!;

      expect(
        exportClause
          .walk(ex =>
            ex instanceof SqlFunction && ex.getEffectiveFunctionName() === 'LOCAL'
              ? SqlExpression.parse(`local(path => 'b')`)
              : ex,
          )
          .toString(),
      ).toEqual(`INSERT INTO EXTERN(local(path => 'b')) AS CSV`);
    });

    it('stops when the table walk returns undefined', () => {
      expect(
        clause._walkHelper([], ex => (ex instanceof SqlTable ? undefined : ex), false),
      ).toBeUndefined();
    });
  });
});
