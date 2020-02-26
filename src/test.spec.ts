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

import { sqlParserFactory } from './parser/druidsql';
import { FUNCTIONS } from './test-utils';

const parser = sqlParserFactory(FUNCTIONS);

describe('test', () => {
  it('existing columns in group by', () => {
    const sql = `SELECT
    "channel",
    COUNT(*) AS "Count"
    FROM "wikipedia"
    WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND "channel" LIKE '%xxx%'
    GROUP BY 1
    ORDER BY "Count" DESC`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`
      "SELECT
          \\"channel\\",
          COUNT(*) AS \\"Count\\"
          FROM \\"wikipedia\\"
          WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND \\"channel\\" LIKE '%xxx%'
          GROUP BY 1
          ORDER BY \\"Count\\" DESC"
    `);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "FROM",
        "groupByExpression": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
        ],
        "groupByExpressionSeparators": Array [],
        "groupByKeyword": "GROUP BY",
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postGroupByKeyword": " ",
          "postLimitKeyword": "",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": "
          ",
          "postSelectDecorator": "",
          "postSelectValues": "
          ",
          "postUnionKeyword": "",
          "postWhereKeyword": " ",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "
          ",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preOrderByKeyword": "
          ",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "
          ",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "ORDER BY",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "DESC",
            "expression": SqlRef {
              "innerSpacing": Object {},
              "name": "Count",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "\\"",
              "type": "ref",
            },
            "postExpression": " ",
          },
        ],
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectSeparators": Array [
          Separator {
            "left": "",
            "right": "
          ",
            "separator": ",",
          },
        ],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "channel",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "\\"",
            "type": "ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "innerSpacing": Object {},
              "name": "Count",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "\\"",
              "type": "ref",
            },
            "asKeyword": "AS",
            "column": SqlFunction {
              "arguments": Array [
                SqlRef {
                  "innerSpacing": Object {},
                  "name": "*",
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "type": "ref",
                },
              ],
              "filterKeyword": undefined,
              "functionName": "COUNT",
              "innerSpacing": Object {
                "postFilterKeyword": "",
                "postFilterLeftParen": "",
                "postLeftParen": "",
                "postName": "",
                "postWhereKeyword": "",
                "preFilter": "",
                "preFilterRightParen": "",
                "preRightParen": "",
              },
              "separators": Array [],
              "type": "function",
              "whereExpression": undefined,
              "whereKeyword": undefined,
            },
            "innerSpacing": Object {},
            "postAs": " ",
            "postColumn": " ",
            "type": "alias-ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "wikipedia",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "\\"",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": SqlMulti {
          "arguments": Array [
            SqlMulti {
              "arguments": Array [
                SqlRef {
                  "innerSpacing": Object {},
                  "name": "__time",
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "\\"",
                  "type": "ref",
                },
                SqlMulti {
                  "arguments": Array [
                    SqlRef {
                      "innerSpacing": Object {},
                      "name": "CURRENT_TIMESTAMP",
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "",
                      "type": "ref",
                    },
                    SqlInterval {
                      "innerSpacing": Object {
                        "postIntervalKeyword": " ",
                        "postIntervalValue": " ",
                      },
                      "intervalKeyword": "INTERVAL",
                      "intervalValue": SqlLiteral {
                        "innerSpacing": Object {},
                        "stringValue": "1",
                        "type": "literal",
                        "value": "1",
                      },
                      "type": "interval",
                      "unitKeyword": "DAY",
                    },
                  ],
                  "expressionType": "Additive",
                  "innerSpacing": Object {},
                  "separators": Array [
                    Separator {
                      "left": " ",
                      "right": " ",
                      "separator": "-",
                    },
                  ],
                  "type": "multi",
                },
              ],
              "expressionType": "Comparison",
              "innerSpacing": Object {},
              "separators": Array [
                Separator {
                  "left": " ",
                  "right": " ",
                  "separator": ">=",
                },
              ],
              "type": "multi",
            },
            SqlMulti {
              "arguments": Array [
                SqlRef {
                  "innerSpacing": Object {},
                  "name": "channel",
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "\\"",
                  "type": "ref",
                },
                SqlLiteral {
                  "innerSpacing": Object {},
                  "stringValue": "%xxx%",
                  "type": "literal",
                  "value": "%xxx%",
                },
              ],
              "expressionType": "Comparison",
              "innerSpacing": Object {},
              "separators": Array [
                Separator {
                  "left": " ",
                  "right": " ",
                  "separator": "LIKE",
                },
              ],
              "type": "multi",
            },
          ],
          "expressionType": "AND",
          "innerSpacing": Object {},
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "AND",
            },
          ],
          "type": "multi",
        },
        "whereKeyword": "WHERE",
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);

    expect(parser(sql).toString()).toMatchInlineSnapshot(`
      "SELECT
          \\"channel\\",
          COUNT(*) AS \\"Count\\"
          FROM \\"wikipedia\\"
          WHERE \\"__time\\" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND \\"channel\\" LIKE '%xxx%'
          GROUP BY 1
          ORDER BY \\"Count\\" DESC"
    `);
    // expect(parser(sql)).toMatchInlineSnapshot(`
    //   SqlMulti {
    //     "arguments": Array [
    //       SqlRef {
    //         "innerSpacing": Object {},
    //         "name": "A",
    //         "namespace": undefined,
    //         "namespaceQuotes": undefined,
    //         "quotes": "",
    //         "type": "ref",
    //       },
    //       SqlRef {
    //         "innerSpacing": Object {},
    //         "name": "B",
    //         "namespace": undefined,
    //         "namespaceQuotes": undefined,
    //         "quotes": "",
    //         "type": "ref",
    //       },
    //     ],
    //     "expressionType": "OR",
    //     "innerSpacing": Object {},
    //     "separators": Array [
    //       Separator {
    //         "left": " ",
    //         "right": " ",
    //         "separator": "or",
    //       },
    //     ],
    //     "type": "multi",
    //   }
    // `);
  });
});
