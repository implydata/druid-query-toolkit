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
import {
  SqlColumn,
  SqlColumnDeclaration,
  SqlExpression,
  SqlExtendClause,
  SqlFunction,
  SqlKeyValue,
  SqlLiteral,
  SqlNamespace,
  SqlStar,
  SqlType,
  SqlWhereClause,
} from '..';
import { RefName, SeparatedArray, Separator } from '../helpers';

describe('SqlFunction', () => {
  describe('parses', () => {
    it.each([
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
      `JSON_VALUE(my_json, '$.x')`,
      `JSON_VALUE(my_json, '$.x' RETURNING DOUBLE)`,
      `SomeFn("arg1" => "boo")`,
      `"SomeFn" ("arg1" => "boo")`,
      `"ext" .  "SomeFn" ("arg1" => "boo")`,
      `LOCAL(path => '/tmp/druid')`,
      `EXTERN(LOCAL("path" => '/tmp/druid'))`,
      `NESTED_AGG(TIME_FLOOR(t.__time, 'P1D'), COUNT(DISTINCT t."ip") AS "daily_unique", AVG("daily_unique"))`,
      `TABLE(extern('{...}', '{...}', '[...]'))`,
      `"TABLE" (extern('{...}', '{...}', '[...]'))`,
      `TABLE(extern('{...}', '{...}')) EXTEND (x VARCHAR, y BIGINT, z TYPE('COMPLEX<json>'))`,
      `TABLE(extern('{...}', '{...}'))  (x VARCHAR, y BIGINT, z TYPE('COMPLEX<json>'))`,
      `TABLE(extern('{...}', '{...}'))  EXTEND  (xs VARCHAR   ARRAY, ys BIGINT  ARRAY, zs DOUBLE  ARRAY)`,
      `SUM(COUNT(*)) OVER ()`,
      `SUM(COUNT(*))   Over  ("windowName"  Order by COUNT(*) Desc)`,
      `ROW_NUMBER() OVER (PARTITION BY t."country", t."city" ORDER BY COUNT(*) DESC)`,
      `ROW_NUMBER() OVER (PARTITION BY t."country", t."city" ORDER BY COUNT(*) DESC RANGE UNBOUNDED PRECEDING)`,
      `ROW_NUMBER() OVER (PARTITION BY t."country", t."city" ORDER BY COUNT(*) DESC ROWS 5 PRECEDING)`,
      `ROW_NUMBER() OVER (PARTITION BY t."country", t."city" ORDER BY COUNT(*) DESC RANGE CURRENT ROW)`,
      `ROW_NUMBER() OVER (PARTITION BY t."country", t."city" ORDER BY COUNT(*) DESC RANGE 5 FOLLOWING)`,
      `ROW_NUMBER() OVER (PARTITION BY t."country", t."city" ORDER BY COUNT(*) DESC RANGE UNBOUNDED FOLLOWING)`,
      `ROW_NUMBER() OVER (PARTITION BY t."country", t."city" ORDER BY COUNT(*) DESC RANGE BETWEEN UNBOUNDED FOLLOWING AND CURRENT ROW)`,
      `count(*) over (partition by cityName order by countryName rows between unbounded preceding and 1 preceding)`,
      `PI`,
      `CURRENT_TIMESTAMP`,
      `UNNEST(t)`,
    ])('correctly parses: %s', sql => {
      backAndForth(sql, SqlFunction);
    });

    it('function without args', () => {
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

    it('simple function', () => {
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

    it('function with weird spacing', () => {
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

    it('function with decorator and expression', () => {
      const sql = `Count(Distinct 1 + 2 AND 3 + 2)`;

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
          "decorator": "DISTINCT",
          "extendClause": undefined,
          "functionName": RefName {
            "name": "Count",
            "quotes": false,
          },
          "keywords": Object {
            "decorator": "Distinct",
          },
          "namespace": undefined,
          "parens": undefined,
          "spacing": Object {
            "postArguments": "",
            "postDecorator": " ",
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

    it('function with decorator and extra space', () => {
      const sql = `Count( Distinct 1 + 2 AND 3 + 2)`;

      backAndForth(sql);
    });

    it('CAST function', () => {
      const sql = `Cast( x AS Thing)`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlFunction {
          "args": SeparatedArray {
            "separators": Array [
              Separator {
                "left": " ",
                "right": " ",
                "separator": "AS",
              },
            ],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "x",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              SqlType {
                "keywords": Object {
                  "type": "Thing",
                },
                "parens": undefined,
                "spacing": Object {},
                "type": "type",
                "value": "THING",
              },
            ],
          },
          "decorator": undefined,
          "extendClause": undefined,
          "functionName": RefName {
            "name": "Cast",
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

    it('TRIM function', () => {
      const sql = `Trim( Both A and B FROM D)`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlFunction {
          "args": SeparatedArray {
            "separators": Array [
              Separator {
                "left": " ",
                "right": " ",
                "separator": "FROM",
              },
            ],
            "values": Array [
              SqlMulti {
                "args": SeparatedArray {
                  "separators": Array [
                    Separator {
                      "left": " ",
                      "right": " ",
                      "separator": "and",
                    },
                  ],
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
                "keywords": Object {},
                "op": "AND",
                "parens": undefined,
                "spacing": Object {},
                "type": "multi",
              },
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "D",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
            ],
          },
          "decorator": "BOTH",
          "extendClause": undefined,
          "functionName": RefName {
            "name": "Trim",
            "quotes": false,
          },
          "keywords": Object {
            "decorator": "Both",
          },
          "namespace": undefined,
          "parens": undefined,
          "spacing": Object {
            "postArguments": "",
            "postDecorator": " ",
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
  });

  describe('.isValidFunctionName', () => {
    it('works', () => {
      expect(SqlFunction.isValidFunctionName('SUM')).toEqual(true);
      expect(SqlFunction.isValidFunctionName('TABLE')).toEqual(true);
      expect(SqlFunction.isValidFunctionName('SELECT')).toEqual(false);
    });
  });

  describe('.isNakedFunction', () => {
    it('recognizes functions that are called without parens', () => {
      expect(SqlFunction.isNakedFunction('current_timestamp')).toEqual(true);
      expect(SqlFunction.isNakedFunction('PI')).toEqual(true);
      expect(SqlFunction.isNakedFunction('SUM')).toEqual(false);
    });
  });

  describe('.simple', () => {
    it('with string function name and array of args', () => {
      const args = [SqlLiteral.create('A'), null, 0, false];
      const simpleFunc = SqlFunction.simple('MY_FUNC', args);

      expect(simpleFunc.getEffectiveFunctionName()).toEqual('MY_FUNC');
      expect(simpleFunc.toString()).toEqual("MY_FUNC('A', NULL, 0, FALSE)");
    });

    it('with RefName function name and SeparatedArray of args', () => {
      const funcName = RefName.functionName('my_func');
      const args = SeparatedArray.fromArray([SqlLiteral.create('test')], Separator.COMMA);
      const simpleFunc = SqlFunction.simple(funcName, args);

      expect(simpleFunc.getEffectiveFunctionName()).toEqual('MY_FUNC');
      expect(simpleFunc.toString()).toEqual("my_func('test')");
    });

    it('with filter expression', () => {
      const filterExpr = SqlExpression.parse('x > 10');
      const simpleFunc = SqlFunction.simple('COUNT', [SqlStar.PLAIN], filterExpr);

      expect(simpleFunc.toString()).toEqual('COUNT(*) FILTER (WHERE x > 10)');
    });
  });

  describe('.decorated', () => {
    it('with decorator and array of args', () => {
      const args = [SqlColumn.create('user_id')];
      const decoratedFunc = SqlFunction.decorated('COUNT', 'DISTINCT', args);

      expect(decoratedFunc.getEffectiveDecorator()).toEqual('DISTINCT');
      expect(decoratedFunc.toString()).toEqual('COUNT(DISTINCT "user_id")');
    });

    it('with undefined decorator', () => {
      const args = [SqlLiteral.create(42)];
      const decoratedFunc = SqlFunction.decorated('ABS', undefined, args);

      expect(decoratedFunc.getEffectiveDecorator()).toBeUndefined();
      expect(decoratedFunc.toString()).toEqual('ABS(42)');
    });

    it('with filter expression', () => {
      const args = [SqlColumn.create('revenue')];
      const filterExpr = SqlExpression.parse('country = "US"');
      const decoratedFunc = SqlFunction.decorated('SUM', 'DISTINCT', args, filterExpr);

      expect(decoratedFunc.toString()).toEqual(
        'SUM(DISTINCT "revenue") FILTER (WHERE country = "US")',
      );
    });
  });

  describe('.count', () => {
    it('works', () => {
      expect(SqlFunction.count().toString()).toEqual('COUNT(*)');
      expect(
        SqlFunction.count(SqlStar.PLAIN).addWhere(SqlExpression.parse('x > 1')).toString(),
      ).toEqual('COUNT(*) FILTER (WHERE x > 1)');
      expect(
        SqlFunction.count(SqlStar.PLAIN).addWhere(SqlExpression.parse('TRUE')).toString(),
      ).toEqual('COUNT(*)');
    });
  });

  describe('.countDistinct', () => {
    it('works', () => {
      const x = SqlExpression.parse('x');
      expect(SqlFunction.countDistinct(x).toString()).toEqual('COUNT(DISTINCT x)');
    });
  });

  describe('.sum', () => {
    it('creates a SUM', () => {
      expect(SqlFunction.sum(SqlColumn.create('x')).toString()).toEqual('SUM("x")');
    });
  });

  describe('.min', () => {
    it('creates a MIN', () => {
      expect(SqlFunction.min(SqlColumn.create('x')).toString()).toEqual('MIN("x")');
    });
  });

  describe('.max', () => {
    it('creates a MAX', () => {
      expect(SqlFunction.max(SqlColumn.create('x')).toString()).toEqual('MAX("x")');
    });
  });

  describe('.avg', () => {
    it('creates an AVG', () => {
      expect(SqlFunction.avg(SqlColumn.create('x')).toString()).toEqual('AVG("x")');
    });
  });

  describe('.cast', () => {
    it('works', () => {
      expect(SqlFunction.cast(SqlExpression.parse('X'), 'BIGINT').toString()).toEqual(
        'CAST(X AS BIGINT)',
      );
    });
  });

  describe('.jsonValue', () => {
    it('works', () => {
      expect(SqlFunction.jsonValue(SqlExpression.parse('X'), '$.x').toString()).toEqual(
        `JSON_VALUE(X, '$.x')`,
      );

      expect(SqlFunction.jsonValue(SqlExpression.parse('X'), '$.x', 'DOUBLE').toString()).toEqual(
        `JSON_VALUE(X, '$.x' RETURNING DOUBLE)`,
      );
    });
  });

  describe('.jsonObject', () => {
    it('with no arguments', () => {
      expect(SqlFunction.jsonObject().toString()).toEqual('JSON_OBJECT()');
      expect(SqlFunction.jsonObject({}).toString()).toEqual('JSON_OBJECT()');
    });

    it('with object of key-value pairs', () => {
      expect(SqlFunction.jsonObject({ name: 'John', age: 30 }).toString()).toEqual(
        `JSON_OBJECT('name':'John', 'age':30)`,
      );
    });

    it('with nested object', () => {
      expect(
        SqlFunction.jsonObject({
          name: 'John',
          age: { years: 30, months: 1 },
          hobbies: ['skiing', 'sleeping'],
        }).toString(),
      ).toEqual(
        `JSON_OBJECT('name':'John', 'age':JSON_OBJECT('years':30, 'months':1), 'hobbies':ARRAY['skiing', 'sleeping'])`,
      );
    });

    it('with a single SqlKeyValue (longhand)', () => {
      const keyValue = SqlKeyValue.create(SqlLiteral.create('name'), SqlLiteral.create('John'));
      expect(SqlFunction.jsonObject(keyValue).toString()).toEqual(
        `JSON_OBJECT(KEY 'name' VALUE 'John')`,
      );
    });

    it('with a single SqlKeyValue (shorthand)', () => {
      const keyValue = SqlKeyValue.short(SqlLiteral.create('name'), SqlLiteral.create('John'));
      expect(SqlFunction.jsonObject(keyValue).toString()).toEqual(`JSON_OBJECT('name':'John')`);
    });

    it('with an array of SqlKeyValue objects (longhand)', () => {
      const keyValues = [
        SqlKeyValue.create(SqlLiteral.create('name'), SqlLiteral.create('John')),
        SqlKeyValue.create(SqlLiteral.create('age'), SqlLiteral.create(30)),
      ];
      expect(SqlFunction.jsonObject(keyValues).toString()).toEqual(
        `JSON_OBJECT(KEY 'name' VALUE 'John', KEY 'age' VALUE 30)`,
      );
    });

    it('with an array of SqlKeyValue objects (shorthand)', () => {
      const keyValues = [
        SqlKeyValue.short(SqlLiteral.create('name'), SqlLiteral.create('John')),
        SqlKeyValue.short(SqlLiteral.create('age'), SqlLiteral.create(30)),
      ];
      expect(SqlFunction.jsonObject(keyValues).toString()).toEqual(
        `JSON_OBJECT('name':'John', 'age':30)`,
      );
    });

    it('with mixed longhand and shorthand SqlKeyValue objects', () => {
      const keyValues = [
        SqlKeyValue.create(SqlLiteral.create('name'), SqlLiteral.create('John')),
        SqlKeyValue.short(SqlLiteral.create('age'), SqlLiteral.create(30)),
      ];
      expect(SqlFunction.jsonObject(keyValues).toString()).toEqual(
        `JSON_OBJECT(KEY 'name' VALUE 'John', 'age':30)`,
      );
    });

    it('with SqlExpression keys and values', () => {
      const keyValues = SqlKeyValue.create(
        SqlExpression.parse('column_name'),
        SqlExpression.parse('column_value'),
      );
      expect(SqlFunction.jsonObject(keyValues).toString()).toEqual(
        'JSON_OBJECT(KEY column_name VALUE column_value)',
      );
    });

    it('with a SeparatedArray of key-values', () => {
      const keyValues = SeparatedArray.fromArray([
        SqlKeyValue.short(SqlLiteral.create('a'), SqlLiteral.create(1)),
      ]);
      expect(SqlFunction.jsonObject(keyValues).toString()).toEqual(`JSON_OBJECT('a':1)`);
    });

    it('with an object of various value types', () => {
      expect(
        SqlFunction.jsonObject({
          n: null,
          d: new Date('2020-01-02Z'),
          e: SqlColumn.create('x'),
          b: true,
          big: BigInt(7),
          skipped: undefined,
        }).toString(),
      ).toEqual(`JSON_OBJECT('n':NULL, 'd':TIMESTAMP '2020-01-02', 'e':"x", 'b':TRUE, 'big':7)`);
    });

    it('throws on values that can not be represented', () => {
      expect(() => SqlFunction.jsonObject({ f: () => 1 })).toThrow(
        'Cannot use function (in key f) as a JSON object value',
      );
      expect(() => SqlFunction.jsonObject({ s: Symbol('s') })).toThrow(
        'Cannot use symbol (in key s) as a JSON object value',
      );
    });

    it('with complex expressions', () => {
      // Create complex expressions using the builder pattern
      const userId = SqlColumn.create('user').concat(SqlColumn.create('id'));
      const valueAsVarchar = SqlFunction.cast(SqlColumn.create('value'), 'VARCHAR');

      const keyValues = SqlKeyValue.short(userId, valueAsVarchar);

      expect(SqlFunction.jsonObject(keyValues).toString()).toEqual(
        'JSON_OBJECT("user" || "id":CAST("value" AS VARCHAR))',
      );
    });
  });

  describe('.floor', () => {
    it('works', () => {
      expect(SqlFunction.floor(SqlColumn.create('__time'), 'Hour').toString()).toEqual(
        'FLOOR("__time" TO Hour)',
      );
    });
  });

  describe('.timeFloor', () => {
    it('drops the trailing arguments that are not given', () => {
      expect(SqlFunction.timeFloor(SqlColumn.create('__time'), 'PT1H').toString()).toEqual(
        `TIME_FLOOR("__time", 'PT1H')`,
      );
      expect(
        SqlFunction.timeFloor(SqlColumn.create('__time'), 'PT1H', undefined, 'Etc/UTC').toString(),
      ).toEqual(`TIME_FLOOR("__time", 'PT1H', NULL, 'Etc/UTC')`);
    });
  });

  describe('.timeCeil', () => {
    it('creates a TIME_CEIL', () => {
      expect(
        SqlFunction.timeCeil(SqlColumn.create('__time'), 'P1D', '2020-01-01', 'UTC').toString(),
      ).toEqual(`TIME_CEIL("__time", 'P1D', '2020-01-01', 'UTC')`);
    });
  });

  describe('.timeShift', () => {
    it('works', () => {
      // Test with all parameters
      expect(SqlFunction.timeShift(SqlColumn.create('__time'), 'P1D', 1, 'UTC').toString()).toEqual(
        "TIME_SHIFT(\"__time\", 'P1D', 1, 'UTC')",
      );

      // Test with missing timezone
      expect(SqlFunction.timeShift(SqlColumn.create('__time'), 'P1D', 1).toString()).toEqual(
        'TIME_SHIFT("__time", \'P1D\', 1)',
      );

      // Test with zero step
      expect(SqlFunction.timeShift(SqlColumn.create('__time'), 'P1D', 0).toString()).toEqual(
        'TIME_SHIFT("__time", \'P1D\', 0)',
      );
    });
  });

  describe('.array', () => {
    it('works', () => {
      expect(SqlFunction.array().toString()).toEqual(`ARRAY[]`);
      expect(SqlFunction.array('a', 'b', 'c').toString()).toEqual(`ARRAY['a', 'b', 'c']`);
      expect(SqlFunction.array(1, 2, 3).toString()).toEqual(`ARRAY[1, 2, 3]`);
      expect(
        SqlFunction.array(SqlColumn.create('col1'), SqlColumn.create('col2')).toString(),
      ).toEqual(`ARRAY["col1", "col2"]`);

      // Test the backward compatibility case
      expect(SqlFunction.array([] as any).toString()).toEqual(`ARRAY[]`);
      expect(SqlFunction.array(['x', 'y', 'z'] as any).toString()).toEqual(`ARRAY['x', 'y', 'z']`);
    });
  });

  describe('.stringFormat', () => {
    it('puts the format first', () => {
      expect(SqlFunction.stringFormat('%s-%d', SqlColumn.create('x'), 3).toString()).toEqual(
        `STRING_FORMAT('%s-%d', "x", 3)`,
      );
    });
  });

  describe('.regexpLike', () => {
    it('creates a REGEXP_LIKE', () => {
      expect(SqlFunction.regexpLike(SqlColumn.create('x'), '^a').toString()).toEqual(
        `REGEXP_LIKE("x", '^a')`,
      );
    });
  });

  describe('.arrayOfLiterals', () => {
    it('works', () => {
      expect(SqlFunction.arrayOfLiterals(['a', 'b', 'c']).toString()).toEqual(
        `ARRAY['a', 'b', 'c']`,
      );
    });
  });

  describe('#changeNamespace', () => {
    it('adds a namespace', () => {
      const fn = SqlExpression.parse(`FOO(1)`) as SqlFunction;

      expect(fn.changeNamespace(SqlNamespace.create('ns')).toString()).toEqual('"ns".FOO(1)');
    });

    it('removes the namespace and its spacing', () => {
      const fn = SqlExpression.parse(`ns . FOO(1)`) as SqlFunction;

      const changed = fn.changeNamespace(undefined);
      expect(changed.namespace).toBeUndefined();
      expect(changed.toString()).toEqual('FOO(1)');
    });
  });

  describe('#getNamespaceName', () => {
    it('returns the namespace name if there is one', () => {
      expect((SqlExpression.parse(`ns.FOO(1)`) as SqlFunction).getNamespaceName()).toEqual('ns');
      expect((SqlExpression.parse(`FOO(1)`) as SqlFunction).getNamespaceName()).toBeUndefined();
    });
  });

  describe('#changeNamespaceName', () => {
    it('renames, adds and removes the namespace', () => {
      const withNs = SqlExpression.parse(`ns.FOO(1)`) as SqlFunction;
      const withoutNs = SqlExpression.parse(`FOO(1)`) as SqlFunction;

      expect(withNs.changeNamespaceName('other').toString()).toEqual('other.FOO(1)');
      expect(withoutNs.changeNamespaceName('other').toString()).toEqual('"other".FOO(1)');
      expect(withNs.changeNamespaceName(undefined).toString()).toEqual('FOO(1)');
    });
  });

  describe('#getEffectiveFunctionName', () => {
    it('upper cases the name', () => {
      expect((SqlExpression.parse(`sum(x)`) as SqlFunction).getEffectiveFunctionName()).toEqual(
        'SUM',
      );
    });
  });

  describe('#getEffectiveDecorator', () => {
    it('upper cases the decorator', () => {
      expect(
        (SqlExpression.parse(`count(distinct x)`) as SqlFunction).getEffectiveDecorator(),
      ).toEqual('DISTINCT');
      expect(
        (SqlExpression.parse(`count(x)`) as SqlFunction).getEffectiveDecorator(),
      ).toBeUndefined();
    });
  });

  describe('#changeArgs', () => {
    it('replaces the args', () => {
      const fn = SqlExpression.parse(`FOO(1,  2)`) as SqlFunction;

      expect(fn.changeArgs(SeparatedArray.fromArray([SqlLiteral.create(3)])).toString()).toEqual(
        'FOO(3)',
      );
    });
  });

  describe('#changeArg', () => {
    it('replaces one arg', () => {
      const fn = SqlExpression.parse(`FOO(1,  2)`) as SqlFunction;

      expect(fn.changeArg(1, SqlLiteral.create(3)).toString()).toEqual('FOO(1,  3)');
    });

    it('does nothing when there are no args', () => {
      const fn = SqlExpression.parse(`CURRENT_TIMESTAMP`) as SqlFunction;

      expect(fn.changeArg(0, SqlLiteral.create(3))).toBe(fn);
    });
  });

  describe('#numArgs', () => {
    it('counts the args', () => {
      expect((SqlExpression.parse(`FOO(1, x => 2)`) as SqlFunction).numArgs()).toEqual(2);
      expect((SqlExpression.parse(`CURRENT_TIMESTAMP`) as SqlFunction).numArgs()).toEqual(0);
    });
  });

  describe('#numPositionalArgs', () => {
    it('counts the args without labels', () => {
      expect((SqlExpression.parse(`FOO(1, 2, x => 3)`) as SqlFunction).numPositionalArgs()).toEqual(
        2,
      );
      expect((SqlExpression.parse(`CURRENT_TIMESTAMP`) as SqlFunction).numPositionalArgs()).toEqual(
        0,
      );
    });
  });

  describe('#numLabeledArgs', () => {
    it('counts the args with labels', () => {
      expect((SqlExpression.parse(`FOO(1, 2, x => 3)`) as SqlFunction).numLabeledArgs()).toEqual(1);
      expect((SqlExpression.parse(`CURRENT_TIMESTAMP`) as SqlFunction).numLabeledArgs()).toEqual(0);
    });
  });

  describe('#getArgArray', () => {
    it('returns the args or an empty array', () => {
      expect((SqlExpression.parse(`FOO(1, a)`) as SqlFunction).getArgArray().map(String)).toEqual([
        '1',
        'a',
      ]);
      expect((SqlExpression.parse(`CURRENT_TIMESTAMP`) as SqlFunction).getArgArray()).toEqual([]);
    });
  });

  describe('#getArg', () => {
    const fn = SqlExpression.parse(`BLAH(t."lol", 1, hello => "world")`) as SqlFunction;

    it('works with number', () => {
      expect(String(fn.getArg(0))).toEqual(`t."lol"`);
      expect(String(fn.getArg(1))).toEqual(`1`);
      expect(String(fn.getArg(-1))).toEqual(`hello => "world"`);
      expect(fn.getArg(7)).toBeUndefined();
    });

    it('works with label', () => {
      expect(String(fn.getArg('hello'))).toEqual(`"world"`);
      expect(fn.getArg('blah')).toBeUndefined();
    });

    it('returns undefined when there are no args', () => {
      expect((SqlExpression.parse(`CURRENT_TIMESTAMP`) as SqlFunction).getArg(0)).toBeUndefined();
    });
  });

  describe('#getArgAsString', () => {
    const fn = SqlExpression.parse(`FOO('a', 1, x, s => 'b')`) as SqlFunction;

    it('returns string literal args', () => {
      expect(fn.getArgAsString(0)).toEqual('a');
      expect(fn.getArgAsString('s')).toEqual('b');
    });

    it('returns undefined for anything else', () => {
      expect(fn.getArgAsString(1)).toBeUndefined();
      expect(fn.getArgAsString(2)).toBeUndefined();
    });
  });

  describe('#getArgAsNumber', () => {
    const fn = SqlExpression.parse(`FOO(1, 'a', x)`) as SqlFunction;

    it('returns number literal args', () => {
      expect(fn.getArgAsNumber(0)).toEqual(1);
    });

    it('returns undefined for anything else', () => {
      expect(fn.getArgAsNumber(1)).toBeUndefined();
      expect(fn.getArgAsNumber(2)).toBeUndefined();
    });
  });

  describe('#getArgAsNumberOrBigint', () => {
    const fn = SqlExpression.parse(`FOO(1, 1606832560494517248, x)`) as SqlFunction;

    it('returns number and bigint literal args', () => {
      expect(fn.getArgAsNumberOrBigint(0)).toEqual(1);
      expect(fn.getArgAsNumberOrBigint(1)).toEqual(BigInt('1606832560494517248'));
    });

    it('returns undefined for anything else', () => {
      expect(fn.getArgAsNumberOrBigint(2)).toBeUndefined();
    });
  });

  describe('#changeWhereClause', () => {
    it('sets the where clause', () => {
      const fn = SqlExpression.parse(`SUM(x)`) as SqlFunction;

      expect(
        fn
          .changeWhereClause(SqlWhereClause.createForFunction(SqlExpression.parse('y = 1')))
          .toString(),
      ).toEqual('SUM(x) FILTER (WHERE y = 1)');
    });

    it('removes the where clause and its FILTER keyword', () => {
      const fn = SqlExpression.parse(`SUM(x) filter (WHERE y = 1)`) as SqlFunction;

      const changed = fn.changeWhereClause(undefined);
      expect(changed.keywords).toEqual({});
      expect(changed.toString()).toEqual('SUM(x)');
      expect(
        changed
          .changeWhereClause(SqlWhereClause.createForFunction(SqlExpression.parse('z')))
          .toString(),
      ).toEqual('SUM(x) FILTER (WHERE z)');
    });
  });

  describe('#changeWhereExpression', () => {
    it('changes', () => {
      const fn = SqlExpression.parse(
        `SUM(t."lol") FILTER (WHERE t."country" = 'USA')`,
      ) as SqlFunction;

      expect(String(fn.changeWhereExpression(SqlExpression.parse(`t."country" = 'UK'`)))).toEqual(
        'SUM(t."lol") FILTER (WHERE t."country" = \'UK\')',
      );
    });

    it('adds', () => {
      const fn = SqlExpression.parse(`SUM(t."lol")`) as SqlFunction;

      expect(String(fn.changeWhereExpression(SqlExpression.parse(`t."country" = 'UK'`)))).toEqual(
        'SUM(t."lol") FILTER (WHERE t."country" = \'UK\')',
      );
    });

    it('removes the filter when given nothing or TRUE', () => {
      const fn = SqlExpression.parse(`SUM(x) FILTER (WHERE y = 1)`) as SqlFunction;

      expect(String(fn.changeWhereExpression(undefined))).toEqual('SUM(x)');
      expect(String(fn.changeWhereExpression(SqlLiteral.TRUE))).toEqual('SUM(x)');
    });

    it('returns the same instance when the expression is unchanged', () => {
      const fn = SqlExpression.parse(`SUM(x) FILTER (WHERE y = 1)`) as SqlFunction;

      expect(fn.changeWhereExpression(fn.getWhereExpression())).toBe(fn);
    });
  });

  describe('#addWhere', () => {
    it('adds when something already exists', () => {
      const fn = SqlExpression.parse(
        `SUM(t."lol") FILTER (WHERE t."country" = 'USA' OR t."city" = 'SF')`,
      ) as SqlFunction;

      expect(String(fn.addWhere(SqlExpression.parse(`t."browser" = 'Chrome'`)))).toEqual(
        `SUM(t."lol") FILTER (WHERE (t."country" = 'USA' OR t."city" = 'SF') AND t."browser" = 'Chrome')`,
      );
    });

    it('adds when nothing exists', () => {
      const fn = SqlExpression.parse(`SUM(t."lol")`) as SqlFunction;

      expect(
        String(fn.changeWhereExpression(SqlExpression.parse(`t."browser" = 'Chrome'`))),
      ).toEqual('SUM(t."lol") FILTER (WHERE t."browser" = \'Chrome\')');
    });

    it('noop on NULL', () => {
      const fn = SqlExpression.parse(`SUM(t."lol")`) as SqlFunction;

      expect(String(fn.addWhere(SqlExpression.parse(`TRUE`)))).toEqual('SUM(t."lol")');
    });

    it('returns the same instance when given nothing', () => {
      const fn = SqlExpression.parse(`SUM(x)`) as SqlFunction;

      expect(fn.addWhere()).toBe(fn);
    });
  });

  describe('#addWhereExpression', () => {
    it('adds to the filter', () => {
      const fn = SqlExpression.parse(`SUM(x) FILTER (WHERE y = 1)`) as SqlFunction;

      expect(String(fn.addWhereExpression(SqlExpression.parse('z = 2')))).toEqual(
        'SUM(x) FILTER (WHERE y = 1 AND z = 2)',
      );
    });
  });

  describe('#getWhereExpression', () => {
    it('returns the filter expression if there is one', () => {
      expect(
        String(
          (SqlExpression.parse(`SUM(x) FILTER (WHERE y = 1)`) as SqlFunction).getWhereExpression(),
        ),
      ).toEqual('y = 1');
      expect((SqlExpression.parse(`SUM(x)`) as SqlFunction).getWhereExpression()).toBeUndefined();
    });
  });

  describe('#getEffectiveWhereExpression', () => {
    it('falls back to TRUE', () => {
      expect(
        String(
          (
            SqlExpression.parse(`SUM(x) FILTER (WHERE y = 1)`) as SqlFunction
          ).getEffectiveWhereExpression(),
        ),
      ).toEqual('y = 1');
      expect((SqlExpression.parse(`SUM(x)`) as SqlFunction).getEffectiveWhereExpression()).toBe(
        SqlLiteral.TRUE,
      );
    });
  });

  describe('#changeExtendClause', () => {
    it('sets the extend clause', () => {
      const fn = SqlExpression.parse(`TABLE(x)`) as SqlFunction;

      expect(
        fn
          .changeExtendClause(SqlExtendClause.create([SqlColumnDeclaration.create('a', 'VARCHAR')]))
          .toString(),
      ).toEqual('TABLE(x) EXTEND ("a" VARCHAR)');
    });

    it('removes the extend clause and its spacing', () => {
      const fn = SqlExpression.parse(`TABLE(x)   EXTEND (a VARCHAR)`) as SqlFunction;

      expect(fn.changeExtendClause(undefined).toString()).toEqual('TABLE(x)');
    });
  });

  describe('#isAggregation', () => {
    it('is true for known aggregations and filtered functions', () => {
      expect((SqlExpression.parse(`sum(x)`) as SqlFunction).isAggregation(['SUM'])).toEqual(true);
      expect((SqlExpression.parse(`FOO(x)`) as SqlFunction).isAggregation(['SUM'])).toEqual(false);
      expect(
        (SqlExpression.parse(`FOO(x) FILTER (WHERE y)`) as SqlFunction).isAggregation(['SUM']),
      ).toEqual(true);
    });
  });

  describe('#clearOwnSeparators', () => {
    it('is smart about clearing separators', () => {
      const sql = `EXTRACT(HOUR FROM "time")`;
      expect(String(SqlExpression.parse(sql).clearOwnSeparators())).toEqual(sql);
    });

    it('clears comma spacing', () => {
      expect(String(SqlExpression.parse(`FOO(1 ,2,   3)`).clearOwnSeparators())).toEqual(
        'FOO(1, 2, 3)',
      );
    });

    it('returns the same instance when there are no args', () => {
      const fn = SqlExpression.parse(`CURRENT_TIMESTAMP`);

      expect(fn.clearOwnSeparators()).toBe(fn);
    });
  });

  describe('#resetOwnKeywords', () => {
    it('upper cases the function name and resets the keywords', () => {
      expect(
        SqlExpression.parse(`sum(x) filter (where y = 1)`).resetOwnKeywords().toString(),
      ).toEqual('SUM(x) FILTER (where y = 1)');
    });

    it('returns the same instance when there is nothing to reset', () => {
      const fn = SqlExpression.parse(`SUM(x)`);

      expect(fn.resetOwnKeywords()).toBe(fn);
    });
  });

  describe('#isCountStar', () => {
    it('is true only for COUNT(*)', () => {
      expect((SqlExpression.parse(`count(*)`) as SqlFunction).isCountStar()).toEqual(true);
      expect((SqlExpression.parse(`COUNT(x)`) as SqlFunction).isCountStar()).toEqual(false);
      expect((SqlExpression.parse(`COUNT()`) as SqlFunction).isCountStar()).toEqual(false);
      expect(SqlFunction.simple('SUM', [SqlStar.PLAIN]).isCountStar()).toEqual(false);
    });
  });

  describe('#getCastType', () => {
    it('returns the type of a CAST', () => {
      const castType = (SqlExpression.parse(`CAST(x AS BIGINT)`) as SqlFunction).getCastType();

      expect(castType).toBeInstanceOf(SqlType);
      expect(String(castType)).toEqual('BIGINT');
    });

    it('returns undefined for other functions', () => {
      expect((SqlExpression.parse(`FOO(x, y)`) as SqlFunction).getCastType()).toBeUndefined();
    });
  });

  describe('#getColumnDeclarations', () => {
    it('returns the declarations of the extend clause', () => {
      expect(
        (SqlExpression.parse(`TABLE(x) EXTEND (a VARCHAR, b BIGINT)`) as SqlFunction)
          .getColumnDeclarations()
          ?.map(String),
      ).toEqual(['a VARCHAR', 'b BIGINT']);
      expect(
        (SqlExpression.parse(`TABLE(x)`) as SqlFunction).getColumnDeclarations(),
      ).toBeUndefined();
    });
  });

  describe('#changeColumnDeclarations', () => {
    it('creates, changes and removes the extend clause', () => {
      const fn = SqlExpression.parse(`TABLE(x)`) as SqlFunction;
      const declarations = [SqlColumnDeclaration.create('a', 'VARCHAR')];

      const withExtend = fn.changeColumnDeclarations(declarations);
      expect(withExtend.toString()).toEqual('TABLE(x) EXTEND ("a" VARCHAR)');

      expect(
        withExtend
          .changeColumnDeclarations([SqlColumnDeclaration.create('b', 'BIGINT')])
          .toString(),
      ).toEqual('TABLE(x) EXTEND ("b" BIGINT)');

      expect(withExtend.changeColumnDeclarations(undefined).toString()).toEqual('TABLE(x)');
    });
  });

  describe('#walk', () => {
    it('substitutes in the args, the filter and the extend clause', () => {
      const fn = SqlExpression.parse(`SUM(a) FILTER (WHERE b = 1)`);

      expect(
        fn
          .walk(ex => (ex instanceof SqlColumn ? SqlColumn.optionalQuotes(ex.getName() + '1') : ex))
          .toString(),
      ).toEqual('SUM(a1) FILTER (WHERE b1 = 1)');
    });

    it('walks into the extend clause', () => {
      const fn = SqlExpression.parse(`TABLE(x) EXTEND (a VARCHAR)`);

      expect(
        fn
          .walk(ex =>
            ex instanceof SqlColumnDeclaration ? SqlColumnDeclaration.create('b', 'BIGINT') : ex,
          )
          .toString(),
      ).toEqual('TABLE(x) EXTEND ("b" BIGINT)');
    });

    it('keeps the same instance when nothing changes', () => {
      const fn = SqlExpression.parse(`TABLE(x) EXTEND (a VARCHAR)`);
      const filtered = SqlExpression.parse(`SUM(a) FILTER (WHERE b = 1)`);

      expect(fn.walk(ex => ex)).toBe(fn);
      expect(filtered.walk(ex => ex)).toBe(filtered);
    });

    it('stops when the callback returns nothing for a part', () => {
      const stopOn = (predicate: (ex: SqlExpression) => boolean) => (ex: any) =>
        predicate(ex) ? undefined : ex;

      const filtered = SqlExpression.parse(`SUM(a) FILTER (WHERE b = 1)`);
      expect(filtered.walkPostorder(stopOn(ex => String(ex) === 'a'))).toBe(filtered);
      expect(filtered.walkPostorder(stopOn(ex => ex instanceof SqlWhereClause))).toBe(filtered);

      const extended = SqlExpression.parse(`TABLE(x) EXTEND (a VARCHAR)`);
      expect(extended.walkPostorder(stopOn(ex => ex instanceof SqlExtendClause))).toBe(extended);
    });
  });
});
