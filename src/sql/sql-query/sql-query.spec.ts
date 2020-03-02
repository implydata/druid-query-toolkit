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

import { sqlParserFactory } from '../../index';
import { FUNCTIONS } from '../../test-utils';

const parser = sqlParserFactory(FUNCTIONS);

describe('simple expressions', () => {
  it('Simple select', () => {
    const sql = `Select * from table`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"Select * from table"`);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "*",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select in brackets', () => {
    const sql = `(Select * from table)`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"(Select * from table)"`);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "*",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select, columns with aliases', () => {
    const sql = `Select Sum(*) As sums from table`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"Select Sum(*) As sums from table"`);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlAliasRef {
            "alias": SqlRef {
              "innerSpacing": Object {},
              "name": "sums",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "asKeyword": "As",
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
              "decorator": undefined,
              "filterKeyword": undefined,
              "functionName": "Sum",
              "innerSpacing": Object {
                "postDecorator": "",
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
            "innerSpacing": Object {
              "postAs": " ",
            },
            "postColumn": " ",
            "type": "alias-ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select, columns with aliases and case expressions', () => {
    const sql = `SELECT
    datasource,
    SUM("size") AS total_size,
    CASE WHEN SUM("size") = 0 THEN 0 ELSE SUM("size")  END AS avg_size,
    CASE WHEN SUM(num_rows) = 0 THEN 0 ELSE SUM("num_rows") END AS avg_num_rows,
    COUNT(*) AS num_segments
FROM sys.segments`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(`
      "SELECT
          datasource,
          SUM(\\"size\\") AS total_size,
          CASE WHEN SUM(\\"size\\") = 0 THEN 0 ELSE SUM(\\"size\\")  END AS avg_size,
          CASE WHEN SUM(num_rows) = 0 THEN 0 ELSE SUM(\\"num_rows\\") END AS avg_num_rows,
          COUNT(*) AS num_segments
      FROM sys.segments"
    `);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "FROM",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": "
          ",
          "postSelectDecorator": "",
          "postSelectValues": "
      ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectSeparators": Array [
          Separator {
            "left": "",
            "right": "
          ",
            "separator": ",",
          },
          Separator {
            "left": "",
            "right": "
          ",
            "separator": ",",
          },
          Separator {
            "left": "",
            "right": "
          ",
            "separator": ",",
          },
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
            "name": "datasource",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "innerSpacing": Object {},
              "name": "total_size",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "asKeyword": "AS",
            "column": SqlFunction {
              "arguments": Array [
                SqlRef {
                  "innerSpacing": Object {},
                  "name": "size",
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "\\"",
                  "type": "ref",
                },
              ],
              "decorator": undefined,
              "filterKeyword": undefined,
              "functionName": "SUM",
              "innerSpacing": Object {
                "postDecorator": "",
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
            "innerSpacing": Object {
              "postAs": " ",
            },
            "postColumn": " ",
            "type": "alias-ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "innerSpacing": Object {},
              "name": "avg_size",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "asKeyword": "AS",
            "column": SqlCaseSearched {
              "caseKeyword": "CASE",
              "elseExpression": SqlFunction {
                "arguments": Array [
                  SqlRef {
                    "innerSpacing": Object {},
                    "name": "size",
                    "namespace": undefined,
                    "namespaceQuotes": undefined,
                    "quotes": "\\"",
                    "type": "ref",
                  },
                ],
                "decorator": undefined,
                "filterKeyword": undefined,
                "functionName": "SUM",
                "innerSpacing": Object {
                  "postDecorator": "",
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
              "elseKeyword": "ELSE",
              "endKeyword": "END",
              "innerSpacing": Object {
                "postCase": " ",
                "postElse": " ",
                "postWhenThen": " ",
                "preEnd": "  ",
              },
              "postWhenThenUnitSpaces": Array [],
              "type": "caseSearched",
              "whenThenUnits": Array [
                Object {
                  "postThenSpace": " ",
                  "postWhenExpressionSpace": " ",
                  "postWhenSpace": " ",
                  "thenExpression": SqlLiteral {
                    "innerSpacing": Object {},
                    "stringValue": "0",
                    "type": "literal",
                    "value": 0,
                  },
                  "thenKeyword": "THEN",
                  "whenExpression": SqlMulti {
                    "arguments": Array [
                      SqlFunction {
                        "arguments": Array [
                          SqlRef {
                            "innerSpacing": Object {},
                            "name": "size",
                            "namespace": undefined,
                            "namespaceQuotes": undefined,
                            "quotes": "\\"",
                            "type": "ref",
                          },
                        ],
                        "decorator": undefined,
                        "filterKeyword": undefined,
                        "functionName": "SUM",
                        "innerSpacing": Object {
                          "postDecorator": "",
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
                      SqlLiteral {
                        "innerSpacing": Object {},
                        "stringValue": "0",
                        "type": "literal",
                        "value": 0,
                      },
                    ],
                    "expressionType": "Comparison",
                    "innerSpacing": Object {},
                    "separators": Array [
                      Separator {
                        "left": " ",
                        "right": " ",
                        "separator": "=",
                      },
                    ],
                    "type": "multi",
                  },
                  "whenKeyword": "WHEN",
                },
              ],
            },
            "innerSpacing": Object {
              "postAs": " ",
            },
            "postColumn": " ",
            "type": "alias-ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "innerSpacing": Object {},
              "name": "avg_num_rows",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "asKeyword": "AS",
            "column": SqlCaseSearched {
              "caseKeyword": "CASE",
              "elseExpression": SqlFunction {
                "arguments": Array [
                  SqlRef {
                    "innerSpacing": Object {},
                    "name": "num_rows",
                    "namespace": undefined,
                    "namespaceQuotes": undefined,
                    "quotes": "\\"",
                    "type": "ref",
                  },
                ],
                "decorator": undefined,
                "filterKeyword": undefined,
                "functionName": "SUM",
                "innerSpacing": Object {
                  "postDecorator": "",
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
              "elseKeyword": "ELSE",
              "endKeyword": "END",
              "innerSpacing": Object {
                "postCase": " ",
                "postElse": " ",
                "postWhenThen": " ",
                "preEnd": " ",
              },
              "postWhenThenUnitSpaces": Array [],
              "type": "caseSearched",
              "whenThenUnits": Array [
                Object {
                  "postThenSpace": " ",
                  "postWhenExpressionSpace": " ",
                  "postWhenSpace": " ",
                  "thenExpression": SqlLiteral {
                    "innerSpacing": Object {},
                    "stringValue": "0",
                    "type": "literal",
                    "value": 0,
                  },
                  "thenKeyword": "THEN",
                  "whenExpression": SqlMulti {
                    "arguments": Array [
                      SqlFunction {
                        "arguments": Array [
                          SqlRef {
                            "innerSpacing": Object {},
                            "name": "num_rows",
                            "namespace": undefined,
                            "namespaceQuotes": undefined,
                            "quotes": "",
                            "type": "ref",
                          },
                        ],
                        "decorator": undefined,
                        "filterKeyword": undefined,
                        "functionName": "SUM",
                        "innerSpacing": Object {
                          "postDecorator": "",
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
                      SqlLiteral {
                        "innerSpacing": Object {},
                        "stringValue": "0",
                        "type": "literal",
                        "value": 0,
                      },
                    ],
                    "expressionType": "Comparison",
                    "innerSpacing": Object {},
                    "separators": Array [
                      Separator {
                        "left": " ",
                        "right": " ",
                        "separator": "=",
                      },
                    ],
                    "type": "multi",
                  },
                  "whenKeyword": "WHEN",
                },
              ],
            },
            "innerSpacing": Object {
              "postAs": " ",
            },
            "postColumn": " ",
            "type": "alias-ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "innerSpacing": Object {},
              "name": "num_segments",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
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
              "decorator": undefined,
              "filterKeyword": undefined,
              "functionName": "COUNT",
              "innerSpacing": Object {
                "postDecorator": "",
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
            "innerSpacing": Object {
              "postAs": " ",
            },
            "postColumn": " ",
            "type": "alias-ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "segments",
            "namespace": "sys",
            "namespaceQuotes": "",
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select, columns with many columns and aliases', () => {
    const sql = `SELECT
    datasource,
    SUM("size") AS total_size,
    COUNT(*) AS num_segments
FROM sys.segments`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(`
      "SELECT
          datasource,
          SUM(\\"size\\") AS total_size,
          COUNT(*) AS num_segments
      FROM sys.segments"
    `);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "FROM",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": "
          ",
          "postSelectDecorator": "",
          "postSelectValues": "
      ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectSeparators": Array [
          Separator {
            "left": "",
            "right": "
          ",
            "separator": ",",
          },
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
            "name": "datasource",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "innerSpacing": Object {},
              "name": "total_size",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "asKeyword": "AS",
            "column": SqlFunction {
              "arguments": Array [
                SqlRef {
                  "innerSpacing": Object {},
                  "name": "size",
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "\\"",
                  "type": "ref",
                },
              ],
              "decorator": undefined,
              "filterKeyword": undefined,
              "functionName": "SUM",
              "innerSpacing": Object {
                "postDecorator": "",
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
            "innerSpacing": Object {
              "postAs": " ",
            },
            "postColumn": " ",
            "type": "alias-ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "innerSpacing": Object {},
              "name": "num_segments",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
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
              "decorator": undefined,
              "filterKeyword": undefined,
              "functionName": "COUNT",
              "innerSpacing": Object {
                "postDecorator": "",
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
            "innerSpacing": Object {
              "postAs": " ",
            },
            "postColumn": " ",
            "type": "alias-ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "segments",
            "namespace": "sys",
            "namespaceQuotes": "",
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select with Explain', () => {
    const sql = `Explain plan for Select * from table`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"Explain plan for Select * from table"`);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "Explain plan for",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": " ",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "*",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select with With', () => {
    const sql = `WITH dept_count AS (
  SELECT deptno
  FROM   emp)
    Select * from table`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(`
      "WITH dept_count AS (
        SELECT deptno
        FROM   emp)
          Select * from table"
    `);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": " ",
          "postWithQuery": "
          ",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "*",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": "WITH",
        "withSeparators": Array [],
        "withUnits": Array [
          Object {
            "AsKeyword": "AS",
            "postAs": " ",
            "postLeftParen": "",
            "postWithColumns": "",
            "postWithTable": " ",
            "preRightParen": "",
            "withColumns": undefined,
            "withQuery": SqlQuery {
              "explainKeyword": "",
              "fromKeyword": "FROM",
              "groupByExpression": undefined,
              "groupByExpressionSeparators": undefined,
              "groupByKeyword": undefined,
              "havingExpression": undefined,
              "havingKeyword": undefined,
              "innerSpacing": Object {
                "postExplain": "",
                "postFrom": "   ",
                "postLimitKeyword": "",
                "postQuery": "",
                "postSelect": " ",
                "postSelectDecorator": "",
                "postSelectValues": "
        ",
                "postUnionKeyword": "",
                "postWith": "",
                "postWithQuery": "",
                "preGroupByKeyword": "",
                "preHavingKeyword": "",
                "preLimitKeyword": "",
                "preQuery": "",
                "preUnionKeyword": "",
                "preWhereKeyword": "",
              },
              "limitKeyword": undefined,
              "limitValue": undefined,
              "orderByKeyword": undefined,
              "orderBySeparators": undefined,
              "orderByUnits": undefined,
              "parens": Array [
                Object {
                  "leftSpacing": "
        ",
                  "rightSpacing": "",
                },
              ],
              "selectDecorator": "",
              "selectKeyword": "SELECT",
              "selectSeparators": Array [],
              "selectValues": Array [
                SqlRef {
                  "innerSpacing": Object {},
                  "name": "deptno",
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "type": "ref",
                },
              ],
              "tableSeparators": Array [],
              "tables": Array [
                SqlRef {
                  "innerSpacing": Object {},
                  "name": "emp",
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "type": "ref",
                },
              ],
              "type": "query",
              "unionKeyword": undefined,
              "unionQuery": undefined,
              "whereExpression": undefined,
              "whereKeyword": undefined,
              "withKeyword": undefined,
              "withSeparators": undefined,
              "withUnits": undefined,
            },
            "withSeparators": undefined,
            "withTableName": SqlRef {
              "innerSpacing": Object {},
              "name": "dept_count",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
          },
        ],
      }
    `);
  });
});

describe('expressions with where clause', () => {
  it('Simple select with where', () => {
    const sql = `Select * from table where column > 1`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"Select * from table where column > 1"`);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWhereKeyword": " ",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": " ",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "*",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": SqlMulti {
          "arguments": Array [
            SqlRef {
              "innerSpacing": Object {},
              "name": "column",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
          ],
          "expressionType": "Comparison",
          "innerSpacing": Object {},
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": ">",
            },
          ],
          "type": "multi",
        },
        "whereKeyword": "where",
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select with equals', () => {
    const sql = `SELECT * FROM sys.supervisors WHERE healthy = 0`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(
      `"SELECT * FROM sys.supervisors WHERE healthy = 0"`,
    );

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "FROM",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWhereKeyword": " ",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": " ",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "*",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "supervisors",
            "namespace": "sys",
            "namespaceQuotes": "",
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": SqlMulti {
          "arguments": Array [
            SqlRef {
              "innerSpacing": Object {},
              "name": "healthy",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "stringValue": "0",
              "type": "literal",
              "value": 0,
            },
          ],
          "expressionType": "Comparison",
          "innerSpacing": Object {},
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "=",
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
  });

  it('Simple select with many', () => {
    const sql = `SELECT * FROM sys.supervisors WHERE healthy = 0 and column > 100 or otherColumn = 'value'`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(
      `"SELECT * FROM sys.supervisors WHERE healthy = 0 and column > 100 or otherColumn = 'value'"`,
    );

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "FROM",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWhereKeyword": " ",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": " ",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "*",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "supervisors",
            "namespace": "sys",
            "namespaceQuotes": "",
            "quotes": "",
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
                SqlMulti {
                  "arguments": Array [
                    SqlRef {
                      "innerSpacing": Object {},
                      "name": "healthy",
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "",
                      "type": "ref",
                    },
                    SqlLiteral {
                      "innerSpacing": Object {},
                      "stringValue": "0",
                      "type": "literal",
                      "value": 0,
                    },
                  ],
                  "expressionType": "Comparison",
                  "innerSpacing": Object {},
                  "separators": Array [
                    Separator {
                      "left": " ",
                      "right": " ",
                      "separator": "=",
                    },
                  ],
                  "type": "multi",
                },
                SqlMulti {
                  "arguments": Array [
                    SqlRef {
                      "innerSpacing": Object {},
                      "name": "column",
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "",
                      "type": "ref",
                    },
                    SqlLiteral {
                      "innerSpacing": Object {},
                      "stringValue": "100",
                      "type": "literal",
                      "value": 100,
                    },
                  ],
                  "expressionType": "Comparison",
                  "innerSpacing": Object {},
                  "separators": Array [
                    Separator {
                      "left": " ",
                      "right": " ",
                      "separator": ">",
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
                  "separator": "and",
                },
              ],
              "type": "multi",
            },
            SqlMulti {
              "arguments": Array [
                SqlRef {
                  "innerSpacing": Object {},
                  "name": "otherColumn",
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "type": "ref",
                },
                SqlLiteral {
                  "innerSpacing": Object {},
                  "stringValue": "value",
                  "type": "literal",
                  "value": "value",
                },
              ],
              "expressionType": "Comparison",
              "innerSpacing": Object {},
              "separators": Array [
                Separator {
                  "left": " ",
                  "right": " ",
                  "separator": "=",
                },
              ],
              "type": "multi",
            },
          ],
          "expressionType": "OR",
          "innerSpacing": Object {},
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "or",
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
  });
});

describe('expressions with group by clause', () => {
  it('Simple select with group by ', () => {
    const sql = `Select * from table group by column`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"Select * from table group by column"`);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "column",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "groupByExpressionSeparators": Array [],
        "groupByKeyword": "group by",
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postGroupByKeyword": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": " ",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "*",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select with group by ', () => {
    const sql = `Select * from table group by column`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"Select * from table group by column"`);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "column",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "groupByExpressionSeparators": Array [],
        "groupByKeyword": "group by",
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postGroupByKeyword": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": " ",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "*",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select with multiple group by clauses in brackets', () => {
    const sql = `(Select * from table group by column, columnTwo)`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(
      `"(Select * from table group by column, columnTwo)"`,
    );

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "column",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          SqlRef {
            "innerSpacing": Object {},
            "name": "columnTwo",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "groupByExpressionSeparators": Array [
          Separator {
            "left": "",
            "right": " ",
            "separator": ",",
          },
        ],
        "groupByKeyword": "group by",
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postGroupByKeyword": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": " ",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "*",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });
});

describe('expressions with having clause', () => {
  it('Simple select with where', () => {
    const sql = `Select * from table having column > 1`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"Select * from table having column > 1"`);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": SqlMulti {
          "arguments": Array [
            SqlRef {
              "innerSpacing": Object {},
              "name": "column",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
          ],
          "expressionType": "Comparison",
          "innerSpacing": Object {},
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": ">",
            },
          ],
          "type": "multi",
        },
        "havingKeyword": "having",
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postHavingKeyword": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": " ",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "*",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select with equals', () => {
    const sql = `SELECT * FROM sys.supervisors HAVING healthy = 0`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(
      `"SELECT * FROM sys.supervisors HAVING healthy = 0"`,
    );

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "FROM",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": SqlMulti {
          "arguments": Array [
            SqlRef {
              "innerSpacing": Object {},
              "name": "healthy",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "stringValue": "0",
              "type": "literal",
              "value": 0,
            },
          ],
          "expressionType": "Comparison",
          "innerSpacing": Object {},
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "=",
            },
          ],
          "type": "multi",
        },
        "havingKeyword": "HAVING",
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postHavingKeyword": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": " ",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "*",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "supervisors",
            "namespace": "sys",
            "namespaceQuotes": "",
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select with many', () => {
    const sql = `SELECT * FROM sys.supervisors HAVING healthy = 0 and column > 100 or otherColumn = 'value'`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(
      `"SELECT * FROM sys.supervisors HAVING healthy = 0 and column > 100 or otherColumn = 'value'"`,
    );

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "FROM",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": SqlMulti {
          "arguments": Array [
            SqlMulti {
              "arguments": Array [
                SqlMulti {
                  "arguments": Array [
                    SqlRef {
                      "innerSpacing": Object {},
                      "name": "healthy",
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "",
                      "type": "ref",
                    },
                    SqlLiteral {
                      "innerSpacing": Object {},
                      "stringValue": "0",
                      "type": "literal",
                      "value": 0,
                    },
                  ],
                  "expressionType": "Comparison",
                  "innerSpacing": Object {},
                  "separators": Array [
                    Separator {
                      "left": " ",
                      "right": " ",
                      "separator": "=",
                    },
                  ],
                  "type": "multi",
                },
                SqlMulti {
                  "arguments": Array [
                    SqlRef {
                      "innerSpacing": Object {},
                      "name": "column",
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "",
                      "type": "ref",
                    },
                    SqlLiteral {
                      "innerSpacing": Object {},
                      "stringValue": "100",
                      "type": "literal",
                      "value": 100,
                    },
                  ],
                  "expressionType": "Comparison",
                  "innerSpacing": Object {},
                  "separators": Array [
                    Separator {
                      "left": " ",
                      "right": " ",
                      "separator": ">",
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
                  "separator": "and",
                },
              ],
              "type": "multi",
            },
            SqlMulti {
              "arguments": Array [
                SqlRef {
                  "innerSpacing": Object {},
                  "name": "otherColumn",
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "type": "ref",
                },
                SqlLiteral {
                  "innerSpacing": Object {},
                  "stringValue": "value",
                  "type": "literal",
                  "value": "value",
                },
              ],
              "expressionType": "Comparison",
              "innerSpacing": Object {},
              "separators": Array [
                Separator {
                  "left": " ",
                  "right": " ",
                  "separator": "=",
                },
              ],
              "type": "multi",
            },
          ],
          "expressionType": "OR",
          "innerSpacing": Object {},
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "or",
            },
          ],
          "type": "multi",
        },
        "havingKeyword": "HAVING",
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postHavingKeyword": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": " ",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "*",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "supervisors",
            "namespace": "sys",
            "namespaceQuotes": "",
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });
});

describe('expressions with order by clause', () => {
  it('Simple select with number order by', () => {
    const sql = `Select column from table order by 1`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"Select column from table order by 1"`);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preOrderByKeyword": " ",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "",
            "expression": SqlLiteral {
              "innerSpacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "postExpression": "",
          },
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "column",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select with ref order by', () => {
    const sql = `Select column from table order by column`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(
      `"Select column from table order by column"`,
    );

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preOrderByKeyword": " ",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "",
            "expression": SqlRef {
              "innerSpacing": Object {},
              "name": "column",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "postExpression": "",
          },
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "column",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select with number order by and direction', () => {
    const sql = `Select column from table order by 1 ASC`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(
      `"Select column from table order by 1 ASC"`,
    );

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preOrderByKeyword": " ",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "ASC",
            "expression": SqlLiteral {
              "innerSpacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "postExpression": " ",
          },
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "column",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select with ref order by and direction', () => {
    const sql = `Select column, columnTwo from table order by column DESC`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(
      `"Select column, columnTwo from table order by column DESC"`,
    );

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preOrderByKeyword": " ",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "DESC",
            "expression": SqlRef {
              "innerSpacing": Object {},
              "name": "column",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "postExpression": " ",
          },
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [
          Separator {
            "left": "",
            "right": " ",
            "separator": ",",
          },
        ],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "column",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          SqlRef {
            "innerSpacing": Object {},
            "name": "columnTwo",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select ordered on multiple columns', () => {
    const sql = `Select column from table order by 1 ASC, column`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(
      `"Select column from table order by 1 ASC, column"`,
    );

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preOrderByKeyword": " ",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [
          Separator {
            "left": "",
            "right": " ",
            "separator": ",",
          },
        ],
        "orderByUnits": Array [
          Object {
            "direction": "ASC",
            "expression": SqlLiteral {
              "innerSpacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "postExpression": " ",
          },
          Object {
            "direction": "",
            "expression": SqlRef {
              "innerSpacing": Object {},
              "name": "column",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "postExpression": "",
          },
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "column",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('Simple select ordered on multiple columns', () => {
    const sql = `Select column, columnTwo from table order by 1 ASC, column DESC`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(
      `"Select column, columnTwo from table order by 1 ASC, column DESC"`,
    );

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preOrderByKeyword": " ",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [
          Separator {
            "left": "",
            "right": " ",
            "separator": ",",
          },
        ],
        "orderByUnits": Array [
          Object {
            "direction": "ASC",
            "expression": SqlLiteral {
              "innerSpacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "postExpression": " ",
          },
          Object {
            "direction": "DESC",
            "expression": SqlRef {
              "innerSpacing": Object {},
              "name": "column",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "postExpression": " ",
          },
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [
          Separator {
            "left": "",
            "right": " ",
            "separator": ",",
          },
        ],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "column",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          SqlRef {
            "innerSpacing": Object {},
            "name": "columnTwo",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });
});

describe('expressions with limit clause', () => {
  it('Simple select with limit', () => {
    const sql = `Select * from table limit 1`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"Select * from table limit 1"`);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": " ",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": "limit",
        "limitValue": SqlLiteral {
          "innerSpacing": Object {},
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "*",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });
});

describe('expressions with union clause', () => {
  it('Simple select with union all ', () => {
    const sql = `Select * from table union all select * from otherTable`;
    expect(parser(sql).toString()).toMatchInlineSnapshot(
      `"Select * from table union all select * from otherTable"`,
    );

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": " ",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": " ",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "*",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": "union all",
        "unionQuery": SqlQuery {
          "explainKeyword": "",
          "fromKeyword": "from",
          "groupByExpression": undefined,
          "groupByExpressionSeparators": undefined,
          "groupByKeyword": undefined,
          "havingExpression": undefined,
          "havingKeyword": undefined,
          "innerSpacing": Object {
            "postExplain": "",
            "postFrom": " ",
            "postLimitKeyword": "",
            "postQuery": "",
            "postSelect": " ",
            "postSelectDecorator": "",
            "postSelectValues": " ",
            "postUnionKeyword": "",
            "postWith": "",
            "postWithQuery": "",
            "preGroupByKeyword": "",
            "preHavingKeyword": "",
            "preLimitKeyword": "",
            "preQuery": "",
            "preUnionKeyword": "",
            "preWhereKeyword": "",
          },
          "limitKeyword": undefined,
          "limitValue": undefined,
          "orderByKeyword": undefined,
          "orderBySeparators": undefined,
          "orderByUnits": undefined,
          "selectDecorator": "",
          "selectKeyword": "select",
          "selectSeparators": Array [],
          "selectValues": Array [
            SqlRef {
              "innerSpacing": Object {},
              "name": "*",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
          ],
          "tableSeparators": Array [],
          "tables": Array [
            SqlRef {
              "innerSpacing": Object {},
              "name": "otherTable",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
          ],
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereExpression": undefined,
          "whereKeyword": undefined,
          "withKeyword": undefined,
          "withSeparators": undefined,
          "withUnits": undefined,
        },
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });
});

describe('Queries with comments', () => {
  it('single comment', () => {
    const sql = `Select -- some comment 
  column from table`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`
      "Select -- some comment 
        column from table"
    `);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postLimitKeyword": "",
          "postQuery": "",
          "postSelect": " -- some comment 
        ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "column",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('two comments', () => {
    const sql = `Select --some comment
    --some comment
  column from table`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`
      "Select --some comment
          --some comment
        column from table"
    `);
  });

  it('comment on new line', () => {
    const sql = `Select
    -- some comment
  column from table`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`
      "Select
          -- some comment
        column from table"
    `);
  });

  it('comment containing hyphens', () => {
    const sql = `Select
    -- some--comment
  column from table`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`
      "Select
          -- some--comment
        column from table"
    `);
  });

  it('comment with no space', () => {
    const sql = `Select --some comment
  column from table`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`
      "Select --some comment
        column from table"
    `);
  });
});
