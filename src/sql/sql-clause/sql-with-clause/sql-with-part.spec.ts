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
import { RefName, SqlColumnList, SqlQuery, SqlTable, SqlWithPart } from '../..';

function withPart(sql: string): SqlWithPart {
  return SqlQuery.parse(`WITH ${sql} SELECT * FROM t`).withClause!.withParts.first();
}

describe('SqlWithPart', () => {
  describe('parses', () => {
    it('round trips', () => {
      const queries: string[] = [
        'WITH t AS (SELECT 1) SELECT * FROM t',
        'WITH "t"  as  ( SELECT 1 ) SELECT * FROM t',
        'WITH t (a, b) AS (SELECT 1, 2) SELECT * FROM t',
        'WITH t(a,b)AS (SELECT 1, 2) SELECT * FROM t',
      ];

      for (const sql of queries) {
        try {
          backAndForth(sql, SqlQuery);
        } catch (e) {
          console.log(`Problem with: \`${sql}\``);
          throw e;
        }
      }
    });

    it('parses the table, columns and query', () => {
      const part = withPart('t (a, b) AS (SELECT 1, 2)');

      expect(part.table.name).toEqual('t');
      expect(part.columns?.toString()).toEqual('(a, b)');
      expect(part.query).toBeInstanceOf(SqlQuery);
      expect(part.query.toString()).toEqual('(SELECT 1, 2)');
    });
  });

  describe('.simple', () => {
    it('creates a part with a quoted name and a parenthesized query', () => {
      expect(SqlWithPart.simple('t', SqlQuery.parse('SELECT 1')).toString()).toEqual(
        '"t" AS (SELECT 1)',
      );
    });

    it('does not double up parens', () => {
      expect(SqlWithPart.simple('t', SqlQuery.parse('(SELECT 1)')).toString()).toEqual(
        '"t" AS (SELECT 1)',
      );
    });
  });

  describe('#changeTable', () => {
    it('changes the table name', () => {
      expect(withPart('t  AS (SELECT 1)').changeTable(RefName.create('u')).toString()).toEqual(
        '"u"  AS (SELECT 1)',
      );
    });
  });

  describe('#changeColumns', () => {
    it('removes the columns and the space after them', () => {
      const part = withPart('t (a)  AS (SELECT 1)').changeColumns(undefined);

      expect(part.columns).toBeUndefined();
      expect(part.toString()).toEqual('t AS (SELECT 1)');
    });

    it('sets a column list as is', () => {
      const columns = SqlColumnList.create([RefName.create('x')]);
      expect(withPart('t AS (SELECT 1)').changeColumns(columns).toString()).toEqual(
        't ("x") AS (SELECT 1)',
      );
    });

    it('creates a column list from names', () => {
      expect(
        withPart('t AS (SELECT 1, 2)')
          .changeColumns([RefName.create('x'), RefName.create('y')])
          .toString(),
      ).toEqual('t ("x", "y") AS (SELECT 1, 2)');
    });

    it('keeps the existing column list formatting when changing names', () => {
      expect(
        withPart('t ( a )AS (SELECT 1)')
          .changeColumns([RefName.create('x')])
          .toString(),
      ).toEqual('t ( "x" )AS (SELECT 1)');
    });
  });

  describe('#changeQuery', () => {
    it('replaces the query', () => {
      expect(
        withPart('t AS (SELECT 1)')
          .changeQuery(SqlQuery.parse('SELECT 2').ensureParens())
          .toString(),
      ).toEqual('t AS (SELECT 2)');
    });
  });

  describe('#_walkInner', () => {
    it('walks into the query', () => {
      expect(
        withPart('t AS (SELECT * FROM a)')
          .walk(ex => (ex instanceof SqlTable ? SqlTable.create('b') : ex))
          .toString(),
      ).toEqual('t AS (SELECT * FROM "b")');
    });

    it('returns the same instance when nothing changes', () => {
      const part = withPart('t AS (SELECT * FROM a)');
      expect(part.walk(ex => ex)).toBe(part);
    });

    it('stops when the walker returns undefined', () => {
      const part = withPart('t AS (SELECT * FROM a)');
      expect(part.walk(ex => (ex instanceof SqlTable ? undefined : ex))).toBe(part);
    });
  });
});
