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

import {
  SqlColumn,
  SqlExpression,
  SqlFromQuery,
  SqlParensQuery,
  SqlPipesQuery,
  SqlQuery,
  SqlQueryBase,
} from '../..';
import { backAndForth } from '../../test-utils';
import { sane } from '../../utils';

function parseParensQuery(sql: string): SqlParensQuery {
  const parsed = SqlExpression.parse(sql);
  if (!(parsed instanceof SqlParensQuery)) throw new Error(`not a parens query: ${sql}`);
  return parsed;
}

describe('SqlParensQuery', () => {
  describe('parses', () => {
    it.each([
      `(FROM t) UNION ALL (FROM u)`,
      `(SELECT 1) UNION ALL (SELECT 2) UNION ALL (SELECT 3)`,
      `(SELECT a FROM t) ORDER BY a LIMIT 5`,
      `( SELECT a FROM t )  LIMIT 5`,
      `((SELECT a FROM t)) LIMIT 5`,
      `EXPLAIN PLAN FOR (SELECT a FROM t)`,
      `INSERT INTO dst (SELECT * FROM t) PARTITIONED BY DAY`,
      sane`
        SET x = 1;
        (SELECT a FROM t)
      `,
    ])('does back and forth with %s', sql => {
      backAndForth(sql, SqlParensQuery);
    });

    it('wraps the query in parentheses', () => {
      const query = parseParensQuery(`(FROM t) UNION ALL (FROM u)`);

      expect(query.query).toBeInstanceOf(SqlFromQuery);
      expect(query.query.hasParens()).toEqual(true);
      expect(query.unionQuery).toBeInstanceOf(SqlFromQuery);
      expect(query.unionQuery!.hasParens()).toEqual(true);
    });

    it.each([`(SELECT a FROM t) LIMIT 5 |> WHERE a > 1`, `(FROM t) UNION ALL (FROM u) |> WHERE a`])(
      'is the root of a pipeline when the clauses outside the parentheses come before the pipes: %s',
      sql => {
        const query = SqlExpression.parse(sql) as SqlPipesQuery;

        expect(query).toBeInstanceOf(SqlPipesQuery);
        expect(query.query).toBeInstanceOf(SqlParensQuery);
        expect(query.toString()).toEqual(sql);
      },
    );

    it('is only used when there is something outside of the parentheses', () => {
      for (const sql of [`(SELECT 1)`, `((FROM t))`, `  (FROM t)  `]) {
        const query = SqlExpression.parse(sql);

        expect(query).not.toBeInstanceOf(SqlParensQuery);
        expect(query.toString()).toEqual(sql);
      }

      const pipesQuery = SqlExpression.parse(`(FROM t) |> WHERE a`) as SqlPipesQuery;

      expect(pipesQuery).toBeInstanceOf(SqlPipesQuery);
      expect(pipesQuery.query).toBeInstanceOf(SqlFromQuery);
      expect(pipesQuery.query.hasParens()).toEqual(true);
    });

    it('works as a sub query', () => {
      backAndForth(`SELECT * FROM ((SELECT a FROM t) UNION ALL (SELECT b FROM u))`, SqlQuery);
      backAndForth(`SELECT * FROM t WHERE a IN ((SELECT a FROM u) LIMIT 1)`, SqlQuery);
    });
  });

  describe('does not parse', () => {
    it.each([`(FROM t`, `(FROM t) WHERE a`, `(SELECT 1) (SELECT 2)`])('rejects %s', sql => {
      expect(() => SqlExpression.parse(sql)).toThrow();
    });
  });

  describe('.create', () => {
    it('puts the query in parentheses', () => {
      expect(
        SqlParensQuery.create(SqlQuery.parse(`SELECT a FROM t`)).changeLimitValue(5).toString(),
      ).toEqual(`(SELECT a FROM t)\nLIMIT 5`);
    });
  });

  describe('#changeQuery', () => {
    it('puts the new query in parentheses', () => {
      expect(
        parseParensQuery(`(FROM t) LIMIT 5`).changeQuery(SqlFromQuery.create('u')).toString(),
      ).toEqual(`(FROM "u") LIMIT 5`);
    });

    it('returns the same instance when nothing changes', () => {
      const query = parseParensQuery(`(FROM t) LIMIT 5`);

      expect(query.changeQuery(query.query)).toBe(query);
    });
  });

  describe('#walk', () => {
    it('walks the query and the clauses around it', () => {
      expect(
        SqlExpression.parse(`(SELECT a FROM t) UNION ALL (SELECT a FROM u)`)
          .walk(ex => (ex instanceof SqlColumn ? SqlColumn.optionalQuotes('b') : ex))
          .toString(),
      ).toEqual(`(SELECT b FROM t) UNION ALL (SELECT b FROM u)`);
    });

    it('throws when the query is replaced with something that is not a query', () => {
      expect(() =>
        parseParensQuery(`(FROM t) LIMIT 1`).walk(ex =>
          ex instanceof SqlFromQuery ? SqlColumn.create('x') : ex,
        ),
      ).toThrow();
    });
  });

  describe('#getSelectExpressionsArray', () => {
    it('answers from the query it wraps', () => {
      expect(
        parseParensQuery(`(SELECT a, b AS c FROM t) UNION ALL (SELECT d, e FROM u)`)
          .getSelectExpressionsArray()
          .map(String),
      ).toEqual(['a', 'b AS c']);
    });
  });

  describe('#getWhereExpression', () => {
    it('answers from the query it wraps', () => {
      expect(
        String(parseParensQuery(`(SELECT a FROM t WHERE x = 1) LIMIT 5`).getWhereExpression()),
      ).toEqual(`x = 1`);
    });
  });

  describe('#getGroupByExpressions', () => {
    it('answers from the query it wraps', () => {
      expect(
        parseParensQuery(`(SELECT a, COUNT(*) FROM t GROUP BY a) LIMIT 5`)
          .getGroupByExpressions()!
          .map(String),
      ).toEqual(['a']);
    });
  });

  describe('#getHavingExpression', () => {
    it('answers from the query it wraps', () => {
      expect(
        String(
          parseParensQuery(
            `(SELECT a, COUNT(*) FROM t GROUP BY a HAVING COUNT(*) > 1) LIMIT 5`,
          ).getHavingExpression(),
        ),
      ).toEqual(`COUNT(*) > 1`);
    });
  });

  describe('#getOutputColumns', () => {
    it('gets the output columns of the query it wraps', () => {
      const query = SqlQueryBase.parse(`(SELECT a, b AS c FROM t) ORDER BY a`);

      expect(query.getOutputColumns()).toEqual(['a', 'c']);
      expect(query.getOrderByForOutputColumn('a')?.toString()).toEqual(`a`);
    });
  });
});
