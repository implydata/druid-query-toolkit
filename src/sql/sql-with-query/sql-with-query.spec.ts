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
import { SqlExpression } from '../sql-expression';

import type { SqlWithQuery } from './sql-with-query';

describe('SqlWithQuery', () => {
  describe('valid with queries', () => {
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
  });

  it('flattenWith', () => {
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

  it('matches snapshot', () => {
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

  it('handles infinite limits', () => {
    const sql = `WITH wiki AS (SELECT * FROM wikipedia) (SELECT * FROM wiki LIMIT 10)`;
    const query = SqlExpression.parse(sql) as SqlWithQuery;

    expect(query.changeLimitValue(undefined).hasLimit()).toEqual(false);
    expect(query.changeLimitValue(Infinity).hasLimit()).toEqual(false);
  });

  it('throws for invalid limit values', () => {
    const sql = `WITH wiki AS (SELECT * FROM wikipedia) (SELECT * FROM wiki LIMIT 10)`;
    const query = SqlExpression.parse(sql) as SqlWithQuery;

    expect(() => query.changeLimitValue(1)).not.toThrowError();
    expect(() => query.changeLimitValue(0)).not.toThrowError();
    expect(() => query.changeLimitValue(-1)).toThrowError('-1 is not a valid limit value');
    expect(() => query.changeLimitValue(-Infinity)).toThrowError(
      '-Infinity is not a valid limit value',
    );
  });
});
