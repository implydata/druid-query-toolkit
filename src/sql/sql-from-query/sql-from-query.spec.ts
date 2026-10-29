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
import {
  SqlColumn,
  SqlExpression,
  SqlFromClause,
  SqlFromQuery,
  SqlJoinPart,
  SqlQuery,
  SqlTable,
} from '../..';
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
      `FROM foo AS t`,
      `FROM foo t`,
      `FROM foo, bar`,
      `FROM foo AS a JOIN bar AS b ON a.x = b.x`,
      `FROM foo LEFT JOIN bar USING (x)`,
      `FROM foo CROSS JOIN bar`,
      `FROM (SELECT x FROM foo) AS t`,
      `FROM (FROM foo |> WHERE x)`,
      `FROM UNNEST(ARRAY[1, 2]) AS u(n)`,
      `FROM TABLE(EXTERN('{}', '{}')) EXTEND (x VARCHAR)`,
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
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
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
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "insertClause": undefined,
          "keywords": Object {},
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "spacing": Object {},
          "type": "fromQuery",
          "unionQuery": undefined,
        }
      `);
    });

    it('parses the joins into the FROM clause', () => {
      const fromQuery = SqlExpression.parse(`FROM foo AS a JOIN bar AS b ON a.x = b.x`);

      expect(fromQuery).toBeInstanceOf(SqlFromQuery);
      expect(String((fromQuery as SqlFromQuery).getFirstFromExpression())).toEqual(`foo AS a`);
      expect((fromQuery as SqlFromQuery).getJoins().map(String)).toEqual([
        `JOIN bar AS b ON a.x = b.x`,
      ]);
    });
  });

  describe('does not parse', () => {
    it.each([`FROM`, `FROM foo WHERE x`, `FROM foo GROUP BY x`, `FROM foo HAVING x`])(
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

    it('takes an aliased table or a sub query', () => {
      expect(SqlFromQuery.create(SqlTable.create('kttm').as('t')).toString()).toEqual(
        `FROM "kttm" AS "t"`,
      );
      expect(SqlFromQuery.create(SqlQuery.parse(`SELECT a FROM t`)).toString()).toEqual(
        `FROM (SELECT a FROM t)`,
      );
    });

    it('takes a FROM clause', () => {
      expect(
        SqlFromQuery.create(
          SqlFromClause.create([SqlTable.create('a'), SqlTable.create('b')]),
        ).toString(),
      ).toEqual(`FROM "a", "b"`);
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

  describe('#changeFromClause', () => {
    it('replaces the FROM clause', () => {
      expect(
        (SqlExpression.parse(`from kttm`) as SqlFromQuery)
          .changeFromClause(SqlFromClause.create([SqlTable.create('wikipedia')]))
          .toString(),
      ).toEqual(`FROM "wikipedia"`);
    });

    it('returns the same query for the same clause', () => {
      const fromQuery = SqlExpression.parse(`FROM kttm`) as SqlFromQuery;

      expect(fromQuery.changeFromClause(fromQuery.fromClause)).toBe(fromQuery);
    });
  });

  describe('#getFromExpressions', () => {
    it('gets the comma separated expressions', () => {
      expect(
        (SqlExpression.parse(`FROM foo AS a, bar`) as SqlFromQuery)
          .getFromExpressions()
          .map(String),
      ).toEqual([`foo AS a`, `bar`]);
    });
  });

  describe('#getFirstFromExpression', () => {
    it('gets the first expression', () => {
      expect(
        String(
          (SqlExpression.parse(`FROM druid.kttm, bar`) as SqlFromQuery).getFirstFromExpression(),
        ),
      ).toEqual(`druid.kttm`);
    });
  });

  describe('#changeFromExpressions', () => {
    it('keeps the keyword and the joins', () => {
      expect(
        (SqlExpression.parse(`from  foo JOIN bar ON true`) as SqlFromQuery)
          .changeFromExpressions([SqlTable.optionalQuotes('baz')])
          .toString(),
      ).toEqual(`from  baz JOIN bar ON true`);
    });
  });

  describe('#hasJoin', () => {
    it('works', () => {
      expect((SqlExpression.parse(`FROM foo`) as SqlFromQuery).hasJoin()).toEqual(false);
      expect((SqlExpression.parse(`FROM foo JOIN bar ON true`) as SqlFromQuery).hasJoin()).toEqual(
        true,
      );
    });
  });

  describe('#getJoins', () => {
    it('gets nothing without a join', () => {
      expect((SqlExpression.parse(`FROM foo`) as SqlFromQuery).getJoins()).toEqual([]);
    });
  });

  describe('#addJoin', () => {
    it('adds a join', () => {
      expect(
        (SqlExpression.parse(`FROM foo AS a`) as SqlFromQuery)
          .addJoin(
            SqlJoinPart.create(
              'LEFT',
              SqlTable.optionalQuotes('bar').as('b'),
              SqlColumn.optionalQuotes('x', 'a').equal(SqlColumn.optionalQuotes('x', 'b')),
            ),
          )
          .toString(),
      ).toEqual(sane`
        FROM foo AS a
        LEFT JOIN bar AS "b" ON a.x = b.x
      `);
    });
  });

  describe('#removeAllJoins', () => {
    it('removes the joins', () => {
      expect(
        (SqlExpression.parse(`FROM foo JOIN bar ON true LEFT JOIN baz USING (x)`) as SqlFromQuery)
          .removeAllJoins()
          .toString(),
      ).toEqual(`FROM foo`);
    });
  });

  describe('#getSelectExpressionsArray', () => {
    it('reads every column, like SELECT *', () => {
      expect(
        (SqlExpression.parse('FROM t') as SqlFromQuery).getSelectExpressionsArray().map(String),
      ).toEqual(['*']);
    });
  });

  describe('#walk', () => {
    it('walks the FROM clause', () => {
      const fromQuery = SqlExpression.parse(`FROM druid.kttm`);

      expect(fromQuery.getUsedTableNames()).toEqual(['kttm']);

      expect(
        fromQuery
          .walk(ex => (ex instanceof SqlTable ? SqlTable.optionalQuotes('wikipedia') : ex))
          .toString(),
      ).toEqual(`FROM wikipedia`);
    });

    it('walks the joins', () => {
      expect(
        SqlExpression.parse(`FROM foo JOIN bar ON foo.x = bar.x`)
          .walk(ex => (ex instanceof SqlColumn ? ex.changeName('y') : ex))
          .toString(),
      ).toEqual(`FROM foo JOIN bar ON foo.y = bar.y`);
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
