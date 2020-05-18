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

import { sqlParserFactory } from '../..';
import { backAndForth } from '../../test-utils';

const parser = sqlParserFactory();

describe('SqlFunction', () => {
  it('Simple function', () => {
    const sql = `SUM(A)`;

    backAndForth(sql);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "arguments": Array [
          SqlRef {
            "column": "A",
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
      }
    `);
  });

  it('function in brackets', () => {
    const sql = `(  SUM(A))`;

    backAndForth(sql);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "arguments": Array [
          SqlRef {
            "column": "A",
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
        "parens": Array [
          Object {
            "leftSpacing": "  ",
            "rightSpacing": "",
          },
        ],
        "separators": Array [],
        "type": "function",
        "whereExpression": undefined,
        "whereKeyword": undefined,
      }
    `);
  });

  it('function with expression', () => {
    const sql = `SUM( 1 + 2 AND 3 + 2)`;

    backAndForth(sql);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "arguments": Array [
          SqlMulti {
            "arguments": Array [
              SqlMulti {
                "arguments": Array [
                  SqlLiteral {
                    "innerSpacing": Object {},
                    "quotes": undefined,
                    "stringValue": "1",
                    "type": "literal",
                    "value": 1,
                  },
                  SqlLiteral {
                    "innerSpacing": Object {},
                    "quotes": undefined,
                    "stringValue": "2",
                    "type": "literal",
                    "value": 2,
                  },
                ],
                "expressionType": "Additive",
                "innerSpacing": Object {},
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "+",
                  },
                ],
                "type": "multi",
              },
              SqlMulti {
                "arguments": Array [
                  SqlLiteral {
                    "innerSpacing": Object {},
                    "quotes": undefined,
                    "stringValue": "3",
                    "type": "literal",
                    "value": 3,
                  },
                  SqlLiteral {
                    "innerSpacing": Object {},
                    "quotes": undefined,
                    "stringValue": "2",
                    "type": "literal",
                    "value": 2,
                  },
                ],
                "expressionType": "Additive",
                "innerSpacing": Object {},
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "+",
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
        ],
        "decorator": undefined,
        "filterKeyword": undefined,
        "functionName": "SUM",
        "innerSpacing": Object {
          "postDecorator": "",
          "postFilterKeyword": "",
          "postFilterLeftParen": "",
          "postLeftParen": " ",
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
      }
    `);
  });

  it('function with weird spacing ', () => {
    const sql = `SUM( A      )`;

    backAndForth(sql);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "arguments": Array [
          SqlRef {
            "column": "A",
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
          "postLeftParen": " ",
          "postName": "",
          "postWhereKeyword": "",
          "preFilter": "",
          "preFilterRightParen": "",
          "preRightParen": "      ",
        },
        "separators": Array [],
        "type": "function",
        "whereExpression": undefined,
        "whereKeyword": undefined,
      }
    `);
  });

  it('function in expression', () => {
    const sql = `Sum(A) OR SUM(B) AND SUM(c) * 4`;

    backAndForth(sql);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlFunction {
            "arguments": Array [
              SqlRef {
                "column": "A",
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
          SqlMulti {
            "arguments": Array [
              SqlFunction {
                "arguments": Array [
                  SqlRef {
                    "column": "B",
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
              SqlMulti {
                "arguments": Array [
                  SqlFunction {
                    "arguments": Array [
                      SqlRef {
                        "column": "c",
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
                    "quotes": undefined,
                    "stringValue": "4",
                    "type": "literal",
                    "value": 4,
                  },
                ],
                "expressionType": "Multiplicative",
                "innerSpacing": Object {},
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "*",
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
        ],
        "expressionType": "OR",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "OR",
          },
        ],
        "type": "multi",
      }
    `);
  });

  it('function with filter', () => {
    const sql = `Sum(A) Filter (WHERE value > 1)`;

    backAndForth(sql);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "arguments": Array [
          SqlRef {
            "column": "A",
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
        "filterKeyword": "Filter",
        "functionName": "Sum",
        "innerSpacing": Object {
          "postDecorator": "",
          "postFilterKeyword": " ",
          "postFilterLeftParen": "",
          "postLeftParen": "",
          "postName": "",
          "postWhereKeyword": " ",
          "preFilter": " ",
          "preFilterRightParen": "",
          "preRightParen": "",
        },
        "separators": Array [],
        "type": "function",
        "whereExpression": SqlMulti {
          "arguments": Array [
            SqlRef {
              "column": "value",
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
              "quotes": undefined,
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
        "whereKeyword": "WHERE",
      }
    `);
  });

  it('Function with decorator and expression', () => {
    const sql = `Count(Distinct 1 + 2 AND 3 + 2)`;

    backAndForth(sql);
  });

  it('Function with decorator and extra space', () => {
    const sql = `Count( Distinct 1 + 2 AND 3 + 2)`;

    backAndForth(sql);
  });

  it('Trim function', () => {
    const sql = `Trim( Both A and B FROM D)`;

    backAndForth(sql);
  });
});
