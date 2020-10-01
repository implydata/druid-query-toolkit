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

  const queryRunner = new QueryRunner(async (payload, isSql) => {
    const firstParameterValue: any =
      payload.parameters && payload.parameters.length ? payload.parameters[0].value : undefined;

    if (isSql) {
      return {
        data: [['channel', 'Count'], ['#en.wikipedia', 6650], ['#sh.wikipedia', 3969]],
        headers: {
          'x-druid-sql-query-id': firstParameterValue || 'sql-query-id-yyy',
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
    const queryResult = await queryRunner.runQuery({
      query: {
        type: 'topN',
      },
      extraQueryContext: {
        lol: 'here',
      },
    });

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
    const queryResult = await queryRunner.runQuery({
      query: {
        query:
          'SELECT\n  channel, COUNT(*) AS "Count"\nFROM wikipedia\nGROUP BY 1\nORDER BY 2 DESC',
        resultFormat: 'array',
        header: true,
      },
      extraQueryContext: {
        lol: 'here',
      },
    });

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
          "decorator": undefined,
          "explainPlanFor": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "as": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "wikipedia",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "keywords": Object {},
                  "spacing": Object {},
                  "type": "alias",
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
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlLiteral {
                  "keywords": Object {},
                  "spacing": Object {},
                  "stringValue": "1",
                  "type": "literal",
                  "value": 1,
                },
              ],
            },
            "keywords": Object {
              "by": "BY",
              "group": "GROUP",
            },
            "spacing": Object {
              "postBy": " ",
              "postGroup": " ",
            },
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "keywords": Object {
            "select": "SELECT",
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
                    "keywords": Object {},
                    "spacing": Object {},
                    "stringValue": "2",
                    "type": "literal",
                    "value": 2,
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "by": "BY",
              "order": "ORDER",
            },
            "spacing": Object {
              "postBy": " ",
              "postOrder": " ",
            },
            "type": "orderByClause",
          },
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
                "as": undefined,
                "expression": SqlRef {
                  "column": "channel",
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "keywords": Object {},
                "spacing": Object {},
                "type": "alias",
              },
              SqlAlias {
                "alias": SqlRef {
                  "column": "Count",
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": true,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "as": true,
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlRef {
                        "column": "*",
                        "keywords": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": false,
                        "quotes": false,
                        "spacing": Object {},
                        "table": undefined,
                        "tableQuotes": false,
                        "type": "ref",
                      },
                    ],
                  },
                  "decorator": undefined,
                  "functionName": "COUNT",
                  "keywords": Object {
                    "functionName": "COUNT",
                  },
                  "spacing": Object {
                    "postArguments": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                },
                "keywords": Object {
                  "as": "AS",
                },
                "spacing": Object {
                  "preAlias": " ",
                  "preAs": " ",
                },
                "type": "alias",
              },
            ],
          },
          "spacing": Object {
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
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withParts": undefined,
        },
        "sqlQueryId": "sql-query-id-yyy",
      }
    `);
  });

  it('works with unwraped SQL query', async () => {
    const queryResult = await queryRunner.runQuery({
      query: 'SELECT\n  channel, COUNT(*) AS "Count"\nFROM wikipedia\nGROUP BY 1\nORDER BY 2 DESC',
      extraQueryContext: {
        lol: 'here',
      },
    });

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
          "decorator": undefined,
          "explainPlanFor": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "as": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "wikipedia",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "keywords": Object {},
                  "spacing": Object {},
                  "type": "alias",
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
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlLiteral {
                  "keywords": Object {},
                  "spacing": Object {},
                  "stringValue": "1",
                  "type": "literal",
                  "value": 1,
                },
              ],
            },
            "keywords": Object {
              "by": "BY",
              "group": "GROUP",
            },
            "spacing": Object {
              "postBy": " ",
              "postGroup": " ",
            },
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "keywords": Object {
            "select": "SELECT",
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
                    "keywords": Object {},
                    "spacing": Object {},
                    "stringValue": "2",
                    "type": "literal",
                    "value": 2,
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "by": "BY",
              "order": "ORDER",
            },
            "spacing": Object {
              "postBy": " ",
              "postOrder": " ",
            },
            "type": "orderByClause",
          },
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
                "as": undefined,
                "expression": SqlRef {
                  "column": "channel",
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "keywords": Object {},
                "spacing": Object {},
                "type": "alias",
              },
              SqlAlias {
                "alias": SqlRef {
                  "column": "Count",
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": true,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "as": true,
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlRef {
                        "column": "*",
                        "keywords": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": false,
                        "quotes": false,
                        "spacing": Object {},
                        "table": undefined,
                        "tableQuotes": false,
                        "type": "ref",
                      },
                    ],
                  },
                  "decorator": undefined,
                  "functionName": "COUNT",
                  "keywords": Object {
                    "functionName": "COUNT",
                  },
                  "spacing": Object {
                    "postArguments": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                },
                "keywords": Object {
                  "as": "AS",
                },
                "spacing": Object {
                  "preAlias": " ",
                  "preAs": " ",
                },
                "type": "alias",
              },
            ],
          },
          "spacing": Object {
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
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withParts": undefined,
        },
        "sqlQueryId": "sql-query-id-yyy",
      }
    `);
  });

  it('works with a parsed SQL query', async () => {
    const queryResult = await queryRunner.runQuery({
      query: SqlQuery.parse(
        'SELECT\n  channel, COUNT(*) AS "Count"\nFROM wikipedia\nGROUP BY 1\nORDER BY 2 DESC',
      ),
      extraQueryContext: {
        lol: 'here',
      },
    });
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
          "decorator": undefined,
          "explainPlanFor": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "as": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "wikipedia",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "keywords": Object {},
                  "spacing": Object {},
                  "type": "alias",
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
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlLiteral {
                  "keywords": Object {},
                  "spacing": Object {},
                  "stringValue": "1",
                  "type": "literal",
                  "value": 1,
                },
              ],
            },
            "keywords": Object {
              "by": "BY",
              "group": "GROUP",
            },
            "spacing": Object {
              "postBy": " ",
              "postGroup": " ",
            },
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "keywords": Object {
            "select": "SELECT",
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
                    "keywords": Object {},
                    "spacing": Object {},
                    "stringValue": "2",
                    "type": "literal",
                    "value": 2,
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "by": "BY",
              "order": "ORDER",
            },
            "spacing": Object {
              "postBy": " ",
              "postOrder": " ",
            },
            "type": "orderByClause",
          },
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
                "as": undefined,
                "expression": SqlRef {
                  "column": "channel",
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "keywords": Object {},
                "spacing": Object {},
                "type": "alias",
              },
              SqlAlias {
                "alias": SqlRef {
                  "column": "Count",
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": true,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "as": true,
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlRef {
                        "column": "*",
                        "keywords": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": false,
                        "quotes": false,
                        "spacing": Object {},
                        "table": undefined,
                        "tableQuotes": false,
                        "type": "ref",
                      },
                    ],
                  },
                  "decorator": undefined,
                  "functionName": "COUNT",
                  "keywords": Object {
                    "functionName": "COUNT",
                  },
                  "spacing": Object {
                    "postArguments": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                },
                "keywords": Object {
                  "as": "AS",
                },
                "spacing": Object {
                  "preAlias": " ",
                  "preAs": " ",
                },
                "type": "alias",
              },
            ],
          },
          "spacing": Object {
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
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withParts": undefined,
        },
        "sqlQueryId": "sql-query-id-yyy",
      }
    `);
  });

  it('works with a parsed SQL query', async () => {
    const queryResult = await queryRunner.runQuery({
      query: SqlQuery.parse(
        'SELECT\n  channel, COUNT(*) AS "Count"\nFROM wikipedia\nGROUP BY 1\nORDER BY 2 DESC',
      ),
      extraQueryContext: {
        lol: 'here',
      },
      queryParameters: [{ type: 'VARCHAR', value: 'test-param-value' }],
    });

    expect(queryResult.sqlQueryId).toEqual('test-param-value');
  });
});
