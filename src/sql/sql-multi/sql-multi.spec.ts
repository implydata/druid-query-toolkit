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

import { SeparatedArray, SqlColumn, SqlExpression, SqlLiteral, SqlMulti } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlMulti', () => {
  describe('parses', () => {
    describe('OR', () => {
      it('single expression with unquoted string', () => {
        const sql = `A OR B`;

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
        "op": "OR",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });

      it('single expression with single quoted string', () => {
        const sql = `'A' OR 'B'`;

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
            SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "'A'",
              "type": "literal",
              "value": "A",
            },
            SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "'B'",
              "type": "literal",
              "value": "B",
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

      it('single expression with double quoted string', () => {
        const sql = `"A" OR "B"`;

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
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "A",
                "quotes": true,
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
                "quotes": true,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
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

      it('single expression with numbers', () => {
        const sql = `1 OR 2`;

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
        "op": "OR",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });

      it('brackets', () => {
        const sql = `(1 OR 2)`;

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
        "op": "OR",
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });

      it('strange spacing', () => {
        const sql = `1   OR 2`;

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "   ",
              "right": " ",
              "separator": "OR",
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
        "op": "OR",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });

      it('strange spacing and brackets', () => {
        const sql = `( 1   OR 2 )`;

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "   ",
              "right": " ",
              "separator": "OR",
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
        "op": "OR",
        "parens": Array [
          Object {
            "leftSpacing": " ",
            "rightSpacing": " ",
          },
        ],
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });
    });

    describe('AND', () => {
      it('single expression with unquoted string', () => {
        const sql = `A AND B`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
      }
    `);
      });

      it('single expression with single quoted string', () => {
        const sql = `'A' AND 'B'`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
            SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "'A'",
              "type": "literal",
              "value": "A",
            },
            SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "'B'",
              "type": "literal",
              "value": "B",
            },
          ],
        },
        "keywords": Object {},
        "op": "AND",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });

      it('single expression with double quoted string', () => {
        const sql = `"A" AND "B"`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "A",
                "quotes": true,
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
                "quotes": true,
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
      }
    `);
      });

      it('single expression with numbers', () => {
        const sql = `1 AND 2`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
        "op": "AND",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });

      it('brackets', () => {
        const sql = `(1 AND 2)`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
        "op": "AND",
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });
    });

    describe('math', () => {
      it('addition', () => {
        const sql = `1 + 2`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
      }
    `);
      });

      it('subtraction', () => {
        const sql = `1 - 2`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "-",
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
        "op": "-",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });

      it('multiplication', () => {
        const sql = `1 * 2`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
        "op": "*",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });

      it('division', () => {
        const sql = `1 / 2`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "/",
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
        "op": "/",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });

      it('single expression with unquoted string', () => {
        const sql = `A + B`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
        "op": "+",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });

      it('single expression with single quoted string', () => {
        const sql = `'A' + 'B'`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "stringValue": "'A'",
              "type": "literal",
              "value": "A",
            },
            SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "'B'",
              "type": "literal",
              "value": "B",
            },
          ],
        },
        "keywords": Object {},
        "op": "+",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });

      it('single expression with double quoted string', () => {
        const sql = `"A" + "B"`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "A",
                "quotes": true,
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
                "quotes": true,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
          ],
        },
        "keywords": Object {},
        "op": "+",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });

      it('single expression with numbers', () => {
        const sql = `1 + 2`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
      }
    `);
      });

      it('brackets', () => {
        const sql = `(1 + 2)`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });

      it('decimal', () => {
        const sql = `COUNT(*) * 1.0 / COUNT(*)`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
            SqlMulti {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "/",
                  },
                ],
                "values": Array [
                  SqlLiteral {
                    "keywords": Object {},
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "1.0",
                    "type": "literal",
                    "value": 1,
                  },
                  SqlFunction {
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
                ],
              },
              "keywords": Object {},
              "op": "/",
              "parens": undefined,
              "spacing": Object {},
              "type": "multi",
            },
          ],
        },
        "keywords": Object {},
        "op": "*",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
      });
    });

    describe('combined', () => {
      it('every expression', () => {
        const sql = `A OR B AND C > D + E`;

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
                  SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": ">",
                    },
                    "lhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "C",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "op": ">",
                    "parens": undefined,
                    "rhs": SqlMulti {
                      "args": SeparatedArray {
                        "separators": Array [
                          Separator {
                            "left": " ",
                            "right": " ",
                            "separator": "+",
                          },
                        ],
                        "values": Array [
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
                          SqlColumn {
                            "keywords": Object {},
                            "parens": undefined,
                            "refName": RefName {
                              "name": "E",
                              "quotes": false,
                            },
                            "spacing": Object {},
                            "table": undefined,
                            "type": "column",
                          },
                        ],
                      },
                      "keywords": Object {},
                      "op": "+",
                      "parens": undefined,
                      "spacing": Object {},
                      "type": "multi",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
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

      it('every expression out of order', () => {
        const sql = `A + B > C AND D OR E`;

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
                  SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": ">",
                    },
                    "lhs": SqlMulti {
                      "args": SeparatedArray {
                        "separators": Array [
                          Separator {
                            "left": " ",
                            "right": " ",
                            "separator": "+",
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
                      "op": "+",
                      "parens": undefined,
                      "spacing": Object {},
                      "type": "multi",
                    },
                    "op": ">",
                    "parens": undefined,
                    "rhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "C",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
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
                "name": "E",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
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

      it('every expression in another order', () => {
        const sql = `A AND B > C + D OR E`;

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
                  SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": ">",
                    },
                    "lhs": SqlColumn {
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
                    "op": ">",
                    "parens": undefined,
                    "rhs": SqlMulti {
                      "args": SeparatedArray {
                        "separators": Array [
                          Separator {
                            "left": " ",
                            "right": " ",
                            "separator": "+",
                          },
                        ],
                        "values": Array [
                          SqlColumn {
                            "keywords": Object {},
                            "parens": undefined,
                            "refName": RefName {
                              "name": "C",
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
                              "name": "D",
                              "quotes": false,
                            },
                            "spacing": Object {},
                            "table": undefined,
                            "type": "column",
                          },
                        ],
                      },
                      "keywords": Object {},
                      "op": "+",
                      "parens": undefined,
                      "spacing": Object {},
                      "type": "multi",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
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
                "name": "E",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
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
    });

    describe('multiple expressions', () => {
      it('multiple ORs', () => {
        const sql = `A OR B OR C`;

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
            Separator {
              "left": " ",
              "right": " ",
              "separator": "OR",
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
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "C",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
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

      it('multiple ANDs and ORs', () => {
        const sql = `A AND B OR C AND D OR E`;

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
            Separator {
              "left": " ",
              "right": " ",
              "separator": "OR",
            },
          ],
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
                  SqlColumn {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "C",
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
                      "name": "D",
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
                "name": "E",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
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
    });

    describe('brackets', () => {
      it('changing order of operations', () => {
        const sql = `(A AND b) OR c`;

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
                      "name": "b",
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
              "parens": Array [
                Object {
                  "leftSpacing": "",
                  "rightSpacing": "",
                },
              ],
              "spacing": Object {},
              "type": "multi",
            },
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
        "keywords": Object {},
        "op": "OR",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);

        backAndForth(sql);
      });

      it('wrapping expression', () => {
        const sql = `((A + b) OR c)`;

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
                      "name": "b",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "table": undefined,
                    "type": "column",
                  },
                ],
              },
              "keywords": Object {},
              "op": "+",
              "parens": Array [
                Object {
                  "leftSpacing": "",
                  "rightSpacing": "",
                },
              ],
              "spacing": Object {},
              "type": "multi",
            },
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
        "keywords": Object {},
        "op": "OR",
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "spacing": Object {},
        "type": "multi",
      }
    `);

        backAndForth(sql);
      });

      it('changing order of operations with NOT', () => {
        const sql = `NOT NOT (A + b) OR c`;

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
            SqlUnary {
              "argument": SqlUnary {
                "argument": SqlMulti {
                  "args": SeparatedArray {
                    "separators": Array [
                      Separator {
                        "left": " ",
                        "right": " ",
                        "separator": "+",
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
                          "name": "b",
                          "quotes": false,
                        },
                        "spacing": Object {},
                        "table": undefined,
                        "type": "column",
                      },
                    ],
                  },
                  "keywords": Object {},
                  "op": "+",
                  "parens": Array [
                    Object {
                      "leftSpacing": "",
                      "rightSpacing": "",
                    },
                  ],
                  "spacing": Object {},
                  "type": "multi",
                },
                "keywords": Object {
                  "op": "NOT",
                },
                "op": "NOT",
                "parens": undefined,
                "spacing": Object {
                  "postOp": " ",
                },
                "type": "unary",
              },
              "keywords": Object {
                "op": "NOT",
              },
              "op": "NOT",
              "parens": undefined,
              "spacing": Object {
                "postOp": " ",
              },
              "type": "unary",
            },
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
        "keywords": Object {},
        "op": "OR",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);

        backAndForth(sql);
      });
    });
  });

  describe('.create', () => {
    it('creates a multi expression from an array', () => {
      const multi = SqlMulti.create('+', [SqlColumn.create('a'), SqlLiteral.create(1)]);

      expect(multi.toString()).toEqual(`"a" + 1`);
    });

    it('puts AND / OR on separate lines when there are more than three args', () => {
      const args = ['a', 'b', 'c', 'd'].map(n => SqlColumn.optionalQuotes(n));

      expect(SqlMulti.create('AND', args.slice(0, 3)).toString()).toEqual(`a AND b AND c`);
      expect(SqlMulti.create('OR', args).toString()).toEqual(`a\n  OR b\n  OR c\n  OR d`);
      expect(SqlMulti.create('+', args).toString()).toEqual(`a + b + c + d`);
    });
  });

  describe('.createIfNeeded', () => {
    it('returns the neutral element when there are no args', () => {
      expect(SqlMulti.createIfNeeded('AND', []).toString()).toEqual('TRUE');
      expect(SqlMulti.createIfNeeded('OR', []).toString()).toEqual('FALSE');
      expect(SqlMulti.createIfNeeded('||', []).toString()).toEqual(`''`);
      expect(SqlMulti.createIfNeeded('+', []).toString()).toEqual('0.0');
      expect(SqlMulti.createIfNeeded('-', []).toString()).toEqual('0.0');
      expect(SqlMulti.createIfNeeded('*', []).toString()).toEqual('1.0');
      expect(SqlMulti.createIfNeeded('/', []).toString()).toEqual('1.0');
    });

    it('returns the only arg when there is one', () => {
      const a = SqlColumn.optionalQuotes('a');

      expect(SqlMulti.createIfNeeded('AND', [a])).toBe(a);
    });

    it('creates a multi expression when there are several args', () => {
      const multi = SqlMulti.createIfNeeded('AND', [
        SqlColumn.optionalQuotes('a'),
        SqlColumn.optionalQuotes('b'),
      ]);

      expect(multi).toBeInstanceOf(SqlMulti);
      expect(multi.toString()).toEqual(`a AND b`);
    });
  });

  describe('constructor', () => {
    it('throws without an op or args', () => {
      expect(
        () => new SqlMulti({ args: SeparatedArray.fromSingleValue(SqlLiteral.ZERO) } as any),
      ).toThrow('must have op');
      expect(() => new SqlMulti({ op: 'AND' } as any)).toThrow('must have args');
    });
  });

  describe('#numArgs', () => {
    it('counts the args', () => {
      expect((SqlExpression.parse(`a + b + c`) as SqlMulti).numArgs()).toEqual(3);
    });
  });

  describe('#getArgArray', () => {
    it('returns the args as an array', () => {
      expect((SqlExpression.parse(`a || 'x'`) as SqlMulti).getArgArray().map(String)).toEqual([
        'a',
        `'x'`,
      ]);
    });
  });

  describe('#getArg', () => {
    it('returns the arg at an index', () => {
      const multi = SqlExpression.parse(`a * b`) as SqlMulti;

      expect(String(multi.getArg(1))).toEqual('b');
      expect(multi.getArg(2)).toBeUndefined();
    });
  });

  describe('#changeArgs', () => {
    it('replaces the args', () => {
      const multi = SqlExpression.parse(`a - b`) as SqlMulti;

      expect(
        multi.changeArgs(SeparatedArray.fromArray([SqlColumn.optionalQuotes('c')])).toString(),
      ).toEqual('c');
    });
  });

  describe('#clearOwnSeparators', () => {
    it('drops the custom separators', () => {
      const multi = SqlExpression.parse(`a   AND\n  b`);

      expect(multi.clearOwnSeparators().toString()).toEqual(`a AND b`);
      expect(multi.clearOwnSeparators().args.separators).toEqual([]);
    });

    it('keeps the casing of the operator', () => {
      expect(SqlExpression.parse(`a   and\n  b AND c`).clearOwnSeparators().toString()).toEqual(
        `a and b AND c`,
      );
      expect(SqlExpression.parse(`a Or b OR c or d OR e`).clearOwnSeparators().toString()).toEqual(
        `a\n  Or b\n  OR c\n  or d\n  OR e`,
      );
    });
  });

  describe('#resetOwnKeywords', () => {
    it('resets the casing of the operator and keeps the spacing', () => {
      expect(SqlExpression.parse(`a   and\n  b AND c`).resetOwnKeywords().toString()).toEqual(
        `a   AND\n  b AND c`,
      );
    });

    it('returns the same instance when nothing changes', () => {
      const multi = SqlExpression.parse(`a AND b`);
      expect(multi.resetOwnKeywords()).toBe(multi);
    });
  });

  describe('#flatten', () => {
    it('flattens nested expressions of the same op', () => {
      expect(SqlExpression.parse(`a AND (b AND c) AND (d OR e)`).flatten().toString()).toEqual(
        `a AND b AND c AND (d OR e)`,
      );
    });

    it('does nothing for a different flattening op', () => {
      const multi = SqlExpression.parse(`a OR (b OR c)`);

      expect(multi.flatten('AND')).toBe(multi);
      expect(multi.flatten('OR').toString()).toEqual(`a OR b OR c`);
    });
  });

  describe('#decomposeViaAnd', () => {
    it('returns the whole expression for other ops', () => {
      const multi = SqlExpression.parse(`a OR b`);

      expect(multi.decomposeViaAnd()).toEqual([multi]);
    });

    it('splits on AND and strips parens from the parts', () => {
      expect(SqlExpression.parse(`(a OR b) AND c`).decomposeViaAnd().map(String)).toEqual([
        'a OR b',
        'c',
      ]);
    });

    it('keeps parens when asked', () => {
      expect(
        SqlExpression.parse(`(a OR b) AND c`).decomposeViaAnd({ preserveParens: true }).map(String),
      ).toEqual(['(a OR b)', 'c']);
    });

    it('does not split an AND inside parens', () => {
      expect(SqlExpression.parse(`(a AND b)`).decomposeViaAnd().map(String)).toEqual(['a AND b']);
      expect(
        SqlExpression.parse(`(a AND b)`).decomposeViaAnd({ preserveParens: true }).map(String),
      ).toEqual(['(a AND b)']);
    });

    it('recurses into nested ANDs when flattening', () => {
      expect(
        SqlExpression.parse(`a AND (b AND (c OR d))`)
          .decomposeViaAnd({ flatten: true })
          .map(String),
      ).toEqual(['a', 'b', '(c OR d)']);
    });
  });

  describe('#filterAnd', () => {
    it('keeps only the matching parts of an AND', () => {
      const multi = SqlExpression.parse(`a = 1 AND b = 2 AND c = 3`);

      expect(String(multi.filterAnd(ex => !ex.containsColumnName('b')))).toEqual(`a = 1 AND c = 3`);
    });

    it('unwraps a single remaining part', () => {
      const multi = SqlExpression.parse(`a = 1 AND b = 2`);

      expect(String(multi.filterAnd(ex => ex.containsColumnName('b')))).toEqual(`b = 2`);
    });

    it('returns undefined when nothing is left', () => {
      expect(SqlExpression.parse(`a = 1 AND b = 2`).filterAnd(() => false)).toBeUndefined();
    });

    it('treats other ops as a single unit', () => {
      const multi = SqlExpression.parse(`a = 1 OR b = 2`);

      expect(multi.filterAnd(ex => ex.containsColumnName('a'))).toBe(multi);
      expect(multi.filterAnd(() => false)).toBeUndefined();
    });
  });

  describe('#decomposeViaOr', () => {
    it('returns the whole expression for other ops', () => {
      const multi = SqlExpression.parse(`a AND b`);

      expect(multi.decomposeViaOr()).toEqual([multi]);
    });

    it('splits on OR and strips parens from the parts', () => {
      expect(SqlExpression.parse(`(a AND b) OR c`).decomposeViaOr().map(String)).toEqual([
        'a AND b',
        'c',
      ]);
      expect(
        SqlExpression.parse(`(a AND b) OR c`).decomposeViaOr({ preserveParens: true }).map(String),
      ).toEqual(['(a AND b)', 'c']);
    });

    it('does not split an OR inside parens', () => {
      expect(SqlExpression.parse(`(a OR b)`).decomposeViaOr().map(String)).toEqual(['a OR b']);
      expect(
        SqlExpression.parse(`(a OR b)`).decomposeViaOr({ preserveParens: true }).map(String),
      ).toEqual(['(a OR b)']);
    });

    it('recurses into nested ORs when flattening', () => {
      expect(
        SqlExpression.parse(`a OR (b OR (c AND d))`).decomposeViaOr({ flatten: true }).map(String),
      ).toEqual(['a', 'b', '(c AND d)']);
    });
  });

  describe('#flattenIfNeeded', () => {
    it('returns the args when the op matches', () => {
      const multi = SqlExpression.parse(`a AND b`) as SqlMulti;

      expect(multi.flattenIfNeeded('AND')).toEqual(multi.getArgArray());
    });

    it('returns itself when the op matches but it has parens', () => {
      const multi = SqlExpression.parse(`(a AND b)`) as SqlMulti;

      expect(multi.flattenIfNeeded('AND')).toBe(multi);
    });

    it('adds parens when the op differs', () => {
      const multi = SqlExpression.parse(`a OR b`) as SqlMulti;

      expect(String(multi.flattenIfNeeded('AND'))).toEqual(`(a OR b)`);
    });
  });

  describe('#walk', () => {
    it('substitutes the args', () => {
      expect(
        SqlExpression.parse(`a + b`)
          .walk(ex => (ex instanceof SqlColumn ? SqlLiteral.create(1) : ex))
          .toString(),
      ).toEqual(`1 + 1`);
    });

    it('keeps the same instance when nothing changes', () => {
      const multi = SqlExpression.parse(`a + b`);

      expect(multi.walk(ex => ex)).toBe(multi);
    });

    it('stops when the callback returns nothing for an arg', () => {
      const multi = SqlExpression.parse(`a + b`);

      expect(multi.walkPostorder(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(multi);
    });
  });

  describe('#getColumns', () => {
    it('only multi expressions', () => {
      const sql = `A > 1 AND D OR B OR C`;

      expect(SqlExpression.parse(sql).getColumns()).toMatchInlineSnapshot(`
      Array [
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
            "name": "D",
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
        SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "C",
            "quotes": false,
          },
          "spacing": Object {},
          "table": undefined,
          "type": "column",
        },
      ]
    `);
    });

    it('includes unary expressions', () => {
      const sql = `A > 1 AND D OR B OR Not C`;

      expect(SqlExpression.parse(sql).getColumns()).toMatchInlineSnapshot(`
      Array [
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
            "name": "D",
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
        SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "C",
            "quotes": false,
          },
          "spacing": Object {},
          "table": undefined,
          "type": "column",
        },
      ]
    `);
    });

    it('includes unary expressions and nested Multi Expressions', () => {
      const sql = `A > 1 AND D OR B OR Not (C Or E)`;

      expect(SqlExpression.parse(sql).getColumns()).toMatchInlineSnapshot(`
      Array [
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
            "name": "D",
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
        SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "C",
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
            "name": "E",
            "quotes": false,
          },
          "spacing": Object {},
          "table": undefined,
          "type": "column",
        },
      ]
    `);
    });

    it('concat function', () => {
      const sql = `A || B || C`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "||",
            },
            Separator {
              "left": " ",
              "right": " ",
              "separator": "||",
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
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "C",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
          ],
        },
        "keywords": Object {},
        "op": "||",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
    });

    it('IS function', () => {
      const sql = `X IS NULL`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "IS",
        },
        "lhs": SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "X",
            "quotes": false,
          },
          "spacing": Object {},
          "table": undefined,
          "type": "column",
        },
        "op": "IS",
        "parens": undefined,
        "rhs": SqlLiteral {
          "keywords": Object {},
          "parens": undefined,
          "spacing": Object {},
          "stringValue": "NULL",
          "type": "literal",
          "value": null,
        },
        "spacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
    });

    it('IS NOT NULL', () => {
      const sql = `X IS NOT NULL`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "IS NOT",
        },
        "lhs": SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "X",
            "quotes": false,
          },
          "spacing": Object {},
          "table": undefined,
          "type": "column",
        },
        "op": "IS NOT",
        "parens": undefined,
        "rhs": SqlLiteral {
          "keywords": Object {},
          "parens": undefined,
          "spacing": Object {},
          "stringValue": "NULL",
          "type": "literal",
          "value": null,
        },
        "spacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
    });

    it('IS NOT TRUE', () => {
      const sql = `X IS NOT TRUE`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "IS NOT",
        },
        "lhs": SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "X",
            "quotes": false,
          },
          "spacing": Object {},
          "table": undefined,
          "type": "column",
        },
        "op": "IS NOT",
        "parens": undefined,
        "rhs": SqlLiteral {
          "keywords": Object {},
          "parens": undefined,
          "spacing": Object {},
          "stringValue": "TRUE",
          "type": "literal",
          "value": true,
        },
        "spacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
    });

    it('nested IS NOT function', () => {
      const sql = `X IS NOT NULL AND X <> ''`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
            SqlComparison {
              "decorator": undefined,
              "keywords": Object {
                "op": "IS NOT",
              },
              "lhs": SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "X",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              "op": "IS NOT",
              "parens": undefined,
              "rhs": SqlLiteral {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "stringValue": "NULL",
                "type": "literal",
                "value": null,
              },
              "spacing": Object {
                "postOp": " ",
                "preOp": " ",
              },
              "type": "comparison",
            },
            SqlComparison {
              "decorator": undefined,
              "keywords": Object {
                "op": "<>",
              },
              "lhs": SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "X",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              "op": "<>",
              "parens": undefined,
              "rhs": SqlLiteral {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "stringValue": "''",
                "type": "literal",
                "value": "",
              },
              "spacing": Object {
                "postOp": " ",
                "preOp": " ",
              },
              "type": "comparison",
            },
          ],
        },
        "keywords": Object {},
        "op": "AND",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
    });
  });

  describe('#containsColumnName', () => {
    it('nested expression', () => {
      const sql = `A > 1 AND D OR B OR C`;

      expect(SqlExpression.parse(sql).containsColumnName('A')).toEqual(true);
    });

    it('nested expression with brackets', () => {
      const sql = `(A + B ) > 1 AND D OR B OR C`;

      expect(SqlExpression.parse(sql).containsColumnName('A')).toEqual(true);
    });

    it('nested expression with brackets without the column', () => {
      const sql = `(D + B ) > 1 AND D OR B OR C`;

      expect(SqlExpression.parse(sql).containsColumnName('A')).toEqual(false);
    });
  });
});
