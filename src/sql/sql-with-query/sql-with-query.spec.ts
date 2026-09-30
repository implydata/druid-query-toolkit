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

import type { SqlBase } from '../..';
import {
  SqlLiteral,
  SqlQuery,
  SqlRecord,
  SqlTable,
  SqlValues,
  SqlWithClause,
  SqlWithPart,
} from '../..';
import { backAndForth } from '../../test-utils';
import { sane } from '../../utils';
import { SqlExpression } from '../sql-expression';

import { SqlWithQuery } from './sql-with-query';

function parseWithQuery(sql: string): SqlWithQuery {
  const parsed = SqlExpression.parse(sql);
  if (!(parsed instanceof SqlWithQuery)) throw new Error(`not a WITH query: ${sql}`);
  return parsed;
}

describe('SqlWithQuery', () => {
  describe('parses', () => {
    it.each([
      `WITH wiki AS (SELECT * FROM wikipedia) (SELECT * FROM wiki)`,
      `WITH wiki AS (SELECT * FROM wikipedia) (SELECT * FROM wiki) ORDER BY __time DESC LIMIT 3 OFFSET 0`,
      sane`
        INSERT INTO dst
        WITH wiki AS (SELECT * FROM wikipedia) (SELECT * FROM wiki) ORDER BY __time DESC LIMIT 3 OFFSET 0
      `,
      sane`
        REPLACE INTO dst OVERWRITE ALL
        WITH wiki AS (SELECT * FROM wikipedia) (SELECT * FROM wiki) ORDER BY __time DESC LIMIT 3 OFFSET 0
      `,
      sane`
        WITH wiki AS (SELECT * FROM wikipedia)
        (
          WITH wiki2 AS (SELECT * FROM wiki)
          (
            SELECT * FROM wiki2
          )
        )
        PARTITIONED BY ALL
        CLUSTERED BY page
      `,
    ])('correctly parses: %s', sql => {
      backAndForth(sql);
    });

    it('parses to the expected tree', () => {
      const sql = `WITH wiki AS (SELECT * FROM wikipedia) (SELECT * FROM wiki)`;

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlWithQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "explain": undefined,
          "insertClause": undefined,
          "keywords": Object {},
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "query": SqlQuery {
            "clusteredByClause": undefined,
            "contextStatements": undefined,
            "decorator": undefined,
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
                      "name": "wiki",
                      "quotes": false,
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
            "groupByClause": undefined,
            "havingClause": undefined,
            "insertClause": undefined,
            "keywords": Object {
              "select": "SELECT",
            },
            "limitClause": undefined,
            "offsetClause": undefined,
            "orderByClause": undefined,
            "parens": Array [
              Object {
                "leftSpacing": "",
                "rightSpacing": "",
              },
            ],
            "partitionedByClause": undefined,
            "replaceClause": undefined,
            "selectExpressions": SeparatedArray {
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
            "spacing": Object {
              "postSelect": " ",
              "preFromClause": " ",
            },
            "type": "query",
            "unionQuery": undefined,
            "whereClause": undefined,
            "withClause": undefined,
          },
          "replaceClause": undefined,
          "spacing": Object {
            "postWithClause": " ",
          },
          "type": "withQuery",
          "unionQuery": undefined,
          "withClause": SqlWithClause {
            "keywords": Object {
              "with": "WITH",
            },
            "parens": undefined,
            "spacing": Object {
              "postWith": " ",
            },
            "type": "withClause",
            "withParts": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlWithPart {
                  "columns": undefined,
                  "keywords": Object {
                    "as": "AS",
                  },
                  "parens": undefined,
                  "query": SqlQuery {
                    "clusteredByClause": undefined,
                    "contextStatements": undefined,
                    "decorator": undefined,
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
                              "name": "wikipedia",
                              "quotes": false,
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
                    "groupByClause": undefined,
                    "havingClause": undefined,
                    "insertClause": undefined,
                    "keywords": Object {
                      "select": "SELECT",
                    },
                    "limitClause": undefined,
                    "offsetClause": undefined,
                    "orderByClause": undefined,
                    "parens": Array [
                      Object {
                        "leftSpacing": "",
                        "rightSpacing": "",
                      },
                    ],
                    "partitionedByClause": undefined,
                    "replaceClause": undefined,
                    "selectExpressions": SeparatedArray {
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
                    "spacing": Object {
                      "postSelect": " ",
                      "preFromClause": " ",
                    },
                    "type": "query",
                    "unionQuery": undefined,
                    "whereClause": undefined,
                    "withClause": undefined,
                  },
                  "spacing": Object {
                    "postAs": " ",
                    "postTable": " ",
                  },
                  "table": RefName {
                    "name": "wiki",
                    "quotes": false,
                  },
                  "type": "withPart",
                },
              ],
            },
          },
        }
      `);
    });
  });

  describe('#changeWithClause', () => {
    const query = parseWithQuery(`WITH a AS (SELECT 1) (SELECT * FROM a)`);

    it('returns the same instance when nothing changes', () => {
      expect(query.changeWithClause(query.withClause)).toBe(query);
    });

    it('changes the WITH clause', () => {
      expect(
        String(
          query.changeWithClause(
            SqlWithClause.create([SqlWithPart.simple('b', SqlQuery.parse(`(SELECT 2)`))]),
          ),
        ),
      ).toEqual(`WITH "b" AS (SELECT 2) (SELECT * FROM a)`);
    });
  });

  describe('#changeQuery', () => {
    const query = parseWithQuery(`WITH a AS (SELECT 1) (SELECT * FROM a)`);

    it('returns the same instance when nothing changes', () => {
      expect(query.changeQuery(query.query)).toBe(query);
    });

    it('changes the inner query', () => {
      expect(
        String(query.changeQuery(SqlValues.create([SqlRecord.create([SqlLiteral.ONE])]))),
      ).toEqual(`WITH a AS (SELECT 1) (VALUES ROW(1))`);
    });
  });

  describe('#getWithParts', () => {
    it('returns the WITH parts', () => {
      expect(
        parseWithQuery(`WITH a AS (SELECT 1), b AS (SELECT 2) (SELECT * FROM b)`)
          .getWithParts()
          .map(String),
      ).toEqual(['a AS (SELECT 1)', 'b AS (SELECT 2)']);
    });
  });

  describe('#changeWithParts', () => {
    it('replaces the WITH parts', () => {
      const query = parseWithQuery(`WITH a AS (SELECT 1), b AS (SELECT 2) (SELECT * FROM b)`);

      expect(String(query.changeWithParts(query.getWithParts().slice(1)))).toEqual(
        `WITH b AS (SELECT 2) (SELECT * FROM b)`,
      );
    });
  });

  describe('#prependWith', () => {
    it('adds a WITH part at the front', () => {
      expect(
        String(
          parseWithQuery(`WITH a AS (SELECT 1) (SELECT * FROM a)`).prependWith(
            'z',
            SqlQuery.parse(`SELECT 0`),
          ),
        ),
      ).toEqual(`WITH "z" AS (SELECT 0),\na AS (SELECT 1) (SELECT * FROM a)`);
    });
  });

  describe('#flattenWith', () => {
    it('flattens nested WITH clauses into one', () => {
      const sql = sane`
        -- Leading comment
        REPLACE INTO dst OVERWRITE ALL
        WITH wiki1 AS (SELECT * FROM wikipedia), wiki2 AS (SELECT * FROM wikipedia)
        (
          WITH wiki3 AS (SELECT * FROM wiki1), wiki4 AS (SELECT * FROM wiki2)
          (
            SELECT * FROM wiki2 LIMIT 100
          )
        )
        PARTITIONED BY ALL
        -- Trailing comment
      `;

      const query = SqlExpression.parse(sql) as SqlWithQuery;

      expect(String(query.flattenWith()).trim()).toEqual(sane`
        -- Leading comment
        REPLACE INTO dst OVERWRITE ALL
        WITH
        wiki1 AS (SELECT * FROM wikipedia),
        wiki2 AS (SELECT * FROM wikipedia),
        wiki3 AS (SELECT * FROM wiki1),
        wiki4 AS (SELECT * FROM wiki2)
        SELECT * FROM wiki2 LIMIT 100
        PARTITIONED BY ALL
        -- Trailing comment
      `);
    });

    it('carries the INSERT clause and the suffix clauses over', () => {
      const query = parseWithQuery(sane`
        INSERT INTO dst
        WITH a AS (SELECT * FROM wikipedia)
        (SELECT * FROM a ORDER BY page)
        ORDER BY __time
        LIMIT 3
        OFFSET 2
        PARTITIONED BY ALL
        CLUSTERED BY page
      `);

      expect(String(query.flattenWith())).toMatchInlineSnapshot(`
        "INSERT INTO dst
        WITH a AS (SELECT * FROM wikipedia)
        SELECT * FROM a ORDER BY __time
        LIMIT 3
        OFFSET 2
        PARTITIONED BY ALL
        CLUSTERED BY page"
      `);
    });

    it('leaves the query alone when the outer ORDER BY would change which rows the inner LIMIT or OFFSET keeps', () => {
      for (const sql of [
        `WITH a AS (SELECT * FROM t) (SELECT * FROM a ORDER BY x LIMIT 3) ORDER BY y`,
        `WITH a AS (SELECT * FROM t) (SELECT * FROM a OFFSET 5) ORDER BY y LIMIT 3`,
      ]) {
        const query = parseWithQuery(sql);
        expect(query.flattenWith()).toBe(query);
      }
    });

    it('shrinks an inner limit by the outer offset', () => {
      const flatten = (sql: string) => String(parseWithQuery(sql).flattenWith());

      expect(
        flatten(`WITH a AS (SELECT * FROM t) (SELECT * FROM a LIMIT 3) LIMIT 10 OFFSET 2`),
      ).toEqual(`WITH a AS (SELECT * FROM t)\nSELECT * FROM a LIMIT 1\nOFFSET 2`);

      expect(
        flatten(`WITH a AS (SELECT * FROM t) (SELECT * FROM a LIMIT 10 OFFSET 1) LIMIT 3 OFFSET 2`),
      ).toEqual(`WITH a AS (SELECT * FROM t)\nSELECT * FROM a LIMIT 3 OFFSET 3`);

      expect(flatten(`WITH a AS (SELECT * FROM t) (SELECT * FROM a LIMIT 3) OFFSET 5`)).toEqual(
        `WITH a AS (SELECT * FROM t)\nSELECT * FROM a LIMIT 0\nOFFSET 5`,
      );
    });

    it('leaves the query alone when the inner query can not take a WITH clause', () => {
      const query = parseWithQuery(`WITH a AS (SELECT 1) (VALUES (1))`);

      expect(query.flattenWith()).toBe(query);
    });
  });

  describe('#walk', () => {
    const query = parseWithQuery(`WITH a AS (SELECT * FROM t) (SELECT * FROM t)`);

    it('substitutes inside the WITH clause and the query', () => {
      expect(String(query.walk(ex => (ex instanceof SqlTable ? ex.changeName('u') : ex)))).toEqual(
        `WITH a AS (SELECT * FROM u) (SELECT * FROM u)`,
      );
    });

    it.each<[string, (q: SqlWithQuery) => SqlBase]>([
      ['the WITH clause', q => q.withClause],
      ['the query', q => q.query],
    ])('stops at %s when the substitutor returns undefined', (_name, getTarget) => {
      const target = getTarget(query);
      const visited: SqlBase[] = [];

      expect(
        query.walk(ex => {
          visited.push(ex);
          return ex === target ? undefined : ex;
        }),
      ).toBe(query);
      expect(visited[visited.length - 1]).toBe(target);
    });
  });

  describe('#changeLimitValue', () => {
    it('handles infinite limits', () => {
      const sql = `WITH wiki AS (SELECT * FROM wikipedia) (SELECT * FROM wiki LIMIT 10)`;
      const query = SqlExpression.parse(sql) as SqlWithQuery;

      expect(query.changeLimitValue(undefined).hasLimit()).toEqual(false);
      expect(query.changeLimitValue(Infinity).hasLimit()).toEqual(false);
    });

    it('throws for invalid limit values', () => {
      const sql = `WITH wiki AS (SELECT * FROM wikipedia) (SELECT * FROM wiki LIMIT 10)`;
      const query = SqlExpression.parse(sql) as SqlWithQuery;

      expect(() => query.changeLimitValue(1)).not.toThrow();
      expect(() => query.changeLimitValue(0)).not.toThrow();
      expect(() => query.changeLimitValue(-1)).toThrow('-1 is not a valid limit value');
      expect(() => query.changeLimitValue(-Infinity)).toThrow(
        '-Infinity is not a valid limit value',
      );
    });
  });
});
