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
  SqlPipesQuery,
  SqlQuery,
  SqlUnionPipeOperator,
} from '../..';
import { backAndForthPipeOperator } from '../../test-utils';

function parseOperator(sql: string): SqlUnionPipeOperator {
  return (SqlExpression.parse(`FROM t ${sql}`) as SqlPipesQuery).getLastPipeOperator() as any;
}

describe('SqlUnionPipeOperator', () => {
  describe('parses', () => {
    it.each([
      `|> UNION ALL (FROM u)`,
      `|> UNION (FROM u)`,
      `|> UNION DISTINCT (FROM u)`,
      `|> union  all  ( FROM u |> SELECT a ) ,(SELECT a FROM v)`,
      `|> UNION ALL (\n  FROM u\n  |> SELECT a\n)`,
      `|> UNION ALL (VALUES (1)), (TABLE v), ((SELECT 1) UNION ALL (SELECT 2))`,
    ])('does back and forth with %s', sql => {
      backAndForthPipeOperator(sql, SqlUnionPipeOperator);
    });

    it('parses the queries', () => {
      const operator = parseOperator(`|> UNION all (FROM u |> SELECT a), (SELECT b FROM v)`);

      expect(operator.decorator).toEqual('ALL');
      expect(operator.keywords['decorator']).toEqual('all');
      expect(operator.queries.values[0]).toBeInstanceOf(SqlPipesQuery);
      expect(operator.queries.values[1]).toBeInstanceOf(SqlQuery);
      expect(operator.queries.values.every(query => query.hasParens())).toEqual(true);
    });
  });

  describe('does not parse', () => {
    it.each([
      `FROM t |> UNION ALL`,
      `FROM t |> UNION ALL FROM u`,
      `FROM t |> UNION ALL SELECT a FROM u`,
      `FROM t |> UNION ALL (FROM u),`,
    ])('rejects %s', sql => {
      expect(() => SqlExpression.parse(sql)).toThrow('Expected');
    });
  });

  describe('.create', () => {
    it('makes a UNION ALL of the queries, in parentheses', () => {
      expect(
        SqlUnionPipeOperator.create([
          SqlFromQuery.create('u'),
          SqlQuery.parse(`SELECT a FROM v`),
        ]).toString(),
      ).toEqual(`|> UNION ALL (FROM "u"), (SELECT a FROM v)`);
    });

    it('works with a decorator', () => {
      expect(
        SqlUnionPipeOperator.create([SqlFromQuery.create('u')], 'DISTINCT').toString(),
      ).toEqual(`|> UNION DISTINCT (FROM "u")`);
    });
  });

  describe('#isAll', () => {
    it('works', () => {
      expect(parseOperator(`|> UNION ALL (FROM u)`).isAll()).toEqual(true);
      expect(parseOperator(`|> UNION DISTINCT (FROM u)`).isAll()).toEqual(false);
      expect(parseOperator(`|> UNION (FROM u)`).isAll()).toEqual(false);
    });
  });

  describe('#changeDecorator', () => {
    it('removes the decorator with its keyword', () => {
      expect(
        parseOperator(`|> union  all  (FROM u)`).changeDecorator(undefined).toString(),
      ).toEqual(`|> union  (FROM u)`);
    });

    it('adds a decorator', () => {
      expect(parseOperator(`|> UNION (FROM u)`).changeDecorator('ALL').toString()).toEqual(
        `|> UNION ALL (FROM u)`,
      );
    });

    it('returns the same operator for the same decorator', () => {
      const operator = parseOperator(`|> UNION ALL (FROM u)`);

      expect(operator.changeDecorator('ALL')).toBe(operator);
    });
  });

  describe('#changeQueries', () => {
    it('puts the queries in parentheses', () => {
      expect(
        parseOperator(`|> UNION ALL (FROM u)`)
          .changeQueries([SqlFromQuery.create('v'), SqlFromQuery.create('w')])
          .toString(),
      ).toEqual(`|> UNION ALL (FROM "v"), (FROM "w")`);
    });
  });

  describe('#walk', () => {
    it('walks the queries', () => {
      expect(
        parseOperator(`|> UNION ALL (SELECT a FROM u)`)
          .walk(ex => (ex instanceof SqlColumn ? SqlColumn.create('b') : ex))
          .toString(),
      ).toEqual(`|> UNION ALL (SELECT "b" FROM u)`);
    });

    it('stops when the substitutor returns undefined', () => {
      const operator = parseOperator(`|> UNION ALL (SELECT a FROM u)`);

      expect(operator.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(operator);
    });

    it('throws when a query is replaced with something that is not a query', () => {
      expect(() =>
        parseOperator(`|> UNION ALL (FROM u)`).walk(ex =>
          ex instanceof SqlFromQuery ? SqlColumn.create('x') : ex,
        ),
      ).toThrow('must return a sql query');
    });
  });

  describe('#clearOwnSeparators', () => {
    it('clears the list separators', () => {
      expect(
        parseOperator(`|> UNION ALL (FROM u) ,(FROM v)`).clearOwnSeparators().toString(),
      ).toEqual(`|> UNION ALL (FROM u), (FROM v)`);
    });
  });
});
