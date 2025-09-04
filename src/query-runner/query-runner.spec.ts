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

  const queryRunner = new QueryRunner({
    // eslint-disable-next-line @typescript-eslint/require-await
    executor: async ({ payload, isSql }) => {
      const firstParameterValue: any =
        payload.parameters && payload.parameters.length ? payload.parameters[0].value : undefined;

      if (isSql) {
        return {
          data: [
            ['channel', 'Count'],
            payload.typesHeader ? ['STRING', 'LONG'] : undefined,
            payload.sqlTypesHeader ? ['VARCHAR', 'BIGINT'] : undefined,
            ['#en.wikipedia', 6650],
            ['#sh.wikipedia', 3969],
          ].filter(Boolean),
          headers: {
            'x-druid-sql-query-id': firstParameterValue || 'sql-query-id-yyy',
            'x-druid-sql-header-included': 'yes',
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
    },
  });

  it('works with rune query', async () => {
    const queryResult = await queryRunner.runQuery({
      query: {
        queryType: 'topN',
        dataSource: 'my_data',
      },
      extraQueryContext: {
        lol: 'here',
      },
    });

    expect(queryResult).toMatchInlineSnapshot(`
      QueryResult {
        "header": Array [
          Column {
            "name": "a1",
            "nativeType": undefined,
            "sqlType": undefined,
          },
          Column {
            "name": "p0",
            "nativeType": undefined,
            "sqlType": undefined,
          },
          Column {
            "name": "a2",
            "nativeType": undefined,
            "sqlType": undefined,
          },
          Column {
            "name": "d0",
            "nativeType": undefined,
            "sqlType": undefined,
          },
          Column {
            "name": "a0",
            "nativeType": undefined,
            "sqlType": undefined,
          },
        ],
        "query": Object {
          "context": Object {
            "lol": "here",
          },
          "dataSource": "my_data",
          "queryType": "topN",
        },
        "queryDuration": 1,
        "queryId": "query-id-xxx",
        "resultContext": undefined,
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
        context: {
          lol: 'hello world',
          priority: 2,
        },
      },
      defaultQueryContext: {
        priority: 1,
        moon: 'beam',
      },
      extraQueryContext: {
        lol: 'here',
      },
    });

    expect(queryResult).toMatchInlineSnapshot(`
      QueryResult {
        "header": Array [
          Column {
            "name": "channel",
            "nativeType": undefined,
            "sqlType": undefined,
          },
          Column {
            "name": "Count",
            "nativeType": undefined,
            "sqlType": undefined,
          },
        ],
        "query": Object {
          "context": Object {
            "lol": "here",
            "moon": "beam",
            "priority": 2,
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
        "resultContext": undefined,
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
          "groupByClause": SqlGroupByClause {
            "decorator": undefined,
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlLiteral {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "stringValue": "1",
                  "type": "literal",
                  "value": 1,
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
          "havingClause": undefined,
          "insertClause": undefined,
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
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "2",
                    "type": "literal",
                    "value": 2,
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "orderBy": "ORDER BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postOrderBy": " ",
            },
            "type": "orderByClause",
          },
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [
              Separator {
                "left": "",
                "right": " ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "channel",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              SqlAlias {
                "alias": RefName {
                  "name": "Count",
                  "quotes": true,
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
          "spacing": Object {
            "postSelect": "
        ",
            "preFromClause": "
      ",
            "preGroupByClause": "
      ",
            "preOrderByClause": "
      ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
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
          Column {
            "name": "channel",
            "nativeType": "STRING",
            "sqlType": "VARCHAR",
          },
          Column {
            "name": "Count",
            "nativeType": "LONG",
            "sqlType": "BIGINT",
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
          "sqlTypesHeader": true,
          "typesHeader": true,
        },
        "queryDuration": 1,
        "queryId": undefined,
        "resultContext": undefined,
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
          "groupByClause": SqlGroupByClause {
            "decorator": undefined,
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlLiteral {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "stringValue": "1",
                  "type": "literal",
                  "value": 1,
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
          "havingClause": undefined,
          "insertClause": undefined,
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
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "2",
                    "type": "literal",
                    "value": 2,
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "orderBy": "ORDER BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postOrderBy": " ",
            },
            "type": "orderByClause",
          },
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [
              Separator {
                "left": "",
                "right": " ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "channel",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              SqlAlias {
                "alias": RefName {
                  "name": "Count",
                  "quotes": true,
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
          "spacing": Object {
            "postSelect": "
        ",
            "preFromClause": "
      ",
            "preGroupByClause": "
      ",
            "preOrderByClause": "
      ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
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
      defaultQueryContext: {
        priority: 1,
      },
      extraQueryContext: {
        lol: 'here',
      },
    });
    expect(queryResult).toMatchInlineSnapshot(`
      QueryResult {
        "header": Array [
          Column {
            "name": "channel",
            "nativeType": "STRING",
            "sqlType": "VARCHAR",
          },
          Column {
            "name": "Count",
            "nativeType": "LONG",
            "sqlType": "BIGINT",
          },
        ],
        "query": Object {
          "context": Object {
            "lol": "here",
            "priority": 1,
          },
          "header": true,
          "query": "SELECT
        channel, COUNT(*) AS \\"Count\\"
      FROM wikipedia
      GROUP BY 1
      ORDER BY 2 DESC",
          "resultFormat": "array",
          "sqlTypesHeader": true,
          "typesHeader": true,
        },
        "queryDuration": 1,
        "queryId": undefined,
        "resultContext": undefined,
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
          "groupByClause": SqlGroupByClause {
            "decorator": undefined,
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlLiteral {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "stringValue": "1",
                  "type": "literal",
                  "value": 1,
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
          "havingClause": undefined,
          "insertClause": undefined,
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
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "2",
                    "type": "literal",
                    "value": 2,
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "orderBy": "ORDER BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postOrderBy": " ",
            },
            "type": "orderByClause",
          },
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [
              Separator {
                "left": "",
                "right": " ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "channel",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              SqlAlias {
                "alias": RefName {
                  "name": "Count",
                  "quotes": true,
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
          "spacing": Object {
            "postSelect": "
        ",
            "preFromClause": "
      ",
            "preGroupByClause": "
      ",
            "preOrderByClause": "
      ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        },
        "sqlQueryId": "sql-query-id-yyy",
      }
    `);
  });

  it('works with query parameters', async () => {
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
