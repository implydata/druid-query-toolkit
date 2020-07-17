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

import { SqlQuery } from '..';

import { QueryRunner } from './query-runner';

describe('QueryRunner', () => {
  let n = 100000000;
  QueryRunner.now = () => ++n;

  const queryRunner = new QueryRunner(async (_payload, isSql) => {
    if (isSql) {
      return {
        data: [['channel', 'Count'], ['#en.wikipedia', 6650], ['#sh.wikipedia', 3969]],
        headers: {
          'x-druid-sql-query-id': 'sql-query-id-yyy',
        } as any,
      };
    } else {
      return {
        data: [
          {
            timestamp: '2016-06-27T00:00:00.000Z',
            result: [
              { a1: 2068620, p0: 1077329.0, a2: 86038, d0: '#en.wikipedia', a0: 6650 },
              { a1: 856, p0: 2422.0, a2: 3988, d0: '#sh.wikipedia', a0: 3969 },
            ],
          },
        ],
        headers: {
          'x-druid-query-id': 'query-id-xxx',
        } as any,
      };
    }
  });

  it('works with rune query', async () => {
    const queryResult = await queryRunner.runQuery(
      { type: 'topN' },
      {
        lol: 'here',
      },
    );
    expect(queryResult).toMatchInlineSnapshot(`
      QueryResult {
        "header": Array [
          Object {
            "name": "a1",
          },
          Object {
            "name": "p0",
          },
          Object {
            "name": "a2",
          },
          Object {
            "name": "d0",
          },
          Object {
            "name": "a0",
          },
        ],
        "query": Object {
          "context": Object {
            "lol": "here",
          },
          "type": "topN",
        },
        "queryDuration": 1,
        "queryId": "query-id-xxx",
        "rows": Array [
          Array [
            2068620,
            1077329,
            86038,
            "#en.wikipedia",
            6650,
          ],
          Array [
            856,
            2422,
            3988,
            "#sh.wikipedia",
            3969,
          ],
        ],
        "sqlQuery": undefined,
        "sqlQueryId": undefined,
      }
    `);
  });

  it('works with wrapped SQL query', async () => {
    const queryResult = await queryRunner.runQuery(
      {
        query:
          'SELECT\n  channel, COUNT(*) AS "Count"\nFROM wikipedia\nGROUP BY 1\nORDER BY 2 DESC',
        resultFormat: 'array',
        header: true,
      },
      {
        lol: 'here',
      },
    );
    expect(queryResult).toMatchInlineSnapshot(`
      QueryResult {
        "header": Array [
          Object {
            "name": "channel",
          },
          Object {
            "name": "Count",
          },
        ],
        "query": Object {
          "context": Object {
            "lol": "here",
          },
          "header": true,
          "query": "SELECT
        channel, COUNT(*) AS \\"Count\\"
      FROM wikipedia
      GROUP BY 1
      ORDER BY 2 DESC",
          "resultFormat": "array",
        },
        "queryDuration": 1,
        "queryId": undefined,
        "rows": Array [
          Array [
            "#en.wikipedia",
            6650,
          ],
          Array [
            "#sh.wikipedia",
            3969,
          ],
        ],
        "sqlQuery": SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "wikipedia",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "FROM",
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlLiteral {
                  "innerSpacing": Object {},
                  "keyword": undefined,
                  "stringValue": "1",
                  "type": "literal",
                  "value": 1,
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "GROUP BY",
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": "
        ",
            "preFrom": "
      ",
            "preGroupBy": "
      ",
            "preOrderBy": "
      ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": SqlOrderByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlOrderByExpression {
                  "direction": "DESC",
                  "expression": SqlLiteral {
                    "innerSpacing": Object {},
                    "keyword": undefined,
                    "stringValue": "2",
                    "type": "literal",
                    "value": 2,
                  },
                  "innerSpacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "ORDER BY",
            "type": "orderByClause",
          },
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [
              Separator {
                "left": "",
                "right": " ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "channel",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
              SqlAlias {
                "alias": SqlRef {
                  "column": "Count",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": true,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "asKeyword": "AS",
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlRef {
                        "column": "*",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": false,
                        "quotes": false,
                        "table": undefined,
                        "tableQuotes": false,
                        "type": "ref",
                      },
                    ],
                  },
                  "decorator": undefined,
                  "filterKeyword": undefined,
                  "functionName": "COUNT",
                  "innerSpacing": Object {
                    "postArguments": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                },
                "innerSpacing": Object {
                  "preAlias": " ",
                  "preAs": " ",
                },
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "SELECT",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        },
        "sqlQueryId": "sql-query-id-yyy",
      }
    `);
  });

  it('works with unwraped SQL query', async () => {
    const queryResult = await queryRunner.runQuery(
      'SELECT\n  channel, COUNT(*) AS "Count"\nFROM wikipedia\nGROUP BY 1\nORDER BY 2 DESC',
      {
        lol: 'here',
      },
    );
    expect(queryResult).toMatchInlineSnapshot(`
      QueryResult {
        "header": Array [
          Object {
            "name": "channel",
          },
          Object {
            "name": "Count",
          },
        ],
        "query": Object {
          "context": Object {
            "lol": "here",
          },
          "header": true,
          "query": "SELECT
        channel, COUNT(*) AS \\"Count\\"
      FROM wikipedia
      GROUP BY 1
      ORDER BY 2 DESC",
          "resultFormat": "array",
        },
        "queryDuration": 1,
        "queryId": undefined,
        "rows": Array [
          Array [
            "#en.wikipedia",
            6650,
          ],
          Array [
            "#sh.wikipedia",
            3969,
          ],
        ],
        "sqlQuery": SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "wikipedia",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "FROM",
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlLiteral {
                  "innerSpacing": Object {},
                  "keyword": undefined,
                  "stringValue": "1",
                  "type": "literal",
                  "value": 1,
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "GROUP BY",
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": "
        ",
            "preFrom": "
      ",
            "preGroupBy": "
      ",
            "preOrderBy": "
      ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": SqlOrderByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlOrderByExpression {
                  "direction": "DESC",
                  "expression": SqlLiteral {
                    "innerSpacing": Object {},
                    "keyword": undefined,
                    "stringValue": "2",
                    "type": "literal",
                    "value": 2,
                  },
                  "innerSpacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "ORDER BY",
            "type": "orderByClause",
          },
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [
              Separator {
                "left": "",
                "right": " ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "channel",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
              SqlAlias {
                "alias": SqlRef {
                  "column": "Count",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": true,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "asKeyword": "AS",
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlRef {
                        "column": "*",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": false,
                        "quotes": false,
                        "table": undefined,
                        "tableQuotes": false,
                        "type": "ref",
                      },
                    ],
                  },
                  "decorator": undefined,
                  "filterKeyword": undefined,
                  "functionName": "COUNT",
                  "innerSpacing": Object {
                    "postArguments": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                },
                "innerSpacing": Object {
                  "preAlias": " ",
                  "preAs": " ",
                },
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "SELECT",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        },
        "sqlQueryId": "sql-query-id-yyy",
      }
    `);
  });

  it('works with a parsed SQL query', async () => {
    const queryResult = await queryRunner.runQuery(
      SqlQuery.parse(
        'SELECT\n  channel, COUNT(*) AS "Count"\nFROM wikipedia\nGROUP BY 1\nORDER BY 2 DESC',
      ),
      {
        lol: 'here',
      },
    );
    expect(queryResult).toMatchInlineSnapshot(`
      QueryResult {
        "header": Array [
          Object {
            "name": "channel",
          },
          Object {
            "name": "Count",
          },
        ],
        "query": Object {
          "context": Object {
            "lol": "here",
          },
          "header": true,
          "query": "SELECT
        channel, COUNT(*) AS \\"Count\\"
      FROM wikipedia
      GROUP BY 1
      ORDER BY 2 DESC",
          "resultFormat": "array",
        },
        "queryDuration": 1,
        "queryId": undefined,
        "rows": Array [
          Array [
            "#en.wikipedia",
            6650,
          ],
          Array [
            "#sh.wikipedia",
            3969,
          ],
        ],
        "sqlQuery": SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "wikipedia",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "FROM",
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlLiteral {
                  "innerSpacing": Object {},
                  "keyword": undefined,
                  "stringValue": "1",
                  "type": "literal",
                  "value": 1,
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "GROUP BY",
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": "
        ",
            "preFrom": "
      ",
            "preGroupBy": "
      ",
            "preOrderBy": "
      ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": SqlOrderByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlOrderByExpression {
                  "direction": "DESC",
                  "expression": SqlLiteral {
                    "innerSpacing": Object {},
                    "keyword": undefined,
                    "stringValue": "2",
                    "type": "literal",
                    "value": 2,
                  },
                  "innerSpacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "ORDER BY",
            "type": "orderByClause",
          },
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [
              Separator {
                "left": "",
                "right": " ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "channel",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
              SqlAlias {
                "alias": SqlRef {
                  "column": "Count",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": true,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "asKeyword": "AS",
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlRef {
                        "column": "*",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": false,
                        "quotes": false,
                        "table": undefined,
                        "tableQuotes": false,
                        "type": "ref",
                      },
                    ],
                  },
                  "decorator": undefined,
                  "filterKeyword": undefined,
                  "functionName": "COUNT",
                  "innerSpacing": Object {
                    "postArguments": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                },
                "innerSpacing": Object {
                  "preAlias": " ",
                  "preAs": " ",
                },
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "SELECT",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        },
        "sqlQueryId": "sql-query-id-yyy",
      }
    `);
  });
});
