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

import { SqlWithQuery } from './sql-with-query';

describe('SqlWithQuery', () => {
  it('things that work', () => {
    const queries: string[] = [
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
      `,
    ];

    for (const sql of queries) {
      try {
        backAndForth(sql);
      } catch (e) {
        console.log(`Problem with: \`${sql}\``);
        throw e;
      }
    }
  });

  it('flattenWith', () => {
    const sql = sane`
      REPLACE INTO dst OVERWRITE ALL
      WITH wiki1 AS (SELECT * FROM wikipedia), wiki2 AS (SELECT * FROM wikipedia)
      (
        WITH wiki3 AS (SELECT * FROM wiki1), wiki4 AS (SELECT * FROM wiki2)
        (
          SELECT * FROM wiki2 LIMIT 100
        )
      )
      LIMIT 90
    `;

    const query = SqlExpression.parse(sql) as SqlWithQuery;

    expect(String(query.flattenWith()).trim()).toEqual(sane`
      REPLACE INTO dst OVERWRITE ALL
      WITH wiki1 AS (SELECT * FROM wikipedia),
      wiki2 AS (SELECT * FROM wikipedia),
      wiki3 AS (SELECT * FROM wiki1),
      wiki4 AS (SELECT * FROM wiki2)
      SELECT * FROM wiki2 LIMIT 90
    `);
  });

  it('matches snapshot', () => {
    const sql = `WITH wiki AS (SELECT * FROM wikipedia) (SELECT * FROM wiki)`;

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlWithQuery {
        "explainClause": undefined,
        "insertClause": undefined,
        "keywords": Object {},
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
        "query": SqlQuery {
          "clusteredByClause": undefined,
          "decorator": undefined,
          "explainClause": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTableRef {
                  "keywords": Object {},
                  "namespaceRefName": undefined,
                  "spacing": Object {},
                  "tableRefName": RefName {
                    "name": "wiki",
                    "quotes": false,
                  },
                  "type": "tableRef",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
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
                "namespaceRefName": undefined,
                "spacing": Object {},
                "tableRefName": undefined,
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
                "query": SqlQuery {
                  "clusteredByClause": undefined,
                  "decorator": undefined,
                  "explainClause": undefined,
                  "fromClause": SqlFromClause {
                    "expressions": SeparatedArray {
                      "separators": Array [],
                      "values": Array [
                        SqlTableRef {
                          "keywords": Object {},
                          "namespaceRefName": undefined,
                          "spacing": Object {},
                          "tableRefName": RefName {
                            "name": "wikipedia",
                            "quotes": false,
                          },
                          "type": "tableRef",
                        },
                      ],
                    },
                    "joinParts": undefined,
                    "keywords": Object {
                      "from": "FROM",
                    },
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
                        "namespaceRefName": undefined,
                        "spacing": Object {},
                        "tableRefName": undefined,
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
