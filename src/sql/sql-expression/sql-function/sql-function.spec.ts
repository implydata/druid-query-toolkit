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

import { SqlExpression, SqlFunction } from '../..';
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

  it('is smart about clearing sepperators', () => {
    const sql = `EXTRACT(HOUR FROM "time")`;
    expect(String(SqlExpression.parse(sql).clearOwnSeparators())).toEqual(sql);
  });

  it('Function without args', () => {
    const sql = `FN()`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": undefined,
        "decorator": undefined,
        "functionName": "FN",
        "keywords": Object {},
        "spacing": Object {
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

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlRef {
              "column": "A",
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
        "functionName": "SUM",
        "keywords": Object {},
        "spacing": Object {
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

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlRef {
              "column": "A",
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
        "functionName": "SUM",
        "keywords": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "  ",
            "rightSpacing": "",
          },
        ],
        "spacing": Object {
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

  it('function with expression', () => {
    const sql = `SUM( 1 + 2 AND 3 + 2)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
                          "keywords": Object {},
                          "spacing": Object {},
                          "stringValue": "1",
                          "type": "literal",
                          "value": 1,
                        },
                        SqlLiteral {
                          "keywords": Object {},
                          "spacing": Object {},
                          "stringValue": "2",
                          "type": "literal",
                          "value": 2,
                        },
                      ],
                    },
                    "keywords": Object {},
                    "op": "+",
                    "spacing": Object {},
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
                          "keywords": Object {},
                          "spacing": Object {},
                          "stringValue": "3",
                          "type": "literal",
                          "value": 3,
                        },
                        SqlLiteral {
                          "keywords": Object {},
                          "spacing": Object {},
                          "stringValue": "2",
                          "type": "literal",
                          "value": 2,
                        },
                      ],
                    },
                    "keywords": Object {},
                    "op": "+",
                    "spacing": Object {},
                    "type": "multi",
                  },
                ],
              },
              "keywords": Object {},
              "op": "AND",
              "spacing": Object {},
              "type": "multi",
            },
          ],
        },
        "decorator": undefined,
        "functionName": "SUM",
        "keywords": Object {},
        "spacing": Object {
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

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlRef {
              "column": "A",
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
        "functionName": "SUM",
        "keywords": Object {},
        "spacing": Object {
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

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "functionName": "Sum",
              "keywords": Object {},
              "spacing": Object {
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
                    "functionName": "SUM",
                    "keywords": Object {},
                    "spacing": Object {
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
                          "functionName": "SUM",
                          "keywords": Object {},
                          "spacing": Object {
                            "postArguments": "",
                            "postLeftParen": "",
                            "preLeftParen": "",
                          },
                          "specialParen": undefined,
                          "type": "function",
                          "whereClause": undefined,
                        },
                        SqlLiteral {
                          "keywords": Object {},
                          "spacing": Object {},
                          "stringValue": "4",
                          "type": "literal",
                          "value": 4,
                        },
                      ],
                    },
                    "keywords": Object {},
                    "op": "*",
                    "spacing": Object {},
                    "type": "multi",
                  },
                ],
              },
              "keywords": Object {},
              "op": "AND",
              "spacing": Object {},
              "type": "multi",
            },
          ],
        },
        "keywords": Object {},
        "op": "OR",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('function with filter', () => {
    const sql = `Sum(A) Filter (WHERE val > 1)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlRef {
              "column": "A",
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
        "functionName": "Sum",
        "keywords": Object {
          "filter": "Filter",
        },
        "spacing": Object {
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
            "decorator": undefined,
            "keywords": Object {},
            "lhs": SqlRef {
              "column": "val",
              "keywords": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "spacing": Object {},
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            "not": false,
            "op": ">",
            "rhs": SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "spacing": Object {
              "postOp": " ",
              "preOp": " ",
            },
            "type": "comparison",
          },
          "keywords": Object {
            "where": "WHERE",
          },
          "parens": Array [
            Object {
              "leftSpacing": "",
              "rightSpacing": "",
            },
          ],
          "spacing": Object {
            "postWhere": " ",
          },
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

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "3",
              "type": "literal",
              "value": 3,
            },
          ],
        },
        "decorator": undefined,
        "functionName": "Array",
        "keywords": Object {},
        "spacing": Object {
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

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "'1'",
              "type": "literal",
              "value": "1",
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "u&'a'",
              "type": "literal",
              "value": "a",
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "']'",
              "type": "literal",
              "value": "]",
            },
          ],
        },
        "decorator": undefined,
        "functionName": "Array",
        "keywords": Object {},
        "spacing": Object {
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

  it('Changes filter expression', () => {
    const sql = SqlExpression.parse(
      `SUM(t."lol") FILTER (WHERE t."country" = 'USA')`,
    ) as SqlFunction;
    expect(String(sql.changeWhereExpression(`t."country" = 'UK'`))).toEqual(
      'SUM(t."lol") FILTER (WHERE t."country" = \'UK\')',
    );
  });

  it('Creates filter expression', () => {
    const sql = SqlExpression.parse(`SUM(t."lol")`) as SqlFunction;
    expect(String(sql.changeWhereExpression(`t."country" = 'UK'`))).toEqual(
      'SUM(t."lol") FILTER (WHERE t."country" = \'UK\')',
    );
  });
});
