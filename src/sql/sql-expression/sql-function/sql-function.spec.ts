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

import { parseSql } from '../../..';
import { backAndForth } from '../../../test-utils';

describe('SqlFunction', () => {
  it('things that work', () => {
    const queries: string[] = [
      "position('b' in 'abc')",
      "position('' in 'abc')",
      "position('b' in 'abcabc' FROM 3)",
      "position('b' in 'abcabc' FROM 5)",
      "position('b' in 'abcabc' FROM 6)",
      "position('b' in 'abcabc' FROM -5)",
      "position('' in 'abc' FROM 3)",
      "position('' in 'abc' FROM 10)",
      "position(x'bb' in x'aabbcc')",
      "position(x'' in x'aabbcc')",
      "position(x'bb' in x'aabbccaabbcc' FROM 3)",
      "position(x'bb' in x'aabbccaabbcc' FROM 5)",
      "position(x'bb' in x'aabbccaabbcc' FROM 6)",
      "position(x'bb' in x'aabbccaabbcc' FROM -5)",
      "position(x'cc' in x'aabbccdd' FROM 2)",
      "position(x'' in x'aabbcc' FROM 3)",
      "position(x'' in x'aabbcc' FROM 10)",

      "trim(leading 'eh' from 'hehe__hehe')",
      "trim(trailing 'eh' from 'hehe__hehe')",
      "trim('eh' from 'hehe__hehe')",
    ];

    for (const sql of queries) {
      try {
        backAndForth(sql);
      } catch (e) {
        throw new Error(`problem with \`${sql}\`: ${e.message}`);
      }
    }
  });

  it('Function without args', () => {
    const sql = `FN()`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": undefined,
        "decorator": undefined,
        "filterKeyword": undefined,
        "functionName": "FN",
        "innerSpacing": Object {
          "postLeftParen": "",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
      }
    `);
  });

  it('Simple function', () => {
    const sql = `SUM(A)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlRef {
              "column": "A",
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
        "functionName": "SUM",
        "innerSpacing": Object {
          "postArguments": "",
          "postLeftParen": "",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
      }
    `);
  });

  it('function in brackets', () => {
    const sql = `(  SUM(A))`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlRef {
              "column": "A",
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
        "functionName": "SUM",
        "innerSpacing": Object {
          "postArguments": "",
          "postLeftParen": "",
          "preLeftParen": "",
        },
        "parens": Array [
          Object {
            "leftSpacing": "  ",
            "rightSpacing": "",
          },
        ],
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
      }
    `);
  });

  it('function with expression', () => {
    const sql = `SUM( 1 + 2 AND 3 + 2)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlMulti {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "AND",
                  },
                ],
                "values": Array [
                  SqlMulti {
                    "args": SeparatedArray {
                      "separators": Array [
                        Separator {
                          "left": " ",
                          "right": " ",
                          "separator": "+",
                        },
                      ],
                      "values": Array [
                        SqlLiteral {
                          "innerSpacing": Object {},
                          "keyword": undefined,
                          "stringValue": "1",
                          "type": "literal",
                          "value": 1,
                        },
                        SqlLiteral {
                          "innerSpacing": Object {},
                          "keyword": undefined,
                          "stringValue": "2",
                          "type": "literal",
                          "value": 2,
                        },
                      ],
                    },
                    "expressionType": "+",
                    "innerSpacing": Object {},
                    "type": "multi",
                  },
                  SqlMulti {
                    "args": SeparatedArray {
                      "separators": Array [
                        Separator {
                          "left": " ",
                          "right": " ",
                          "separator": "+",
                        },
                      ],
                      "values": Array [
                        SqlLiteral {
                          "innerSpacing": Object {},
                          "keyword": undefined,
                          "stringValue": "3",
                          "type": "literal",
                          "value": 3,
                        },
                        SqlLiteral {
                          "innerSpacing": Object {},
                          "keyword": undefined,
                          "stringValue": "2",
                          "type": "literal",
                          "value": 2,
                        },
                      ],
                    },
                    "expressionType": "+",
                    "innerSpacing": Object {},
                    "type": "multi",
                  },
                ],
              },
              "expressionType": "and",
              "innerSpacing": Object {},
              "type": "multi",
            },
          ],
        },
        "decorator": undefined,
        "filterKeyword": undefined,
        "functionName": "SUM",
        "innerSpacing": Object {
          "postArguments": "",
          "postLeftParen": " ",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
      }
    `);
  });

  it('function with weird spacing ', () => {
    const sql = `SUM( A      )`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlRef {
              "column": "A",
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
        "functionName": "SUM",
        "innerSpacing": Object {
          "postArguments": "      ",
          "postLeftParen": " ",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
      }
    `);
  });

  it('function in expression', () => {
    const sql = `Sum(A) OR SUM(B) AND SUM(c) * 4`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "OR",
            },
          ],
          "values": Array [
            SqlFunction {
              "args": SeparatedArray {
                "separators": Array [],
                "values": Array [
                  SqlRef {
                    "column": "A",
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
              "functionName": "Sum",
              "innerSpacing": Object {
                "postArguments": "",
                "postLeftParen": "",
                "preLeftParen": "",
              },
              "specialParen": undefined,
              "type": "function",
              "whereClause": undefined,
            },
            SqlMulti {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "AND",
                  },
                ],
                "values": Array [
                  SqlFunction {
                    "args": SeparatedArray {
                      "separators": Array [],
                      "values": Array [
                        SqlRef {
                          "column": "B",
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
                    "functionName": "SUM",
                    "innerSpacing": Object {
                      "postArguments": "",
                      "postLeftParen": "",
                      "preLeftParen": "",
                    },
                    "specialParen": undefined,
                    "type": "function",
                    "whereClause": undefined,
                  },
                  SqlMulti {
                    "args": SeparatedArray {
                      "separators": Array [
                        Separator {
                          "left": " ",
                          "right": " ",
                          "separator": "*",
                        },
                      ],
                      "values": Array [
                        SqlFunction {
                          "args": SeparatedArray {
                            "separators": Array [],
                            "values": Array [
                              SqlRef {
                                "column": "c",
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
                          "functionName": "SUM",
                          "innerSpacing": Object {
                            "postArguments": "",
                            "postLeftParen": "",
                            "preLeftParen": "",
                          },
                          "specialParen": undefined,
                          "type": "function",
                          "whereClause": undefined,
                        },
                        SqlLiteral {
                          "innerSpacing": Object {},
                          "keyword": undefined,
                          "stringValue": "4",
                          "type": "literal",
                          "value": 4,
                        },
                      ],
                    },
                    "expressionType": "*",
                    "innerSpacing": Object {},
                    "type": "multi",
                  },
                ],
              },
              "expressionType": "and",
              "innerSpacing": Object {},
              "type": "multi",
            },
          ],
        },
        "expressionType": "or",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('function with filter', () => {
    const sql = `Sum(A) Filter (WHERE val > 1)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlRef {
              "column": "A",
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
        "filterKeyword": "Filter",
        "functionName": "Sum",
        "innerSpacing": Object {
          "postArguments": "",
          "postFilter": " ",
          "postLeftParen": "",
          "preFilter": " ",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": SqlWhereClause {
          "expression": SqlComparison {
            "innerSpacing": Object {
              "postOp": " ",
              "preOp": " ",
            },
            "lhs": SqlRef {
              "column": "val",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            "notKeyword": undefined,
            "op": ">",
            "rhs": SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "type": "comparison",
          },
          "innerSpacing": Object {
            "postKeyword": " ",
          },
          "keyword": "WHERE",
          "parens": Array [
            Object {
              "leftSpacing": "",
              "rightSpacing": "",
            },
          ],
          "type": "whereClause",
        },
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

  it('array works with array or numbers', () => {
    const sql = `Array [ 1, 2, 3  ]`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "",
              "right": " ",
              "separator": ",",
            },
            Separator {
              "left": "",
              "right": " ",
              "separator": ",",
            },
          ],
          "values": Array [
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "3",
              "type": "literal",
              "value": 3,
            },
          ],
        },
        "decorator": undefined,
        "filterKeyword": undefined,
        "functionName": "Array",
        "innerSpacing": Object {
          "postArguments": "  ",
          "postLeftParen": " ",
          "preLeftParen": " ",
        },
        "specialParen": "square",
        "type": "function",
        "whereClause": undefined,
      }
    `);
  });

  it('array works with array or strings', () => {
    const sql = `Array['1', u&'a', ']']`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "",
              "right": " ",
              "separator": ",",
            },
            Separator {
              "left": "",
              "right": " ",
              "separator": ",",
            },
          ],
          "values": Array [
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "'1'",
              "type": "literal",
              "value": "1",
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "u&'a'",
              "type": "literal",
              "value": "a",
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "']'",
              "type": "literal",
              "value": "]",
            },
          ],
        },
        "decorator": undefined,
        "filterKeyword": undefined,
        "functionName": "Array",
        "innerSpacing": Object {
          "postArguments": "",
          "postLeftParen": "",
          "preLeftParen": "",
        },
        "specialParen": "square",
        "type": "function",
        "whereClause": undefined,
      }
    `);
  });
});
