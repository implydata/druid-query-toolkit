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
import { SqlColumn, SqlExpression, SqlFunction, SqlStar } from '..';

describe('SqlFunction', () => {
  it('things that work', () => {
    const functionExpressions: string[] = [
      `COUNT(*)`,
      `"COUNT"(*)`,
      `COUNT(DISTINCT blah)`,
      `COUNT(ALL blah)`,

      "position('b' in 'abc')",
      "position('' in 'abc')",
      "position('b' in 'abcabc' FROM 3)",
      "position('b' in 'abcabc' FROM 5)",
      "position('b' in 'abcabc' FROM 6)",
      "position('b' in 'abcabc' FROM -5)",
      // "position('b' in ('abcabc') FROM -5)", // ToDo: make this work, right now it parses as an IN statement
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
      "position (x'' in x'aabbcc' FROM 10)",

      "trim(leading 'eh' from 'hehe__hehe')",
      "trim(trailing 'eh' from 'hehe__hehe')",
      "trim('eh' from 'hehe__hehe')",
      `"trim" ('eh' from 'hehe__hehe')`,

      `SomeFn("arg1" => "boo")`,
      `"SomeFn" ("arg1" => "boo")`,
      `"ext" .  "SomeFn" ("arg1" => "boo")`,

      `TABLE(extern('{...}', '{...}', '[...]'))`,
      `"TABLE" (extern('{...}', '{...}', '[...]'))`,
      `TABLE(extern('{...}', '{...}')) EXTEND (x VARCHAR, y BIGINT, z TYPE('COMPLEX<json>'))`,
      `TABLE(extern('{...}', '{...}'))  (x VARCHAR, y BIGINT, z TYPE('COMPLEX<json>'))`,

      `SUM(COUNT(*)) OVER ()`,
      `SUM(COUNT(*))   Over  ("windowName"  Order by COUNT(*) Desc)`,

      `PI`,
      `CURRENT_TIMESTAMP`,
      `UNNEST(t)`,
    ];

    for (const sql of functionExpressions) {
      try {
        backAndForth(sql, SqlFunction);
      } catch (e) {
        console.log(`Problem with: \`${sql}\``);
        throw e;
      }
    }
  });

  it('is smart about clearing separators', () => {
    const sql = `EXTRACT(HOUR FROM "time")`;
    expect(String(SqlExpression.parse(sql).clearOwnSeparators())).toEqual(sql);
  });

  it('.isValidFunctionName', () => {
    expect(SqlFunction.isValidFunctionName('SUM')).toEqual(true);
    expect(SqlFunction.isValidFunctionName('TABLE')).toEqual(true);
  });

  it('.count', () => {
    expect(SqlFunction.count().toString()).toEqual('COUNT(*)');
    expect(
      SqlFunction.count(SqlStar.PLAIN).addWhereExpression(SqlExpression.parse('x > 1')).toString(),
    ).toEqual('COUNT(*) FILTER (WHERE x > 1)');
  });

  it('.countDistinct', () => {
    const x = SqlExpression.parse('x');
    expect(SqlFunction.countDistinct(x).toString()).toEqual('COUNT(DISTINCT x)');
  });

  it('.cast', () => {
    expect(SqlFunction.cast(SqlExpression.parse('X'), 'BIGINT').toString()).toEqual(
      'CAST(X AS BIGINT)',
    );
  });

  it('.floor', () => {
    expect(SqlFunction.floor(SqlColumn.create('__time'), 'Hour').toString()).toEqual(
      'FLOOR("__time" TO Hour)',
    );
  });

  it('.arrayOfLiterals', () => {
    expect(SqlFunction.arrayOfLiterals(['a', 'b', 'c']).toString()).toEqual(`ARRAY['a', 'b', 'c']`);
  });

  it('Function without args', () => {
    const sql = `FN()`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": undefined,
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "FN",
          "quotes": false,
        },
        "keywords": Object {},
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postLeftParen": "",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
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
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "A",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
          ],
        },
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "SUM",
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
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "A",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
          ],
        },
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "SUM",
          "quotes": false,
        },
        "keywords": Object {},
        "namespace": undefined,
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
        "windowSpec": undefined,
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
                          "parens": undefined,
                          "spacing": Object {},
                          "stringValue": "1",
                          "type": "literal",
                          "value": 1,
                        },
                        SqlLiteral {
                          "keywords": Object {},
                          "parens": undefined,
                          "spacing": Object {},
                          "stringValue": "2",
                          "type": "literal",
                          "value": 2,
                        },
                      ],
                    },
                    "keywords": Object {},
                    "op": "+",
                    "parens": undefined,
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
                          "parens": undefined,
                          "spacing": Object {},
                          "stringValue": "3",
                          "type": "literal",
                          "value": 3,
                        },
                        SqlLiteral {
                          "keywords": Object {},
                          "parens": undefined,
                          "spacing": Object {},
                          "stringValue": "2",
                          "type": "literal",
                          "value": 2,
                        },
                      ],
                    },
                    "keywords": Object {},
                    "op": "+",
                    "parens": undefined,
                    "spacing": Object {},
                    "type": "multi",
                  },
                ],
              },
              "keywords": Object {},
              "op": "AND",
              "parens": undefined,
              "spacing": Object {},
              "type": "multi",
            },
          ],
        },
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "SUM",
          "quotes": false,
        },
        "keywords": Object {},
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postArguments": "",
          "postLeftParen": " ",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
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
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "A",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
          ],
        },
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "SUM",
          "quotes": false,
        },
        "keywords": Object {},
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postArguments": "      ",
          "postLeftParen": " ",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
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
                  SqlColumn {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "A",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "table": undefined,
                    "type": "column",
                  },
                ],
              },
              "decorator": undefined,
              "extendClause": undefined,
              "functionName": RefName {
                "name": "Sum",
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
                        SqlColumn {
                          "keywords": Object {},
                          "parens": undefined,
                          "refName": RefName {
                            "name": "B",
                            "quotes": false,
                          },
                          "spacing": Object {},
                          "table": undefined,
                          "type": "column",
                        },
                      ],
                    },
                    "decorator": undefined,
                    "extendClause": undefined,
                    "functionName": RefName {
                      "name": "SUM",
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
                              SqlColumn {
                                "keywords": Object {},
                                "parens": undefined,
                                "refName": RefName {
                                  "name": "c",
                                  "quotes": false,
                                },
                                "spacing": Object {},
                                "table": undefined,
                                "type": "column",
                              },
                            ],
                          },
                          "decorator": undefined,
                          "extendClause": undefined,
                          "functionName": RefName {
                            "name": "SUM",
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
                        SqlLiteral {
                          "keywords": Object {},
                          "parens": undefined,
                          "spacing": Object {},
                          "stringValue": "4",
                          "type": "literal",
                          "value": 4,
                        },
                      ],
                    },
                    "keywords": Object {},
                    "op": "*",
                    "parens": undefined,
                    "spacing": Object {},
                    "type": "multi",
                  },
                ],
              },
              "keywords": Object {},
              "op": "AND",
              "parens": undefined,
              "spacing": Object {},
              "type": "multi",
            },
          ],
        },
        "keywords": Object {},
        "op": "OR",
        "parens": undefined,
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
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "A",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
          ],
        },
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "Sum",
          "quotes": false,
        },
        "keywords": Object {
          "filter": "Filter",
        },
        "namespace": undefined,
        "parens": undefined,
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
            "keywords": Object {
              "op": ">",
            },
            "lhs": SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "val",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
            "negated": false,
            "op": ">",
            "parens": undefined,
            "rhs": SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
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
        "windowSpec": undefined,
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

  it('TABLE with EXTEND', () => {
    const sql = `TABLE(extern('{...}', '{...}')) EXTEND(x VARCHAR, y BIGINT, "z"  TYPE('COMPLEX<json>'))`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlFunction {
        "args": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlFunction {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": "",
                    "right": " ",
                    "separator": ",",
                  },
                ],
                "values": Array [
                  SqlLiteral {
                    "keywords": Object {},
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "'{...}'",
                    "type": "literal",
                    "value": "{...}",
                  },
                  SqlLiteral {
                    "keywords": Object {},
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "'{...}'",
                    "type": "literal",
                    "value": "{...}",
                  },
                ],
              },
              "decorator": undefined,
              "extendClause": undefined,
              "functionName": RefName {
                "name": "extern",
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
          ],
        },
        "decorator": undefined,
        "extendClause": SqlExtendClause {
          "columnDeclarations": SeparatedArray {
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
              SqlColumnDeclaration {
                "column": RefName {
                  "name": "x",
                  "quotes": false,
                },
                "columnType": SqlType {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "type": "type",
                  "value": "VARCHAR",
                },
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {
                  "postColumn": " ",
                },
                "type": "columnDeclaration",
              },
              SqlColumnDeclaration {
                "column": RefName {
                  "name": "y",
                  "quotes": false,
                },
                "columnType": SqlType {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "type": "type",
                  "value": "BIGINT",
                },
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {
                  "postColumn": " ",
                },
                "type": "columnDeclaration",
              },
              SqlColumnDeclaration {
                "column": RefName {
                  "name": "z",
                  "quotes": true,
                },
                "columnType": SqlType {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "type": "type",
                  "value": "TYPE('COMPLEX<json>')",
                },
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {
                  "postColumn": "  ",
                },
                "type": "columnDeclaration",
              },
            ],
          },
          "keywords": Object {
            "extend": "EXTEND",
          },
          "parens": undefined,
          "spacing": Object {
            "postColumnDeclarations": "",
            "postExtend": "",
            "postLeftParen": "",
          },
          "type": "extendClause",
        },
        "functionName": RefName {
          "name": "TABLE",
          "quotes": false,
        },
        "keywords": Object {},
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postArguments": "",
          "postLeftParen": "",
          "preExtend": " ",
          "preLeftParen": "",
        },
        "specialParen": undefined,
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
      }
    `);
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
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
            SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "3",
              "type": "literal",
              "value": 3,
            },
          ],
        },
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "Array",
          "quotes": false,
        },
        "keywords": Object {},
        "namespace": undefined,
        "parens": undefined,
        "spacing": Object {
          "postArguments": "  ",
          "postLeftParen": " ",
          "preLeftParen": " ",
        },
        "specialParen": "square",
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
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
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "'1'",
              "type": "literal",
              "value": "1",
            },
            SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "u&'a'",
              "type": "literal",
              "value": "a",
            },
            SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "']'",
              "type": "literal",
              "value": "]",
            },
          ],
        },
        "decorator": undefined,
        "extendClause": undefined,
        "functionName": RefName {
          "name": "Array",
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
        "specialParen": "square",
        "type": "function",
        "whereClause": undefined,
        "windowSpec": undefined,
      }
    `);
  });

  describe('#changeWhereExpression', () => {
    it('changes', () => {
      const sql = SqlExpression.parse(
        `SUM(t."lol") FILTER (WHERE t."country" = 'USA')`,
      ) as SqlFunction;
      expect(String(sql.changeWhereExpression(SqlExpression.parse(`t."country" = 'UK'`)))).toEqual(
        'SUM(t."lol") FILTER (WHERE t."country" = \'UK\')',
      );
    });

    it('adds', () => {
      const sql = SqlExpression.parse(`SUM(t."lol")`) as SqlFunction;
      expect(String(sql.changeWhereExpression(SqlExpression.parse(`t."country" = 'UK'`)))).toEqual(
        'SUM(t."lol") FILTER (WHERE t."country" = \'UK\')',
      );
    });
  });

  describe('#addWhereExpression', () => {
    it('adds when something already exists', () => {
      const sql = SqlExpression.parse(
        `SUM(t."lol") FILTER (WHERE t."country" = 'USA' OR t."city" = 'SF')`,
      ) as SqlFunction;
      expect(String(sql.addWhereExpression(SqlExpression.parse(`t."browser" = 'Chrome'`)))).toEqual(
        `SUM(t."lol") FILTER (WHERE (t."country" = 'USA' OR t."city" = 'SF') AND t."browser" = 'Chrome')`,
      );
    });

    it('adds when nothing exists', () => {
      const sql = SqlExpression.parse(`SUM(t."lol")`) as SqlFunction;
      expect(
        String(sql.changeWhereExpression(SqlExpression.parse(`t."browser" = 'Chrome'`))),
      ).toEqual('SUM(t."lol") FILTER (WHERE t."browser" = \'Chrome\')');
    });
  });
});
