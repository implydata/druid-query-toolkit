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

import { parseSql } from '../../index';
import { backAndForth, sane } from '../../test-utils';

describe('SqlQuery', () => {
  it('Simple select with single column', () => {
    const sql = `Select notingham from table`;

    backAndForth(sql);
  });

  it('Simple expression', () => {
    const sql = `Select 3`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": undefined,
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "keyword": undefined,
            "stringValue": "3",
            "type": "literal",
            "value": 3,
          },
        ],
        "tableSeparators": undefined,
        "tables": undefined,
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

  it('Simple select', () => {
    const sql = `Select * from table`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlAliasRef {
            "alias": SqlRef {
              "column": "sums",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "asKeyword": "As",
            "column": SqlFunction {
              "arguments": Array [
                SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
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
              "postExpression": " ",
            },
            "type": "alias-ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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
    const sql = sane`
      SELECT
        datasource,
        SUM("size") AS total_size,
        CASE WHEN SUM("size") = 0 THEN 0 ELSE SUM("size")  END AS avg_size,
        CASE WHEN SUM(num_rows) = 0 THEN 0 ELSE SUM("num_rows") END AS avg_num_rows,
        COUNT(*) AS num_segments
      FROM sys.segments
    `;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "FROM",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postQuery": "",
          "postSelect": "
        ",
          "postSelectDecorator": "",
          "preFrom": "
      ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
          null,
          null,
          null,
          null,
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
            "column": "datasource",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "column": "total_size",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "asKeyword": "AS",
            "column": SqlFunction {
              "arguments": Array [
                SqlRef {
                  "column": "size",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "\\"",
                  "table": undefined,
                  "tableQuotes": undefined,
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
              "postExpression": " ",
            },
            "type": "alias-ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "column": "avg_size",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "asKeyword": "AS",
            "column": SqlCaseSearched {
              "caseKeyword": "CASE",
              "elseExpression": SqlFunction {
                "arguments": Array [
                  SqlRef {
                    "column": "size",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": undefined,
                    "quotes": "\\"",
                    "table": undefined,
                    "tableQuotes": undefined,
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
                    "keyword": undefined,
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
                            "column": "size",
                            "innerSpacing": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": undefined,
                            "quotes": "\\"",
                            "table": undefined,
                            "tableQuotes": undefined,
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
                        "keyword": undefined,
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
              "postExpression": " ",
            },
            "type": "alias-ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "column": "avg_num_rows",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "asKeyword": "AS",
            "column": SqlCaseSearched {
              "caseKeyword": "CASE",
              "elseExpression": SqlFunction {
                "arguments": Array [
                  SqlRef {
                    "column": "num_rows",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": undefined,
                    "quotes": "\\"",
                    "table": undefined,
                    "tableQuotes": undefined,
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
                    "keyword": undefined,
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
                            "column": "num_rows",
                            "innerSpacing": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": undefined,
                            "quotes": "",
                            "table": undefined,
                            "tableQuotes": undefined,
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
                        "keyword": undefined,
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
              "postExpression": " ",
            },
            "type": "alias-ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "column": "num_segments",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "asKeyword": "AS",
            "column": SqlFunction {
              "arguments": Array [
                SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
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
              "postExpression": " ",
            },
            "type": "alias-ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "postTableDot": "",
              "preTable": "",
              "preTableDot": "",
            },
            "namespace": "sys",
            "namespaceQuotes": "",
            "quotes": undefined,
            "table": "segments",
            "tableQuotes": "",
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
    const sql = sane`
      SELECT
        datasource,
        SUM("size") AS total_size,
        COUNT(*) AS num_segments
      FROM sys.segments
    `;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "FROM",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postQuery": "",
          "postSelect": "
        ",
          "postSelectDecorator": "",
          "preFrom": "
      ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
          null,
          null,
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
          Separator {
            "left": "",
            "right": "
        ",
            "separator": ",",
          },
        ],
        "selectValues": Array [
          SqlRef {
            "column": "datasource",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "column": "total_size",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "asKeyword": "AS",
            "column": SqlFunction {
              "arguments": Array [
                SqlRef {
                  "column": "size",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "\\"",
                  "table": undefined,
                  "tableQuotes": undefined,
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
              "postExpression": " ",
            },
            "type": "alias-ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "column": "num_segments",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "asKeyword": "AS",
            "column": SqlFunction {
              "arguments": Array [
                SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
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
              "postExpression": " ",
            },
            "type": "alias-ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "postTableDot": "",
              "preTable": "",
              "preTableDot": "",
            },
            "namespace": "sys",
            "namespaceQuotes": "",
            "quotes": undefined,
            "table": "segments",
            "tableQuotes": "",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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
    const sql = sane`
      WITH dept_count AS (
        SELECT deptno
        FROM   emp)
      Select * from table
    `;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postWith": " ",
          "postWithQuery": "
      ",
          "preFrom": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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
              "explainKeyword": undefined,
              "fromKeyword": "FROM",
              "groupByExpression": undefined,
              "groupByExpressionSeparators": undefined,
              "groupByKeyword": undefined,
              "havingExpression": undefined,
              "havingKeyword": undefined,
              "innerSpacing": Object {
                "postFrom": "   ",
                "postQuery": "",
                "postSelect": " ",
                "postSelectDecorator": "",
                "preFrom": "
        ",
                "preQuery": "",
              },
              "joinKeyword": undefined,
              "joinTable": undefined,
              "joinType": undefined,
              "limitKeyword": undefined,
              "limitValue": undefined,
              "onExpression": undefined,
              "onKeyword": undefined,
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
              "postQueryAnnotation": Array [],
              "selectAnnotations": Array [
                null,
              ],
              "selectDecorator": "",
              "selectKeyword": "SELECT",
              "selectSeparators": Array [],
              "selectValues": Array [
                SqlRef {
                  "column": "deptno",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
              ],
              "tableSeparators": Array [],
              "tables": Array [
                SqlRef {
                  "column": undefined,
                  "innerSpacing": Object {
                    "postTable": "",
                    "preTable": "",
                  },
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": undefined,
                  "table": "emp",
                  "tableQuotes": "",
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
              "column": "dept_count",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postWhereKeyword": " ",
          "preFrom": " ",
          "preQuery": "",
          "preWhereKeyword": " ",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": SqlMulti {
          "arguments": Array [
            SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "FROM",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postWhereKeyword": " ",
          "preFrom": " ",
          "preQuery": "",
          "preWhereKeyword": " ",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "postTableDot": "",
              "preTable": "",
              "preTableDot": "",
            },
            "namespace": "sys",
            "namespaceQuotes": "",
            "quotes": undefined,
            "table": "supervisors",
            "tableQuotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": SqlMulti {
          "arguments": Array [
            SqlRef {
              "column": "healthy",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "FROM",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postWhereKeyword": " ",
          "preFrom": " ",
          "preQuery": "",
          "preWhereKeyword": " ",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "postTableDot": "",
              "preTable": "",
              "preTableDot": "",
            },
            "namespace": "sys",
            "namespaceQuotes": "",
            "quotes": undefined,
            "table": "supervisors",
            "tableQuotes": "",
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
                      "column": "healthy",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "",
                      "table": undefined,
                      "tableQuotes": undefined,
                      "type": "ref",
                    },
                    SqlLiteral {
                      "innerSpacing": Object {},
                      "keyword": undefined,
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
                      "column": "column",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "",
                      "table": undefined,
                      "tableQuotes": undefined,
                      "type": "ref",
                    },
                    SqlLiteral {
                      "innerSpacing": Object {},
                      "keyword": undefined,
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
                  "column": "otherColumn",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                SqlLiteral {
                  "innerSpacing": Object {},
                  "keyword": undefined,
                  "stringValue": "'value'",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": Array [
          SqlRef {
            "column": "column",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "groupByExpressionSeparators": Array [],
        "groupByKeyword": "group by",
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postGroupByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preGroupByKeyword": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": Array [
          SqlRef {
            "column": "column",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "groupByExpressionSeparators": Array [],
        "groupByKeyword": "group by",
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postGroupByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preGroupByKeyword": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": Array [
          SqlRef {
            "column": "column",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "columnTwo",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
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
          "postFrom": " ",
          "postGroupByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preGroupByKeyword": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": SqlMulti {
          "arguments": Array [
            SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
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
          "postFrom": " ",
          "postHavingKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preHavingKeyword": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "FROM",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": SqlMulti {
          "arguments": Array [
            SqlRef {
              "column": "healthy",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
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
          "postFrom": " ",
          "postHavingKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preHavingKeyword": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "postTableDot": "",
              "preTable": "",
              "preTableDot": "",
            },
            "namespace": "sys",
            "namespaceQuotes": "",
            "quotes": undefined,
            "table": "supervisors",
            "tableQuotes": "",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
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
                      "column": "healthy",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "",
                      "table": undefined,
                      "tableQuotes": undefined,
                      "type": "ref",
                    },
                    SqlLiteral {
                      "innerSpacing": Object {},
                      "keyword": undefined,
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
                      "column": "column",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "",
                      "table": undefined,
                      "tableQuotes": undefined,
                      "type": "ref",
                    },
                    SqlLiteral {
                      "innerSpacing": Object {},
                      "keyword": undefined,
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
                  "column": "otherColumn",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                SqlLiteral {
                  "innerSpacing": Object {},
                  "keyword": undefined,
                  "stringValue": "'value'",
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
          "postFrom": " ",
          "postHavingKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preHavingKeyword": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "postTableDot": "",
              "preTable": "",
              "preTableDot": "",
            },
            "namespace": "sys",
            "namespaceQuotes": "",
            "quotes": undefined,
            "table": "supervisors",
            "tableQuotes": "",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preOrderByKeyword": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "",
            "expression": SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "postExpression": "",
          },
        ],
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "column",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preOrderByKeyword": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "",
            "expression": SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "postExpression": "",
          },
        ],
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "column",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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
    const sql = `Select column from table order by 1 Asc`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preOrderByKeyword": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "Asc",
            "expression": SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "postExpression": " ",
          },
        ],
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "column",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preOrderByKeyword": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "DESC",
            "expression": SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "postExpression": " ",
          },
        ],
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
          null,
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
            "column": "column",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "columnTwo",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preOrderByKeyword": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
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
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "postExpression": " ",
          },
          Object {
            "direction": "",
            "expression": SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "postExpression": "",
          },
        ],
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "column",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preOrderByKeyword": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
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
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "postExpression": " ",
          },
          Object {
            "direction": "DESC",
            "expression": SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "postExpression": " ",
          },
        ],
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
          null,
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
            "column": "column",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "columnTwo",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postLimitKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preLimitKeyword": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": "limit",
        "limitValue": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postUnionKeyword": " ",
          "preFrom": " ",
          "preQuery": "",
          "preUnionKeyword": " ",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": "union all",
        "unionQuery": SqlQuery {
          "explainKeyword": undefined,
          "fromKeyword": "from",
          "groupByExpression": undefined,
          "groupByExpressionSeparators": undefined,
          "groupByKeyword": undefined,
          "havingExpression": undefined,
          "havingKeyword": undefined,
          "innerSpacing": Object {
            "postFrom": " ",
            "postQuery": "",
            "postSelect": " ",
            "postSelectDecorator": "",
            "preFrom": " ",
            "preQuery": "",
          },
          "joinKeyword": undefined,
          "joinTable": undefined,
          "joinType": undefined,
          "limitKeyword": undefined,
          "limitValue": undefined,
          "onExpression": undefined,
          "onKeyword": undefined,
          "orderByKeyword": undefined,
          "orderBySeparators": undefined,
          "orderByUnits": undefined,
          "postQueryAnnotation": Array [],
          "selectAnnotations": Array [
            null,
          ],
          "selectDecorator": "",
          "selectKeyword": "select",
          "selectSeparators": Array [],
          "selectValues": Array [
            SqlRef {
              "column": "*",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
          ],
          "tableSeparators": Array [],
          "tables": Array [
            SqlRef {
              "column": undefined,
              "innerSpacing": Object {
                "postTable": "",
                "preTable": "",
              },
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": undefined,
              "table": "otherTable",
              "tableQuotes": "",
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

describe('Test Join Clause', () => {
  it('Inner join', () => {
    const sql = 'Select * from table INNER Join anotherTable ON column = column';

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postJoinKeyword": " ",
          "postJoinTable": " ",
          "postJoinType": " ",
          "postOn": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preJoin": " ",
          "preQuery": "",
        },
        "joinKeyword": "Join",
        "joinTable": SqlRef {
          "column": undefined,
          "innerSpacing": Object {
            "postTable": "",
            "preTable": "",
          },
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": undefined,
          "table": "anotherTable",
          "tableQuotes": "",
          "type": "ref",
        },
        "joinType": "INNER",
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": SqlMulti {
          "arguments": Array [
            SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
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
        "onKeyword": "ON",
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

  it('Left join', () => {
    const sql = 'Select * from table Left Join anotherTable ON column = column';

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postJoinKeyword": " ",
          "postJoinTable": " ",
          "postJoinType": " ",
          "postOn": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preJoin": " ",
          "preQuery": "",
        },
        "joinKeyword": "Join",
        "joinTable": SqlRef {
          "column": undefined,
          "innerSpacing": Object {
            "postTable": "",
            "preTable": "",
          },
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": undefined,
          "table": "anotherTable",
          "tableQuotes": "",
          "type": "ref",
        },
        "joinType": "Left",
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": SqlMulti {
          "arguments": Array [
            SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
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
        "onKeyword": "ON",
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

  it('Right join', () => {
    const sql = 'Select * from table RIGHT Join anotherTable ON column = column';

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postJoinKeyword": " ",
          "postJoinTable": " ",
          "postJoinType": " ",
          "postOn": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preJoin": " ",
          "preQuery": "",
        },
        "joinKeyword": "Join",
        "joinTable": SqlRef {
          "column": undefined,
          "innerSpacing": Object {
            "postTable": "",
            "preTable": "",
          },
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": undefined,
          "table": "anotherTable",
          "tableQuotes": "",
          "type": "ref",
        },
        "joinType": "RIGHT",
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": SqlMulti {
          "arguments": Array [
            SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
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
        "onKeyword": "ON",
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

  it('Full join', () => {
    const sql = 'Select * from table FULL Join anotherTable ON column = column';

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postJoinKeyword": " ",
          "postJoinTable": " ",
          "postJoinType": " ",
          "postOn": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preJoin": " ",
          "preQuery": "",
        },
        "joinKeyword": "Join",
        "joinTable": SqlRef {
          "column": undefined,
          "innerSpacing": Object {
            "postTable": "",
            "preTable": "",
          },
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": undefined,
          "table": "anotherTable",
          "tableQuotes": "",
          "type": "ref",
        },
        "joinType": "FULL",
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": SqlMulti {
          "arguments": Array [
            SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
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
        "onKeyword": "ON",
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

  it('Full Outer join', () => {
    const sql = 'Select * from table FULL OUTER Join anotherTable ON column = column';

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postJoinKeyword": " ",
          "postJoinTable": " ",
          "postJoinType": " ",
          "postOn": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preJoin": " ",
          "preQuery": "",
        },
        "joinKeyword": "Join",
        "joinTable": SqlRef {
          "column": undefined,
          "innerSpacing": Object {
            "postTable": "",
            "preTable": "",
          },
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": undefined,
          "table": "anotherTable",
          "tableQuotes": "",
          "type": "ref",
        },
        "joinType": "FULL OUTER",
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": SqlMulti {
          "arguments": Array [
            SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
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
        "onKeyword": "ON",
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "*",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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

describe('Queries with comments', () => {
  it('single comment', () => {
    const sql = sane`
      Select -- some comment 
      column from table
    `;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postQuery": "",
          "postSelect": " -- some comment 
      ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "column",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
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
    const sql = sane`
      Select --some comment
        --some comment
      column from table
    `;

    backAndForth(sql);
  });

  it('comment on new line', () => {
    const sql = sane`
      Select
        -- some comment
      column from table
    `;

    backAndForth(sql);
  });

  it('comment containing hyphens', () => {
    const sql = sane`
      Select
        -- some--comment
        column from table
    `;

    backAndForth(sql);
  });

  it('comment with no space', () => {
    const sql = sane`
      Select --some comment
      column from table
    `;

    backAndForth(sql);
  });

  it('comment with non english', () => {
    const sql = sane`
      Select --Здравствуйте
      column from table
    `;

    backAndForth(sql);
  });

  it('comment at end of query', () => {
    const sql = sane`
      Select 
      column from table
      -- comment
    `;

    backAndForth(sql);
  });

  it('comment with unary negative', () => {
    const sql = sane`
      Select 
      column from table
      -- comment
      order by -1
    `;

    backAndForth(sql);
  });
});

describe('Queries with annotated comments', () => {
  it('single comment', () => {
    const sql = sane`
      Select column, column1, column2 from table 
      order by column
      --: valueName = value
    `;

    backAndForth(sql);
  });
});

describe('No spacing', () => {
  it('Expression with no spacing', () => {
    const sql = `SELECT"channel",COUNT(*)AS"Count",COUNT(DISTINCT"cityName")AS"dist_cityName"FROM"wiki"GROUP BY"channel"ORDER BY"Count"DESC`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "FROM",
        "groupByExpression": Array [
          SqlRef {
            "column": "channel",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "\\"",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "groupByExpressionSeparators": Array [],
        "groupByKeyword": "GROUP BY",
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": "",
          "postGroupByKeyword": "",
          "postOrderByKeyword": "",
          "postQuery": "",
          "postSelect": "",
          "postSelectDecorator": "",
          "preFrom": "",
          "preGroupByKeyword": "",
          "preOrderByKeyword": "",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": "ORDER BY",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "DESC",
            "expression": SqlRef {
              "column": "Count",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "\\"",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "postExpression": "",
          },
        ],
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
          null,
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectSeparators": Array [
          Separator {
            "left": "",
            "right": "",
            "separator": ",",
          },
          Separator {
            "left": "",
            "right": "",
            "separator": ",",
          },
        ],
        "selectValues": Array [
          SqlRef {
            "column": "channel",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "\\"",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "column": "Count",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "\\"",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "asKeyword": "AS",
            "column": SqlFunction {
              "arguments": Array [
                SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
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
              "postAs": "",
              "postExpression": "",
            },
            "type": "alias-ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "column": "dist_cityName",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "\\"",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "asKeyword": "AS",
            "column": SqlFunction {
              "arguments": Array [
                SqlRef {
                  "column": "cityName",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "\\"",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
              ],
              "decorator": "DISTINCT",
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
              "postAs": "",
              "postExpression": "",
            },
            "type": "alias-ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "wiki",
            "tableQuotes": "\\"",
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
