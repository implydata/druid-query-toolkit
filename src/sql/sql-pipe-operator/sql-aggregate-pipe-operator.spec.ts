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

import type { SqlPipesQuery } from '../..';
import {
  SqlAggregatePipeOperator,
  SqlColumn,
  SqlExpression,
  SqlFunction,
  SqlGroupByClause,
} from '../..';
import { backAndForthPipeOperator } from '../../test-utils';

function parseOperator(sql: string): SqlAggregatePipeOperator {
  return (SqlExpression.parse(`FROM t ${sql}`) as SqlPipesQuery).getLastPipeOperator() as any;
}

describe('SqlAggregatePipeOperator', () => {
  describe('parses', () => {
    it.each([
      `|> AGGREGATE COUNT(*)`,
      `|> AGGREGATE COUNT(*) AS c`,
      `|> AGGREGATE COUNT(DISTINCT visitor) AS visitors GROUP BY site, bucket_start`,
      `|> AGGREGATE GROUP BY a`,
      `|> aggregate  SUM(a) AS s ,  MAX(b) AS m\n  group by  c`,
      `|> AGGREGATE\n  SUM(x) FILTER (WHERE d >= TIMESTAMP '2026-01-01') AS cur,\n  COUNT(*) AS n\nGROUP BY site`,
      `|> AGGREGATE COUNT(*) GROUP BY ()`,
    ])('does back and forth with %s', sql => {
      backAndForthPipeOperator(sql, SqlAggregatePipeOperator);
    });

    it('parses to the expected tree', () => {
      expect(parseOperator(`|> AGGREGATE COUNT(*) AS c GROUP BY a`)).toMatchInlineSnapshot(`
        SqlAggregatePipeOperator {
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": RefName {
                  "name": "c",
                  "quotes": false,
                },
                "columns": undefined,
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlStar {
                        "keywords": Object {},
                        "parens": undefined,
                        "spacing": Object {},
                        "table": undefined,
                        "type": "star",
                      },
                    ],
                  },
                  "decorator": undefined,
                  "extendClause": undefined,
                  "functionName": RefName {
                    "name": "COUNT",
                    "quotes": false,
                  },
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "spacing": Object {
                    "postArguments": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                  "windowSpec": undefined,
                },
                "keywords": Object {
                  "as": "AS",
                },
                "parens": undefined,
                "spacing": Object {
                  "preAlias": " ",
                  "preAs": " ",
                },
                "type": "alias",
              },
            ],
          },
          "groupByClause": SqlGroupByClause {
            "decorator": undefined,
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlColumn {
                  "keywords": Object {},
                  "parens": undefined,
                  "refName": RefName {
                    "name": "a",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "table": undefined,
                  "type": "column",
                },
              ],
            },
            "innerParens": false,
            "keywords": Object {
              "groupBy": "GROUP BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postGroupBy": " ",
            },
            "type": "groupByClause",
          },
          "keywords": Object {
            "aggregate": "AGGREGATE",
          },
          "parens": undefined,
          "spacing": Object {
            "postAggregate": " ",
            "postPipe": " ",
            "preGroupByClause": " ",
          },
          "type": "aggregatePipeOperator",
        }
      `);
    });
  });

  describe('does not parse', () => {
    it.each([`FROM t |> AGGREGATE`, `FROM t |> AGGREGATE GROUP BY`])('rejects %s', sql => {
      expect(() => SqlExpression.parse(sql)).toThrow('Expected');
    });
  });

  describe('.create', () => {
    it('works with aggregates and a group by', () => {
      expect(
        SqlAggregatePipeOperator.create(
          [SqlFunction.count().as('c')],
          [SqlColumn.create('a')],
        ).toString(),
      ).toEqual(`|> AGGREGATE COUNT(*) AS "c" GROUP BY "a"`);
    });

    it('works with only a group by clause', () => {
      expect(
        SqlAggregatePipeOperator.create(
          undefined,
          SqlGroupByClause.create([SqlColumn.create('a')]),
        ).toString(),
      ).toEqual(`|> AGGREGATE GROUP BY "a"`);
    });

    it('throws when there is nothing to aggregate or group by', () => {
      expect(() => SqlAggregatePipeOperator.create([])).toThrow(
        'an AGGREGATE pipe operator needs aggregates or a GROUP BY',
      );
    });
  });

  describe('#changeExpressions', () => {
    it('replaces the aggregates', () => {
      expect(
        parseOperator(`|> AGGREGATE COUNT(*) GROUP BY a`)
          .changeExpressions([SqlFunction.simple('SUM', [SqlColumn.create('b')])])
          .toString(),
      ).toEqual(`|> AGGREGATE SUM("b") GROUP BY a`);
    });

    it('can remove the aggregates', () => {
      expect(
        parseOperator(`|> AGGREGATE COUNT(*) GROUP BY a`).changeExpressions(undefined).toString(),
      ).toEqual(`|> AGGREGATE GROUP BY a`);
    });
  });

  describe('#changeGroupByClause', () => {
    it('removes the group by along with its spacing', () => {
      expect(
        parseOperator(`|> AGGREGATE COUNT(*)\nGROUP BY a`)
          .changeGroupByClause(undefined)
          .changeGroupByClause(SqlGroupByClause.create([SqlColumn.create('b')]))
          .toString(),
      ).toEqual(`|> AGGREGATE COUNT(*) GROUP BY "b"`);
    });

    it('returns the same operator when nothing changes', () => {
      const operator = parseOperator(`|> AGGREGATE COUNT(*)`);

      expect(operator.changeGroupByClause(undefined)).toBe(operator);
    });
  });

  describe('#getGroupByExpressions', () => {
    it('gets the grouping expressions', () => {
      expect(
        parseOperator(`|> AGGREGATE COUNT(*) GROUP BY a, b`).getGroupByExpressions().map(String),
      ).toEqual(['a', 'b']);
      expect(parseOperator(`|> AGGREGATE COUNT(*)`).getGroupByExpressions()).toEqual([]);
    });
  });

  describe('#walk', () => {
    it('walks the aggregates and the group by', () => {
      expect(
        parseOperator(`|> AGGREGATE SUM(a) GROUP BY a`)
          .walk(ex => (ex instanceof SqlColumn ? SqlColumn.create('b') : ex))
          .toString(),
      ).toEqual(`|> AGGREGATE SUM("b") GROUP BY "b"`);
    });

    it('stops when the substitutor returns undefined', () => {
      const operator = parseOperator(`|> AGGREGATE SUM(a) GROUP BY a`);

      expect(operator.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(operator);
    });
  });

  describe('#clearOwnSeparators', () => {
    it('clears the aggregate separators', () => {
      expect(parseOperator(`|> AGGREGATE SUM(a) ,MAX(b)`).clearOwnSeparators().toString()).toEqual(
        `|> AGGREGATE SUM(a),\n  MAX(b)`,
      );
    });

    it('does nothing without aggregates', () => {
      const operator = parseOperator(`|> AGGREGATE GROUP BY a`);

      expect(operator.clearOwnSeparators()).toBe(operator);
    });
  });
});
