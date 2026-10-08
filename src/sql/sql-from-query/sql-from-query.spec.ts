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

import type { SqlComparison } from '../..';
import { SqlExpression, SqlFromQuery, SqlQuery, SqlTable } from '../..';
import { backAndForth } from '../../test-utils';
import { sane } from '../../utils';

describe('SqlFromQuery', () => {
  describe('parses', () => {
    it.each([
      `FROM "kttm"`,
      `FROM kttm`,
      `FROM druid.kttm`,
      `FROM "druid"."kttm"`,
      `from  "kttm"`,
      `FROM druid . kttm`,
      `FROM"kttm"`,
      `(FROM "kttm")`,
      `EXPLAIN PLAN FOR FROM foo`,
      `FROM foo LIMIT 10`,
      `FROM foo UNION ALL FROM bar`,
      `INSERT INTO bar FROM foo PARTITIONED BY DAY`,
      sane`
        SET x = 1;
        FROM foo
      `,
    ])('does back and forth with %s', sql => {
      backAndForth(sql, SqlFromQuery);
    });

    it('keeps a FROM query as the rhs of an IN', () => {
      const query = SqlExpression.parse(`SELECT 1 WHERE 1 IN (FROM "kttm")`) as SqlQuery;
      const rhs = (query.whereClause!.expression as SqlComparison).rhs;

      expect(rhs).toBeInstanceOf(SqlFromQuery);
    });

    describe('as a sub query', () => {
      it.each([
        `SELECT * FROM (FROM "kttm") LIMIT 3`,
        `SELECT * FROM (FROM "kttm") AS t`,
        `SELECT COUNT(*) FROM (FROM kttm) WHERE country = 'Argentina'`,
      ])('does back and forth with %s', sql => {
        backAndForth(sql, SqlQuery);
      });
    });

    it('parses to the expected tree', () => {
      expect(SqlExpression.parse(`FROM "kttm"`)).toMatchInlineSnapshot(`
        SqlFromQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "explain": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "from": "FROM",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "spacing": Object {
            "postFrom": " ",
          },
          "table": SqlTable {
            "keywords": Object {},
            "namespace": undefined,
            "parens": undefined,
            "refName": RefName {
              "name": "kttm",
              "quotes": true,
            },
            "spacing": Object {},
            "type": "table",
          },
          "type": "fromQuery",
          "unionQuery": undefined,
        }
      `);
    });
  });

  describe('does not parse', () => {
    it.each([`FROM a.b.c`, `FROM foo AS t`, `FROM foo, bar`, `FROM foo JOIN bar ON true`])(
      'rejects %s',
      sql => {
        expect(() => SqlExpression.parse(sql)).toThrow('Expected');
      },
    );
  });

  describe('.create', () => {
    it('works', () => {
      expect(SqlFromQuery.create('kttm').toString()).toEqual(`FROM "kttm"`);
      expect(SqlFromQuery.create(SqlTable.create('kttm', 'druid')).toString()).toEqual(
        `FROM "druid"."kttm"`,
      );
    });

    it('returns a given from query as is', () => {
      const fromQuery = SqlFromQuery.create('kttm');

      expect(SqlFromQuery.create(fromQuery)).toBe(fromQuery);
    });
  });

  describe('.optionalQuotes', () => {
    it('works', () => {
      expect(SqlFromQuery.optionalQuotes('kttm').toString()).toEqual(`FROM kttm`);
      expect(SqlFromQuery.optionalQuotes('has space').toString()).toEqual(`FROM "has space"`);
    });

    it('returns a given from query as is', () => {
      const fromQuery = SqlFromQuery.create('kttm');

      expect(SqlFromQuery.optionalQuotes(fromQuery)).toBe(fromQuery);
    });
  });

  describe('#changeTable', () => {
    it('replaces the table', () => {
      expect(
        SqlFromQuery.create('kttm').changeTable(SqlTable.create('wikipedia')).toString(),
      ).toEqual(`FROM "wikipedia"`);
    });
  });

  describe('#getTableName', () => {
    it('gets the table name', () => {
      expect((SqlExpression.parse(`FROM druid.kttm`) as SqlFromQuery).getTableName()).toEqual(
        'kttm',
      );
    });
  });

  describe('#changeTableName', () => {
    it('keeps the namespace', () => {
      expect(
        (SqlExpression.parse(`FROM druid.kttm`) as SqlFromQuery)
          .changeTableName('wikipedia')
          .toString(),
      ).toEqual(`FROM druid.wikipedia`);
    });
  });

  describe('#getNamespaceName', () => {
    it('gets the namespace name', () => {
      expect((SqlExpression.parse(`FROM druid.kttm`) as SqlFromQuery).getNamespaceName()).toEqual(
        'druid',
      );
    });
  });

  describe('#changeNamespace', () => {
    it('removes the namespace', () => {
      expect(
        (SqlExpression.parse(`FROM druid.kttm`) as SqlFromQuery)
          .changeNamespace(undefined)
          .toString(),
      ).toEqual(`FROM kttm`);
    });
  });

  describe('#walk', () => {
    it('walks the underlying table', () => {
      const fromQuery = SqlExpression.parse(`FROM druid.kttm`);

      expect(fromQuery.getUsedTableNames()).toEqual(['kttm']);

      expect(
        fromQuery
          .walk(ex => (ex instanceof SqlTable ? SqlTable.optionalQuotes('wikipedia') : ex))
          .toString(),
      ).toEqual(`FROM wikipedia`);
    });

    it('stops when the substitutor returns undefined', () => {
      const fromQuery = SqlExpression.parse(`FROM druid.kttm`);

      expect(fromQuery.walk(ex => (ex instanceof SqlTable ? undefined : ex))).toBe(fromQuery);
    });
  });

  describe('#prettify', () => {
    it('works', () => {
      expect(SqlExpression.parse(`from   druid . kttm`).prettify().toString()).toEqual(
        `FROM druid.kttm`,
      );
    });
  });
});
