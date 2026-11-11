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

import { SqlExpression, SqlLiteral, SqlUnary } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlUnary', () => {
  describe('parses', () => {
    it('minus', () => {
      const sql = `-A`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlUnary {
          "argument": SqlColumn {
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
          "keywords": Object {
            "op": "-",
          },
          "op": "-",
          "parens": undefined,
          "spacing": Object {
            "postOp": "",
          },
          "type": "unary",
        }
      `);
    });

    it('minus with whitespace before a number', () => {
      const sql = `- 1`;

      backAndForth(sql, SqlUnary);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlUnary {
          "argument": SqlLiteral {
            "keywords": Object {},
            "parens": undefined,
            "spacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          "keywords": Object {
            "op": "-",
          },
          "op": "-",
          "parens": undefined,
          "spacing": Object {
            "postOp": " ",
          },
          "type": "unary",
        }
      `);
    });

    it('minus of a negative number', () => {
      const sql = `- -1`;

      backAndForth(sql, SqlUnary);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlUnary {
          "argument": SqlLiteral {
            "keywords": Object {},
            "parens": undefined,
            "spacing": Object {},
            "stringValue": "-1",
            "type": "literal",
            "value": -1,
          },
          "keywords": Object {
            "op": "-",
          },
          "op": "-",
          "parens": undefined,
          "spacing": Object {
            "postOp": " ",
          },
          "type": "unary",
        }
      `);
    });

    it.each([
      '+ 1',
      '- 1.5E0',
      '(- 1.5E0)',
      '+-1',
      '- .5',
      '- 1e3',
      '-\n1',
      'x * - 1',
      'x - - 1',
      'NOT - 1',
    ])('sign followed by whitespace or another sign, then a number: %s', sql => {
      backAndForth(sql);
    });

    it('minus directly before a number is a literal', () => {
      backAndForth('-1', SqlLiteral);
      backAndForth('-.5', SqlLiteral);
    });

    it('single not expression', () => {
      const sql = `NOT B`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlUnary {
          "argument": SqlColumn {
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
          "keywords": Object {
            "op": "NOT",
          },
          "op": "NOT",
          "parens": undefined,
          "spacing": Object {
            "postOp": " ",
          },
          "type": "unary",
        }
      `);
    });

    it('double not expression', () => {
      const sql = `NOT not B`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlUnary {
          "argument": SqlUnary {
            "argument": SqlColumn {
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
            "keywords": Object {
              "op": "not",
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
        }
      `);
    });

    it('multiple not expressions', () => {
      const sql = `NOT A AND NOT B AND NOT C`;

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
              Separator {
                "left": " ",
                "right": " ",
                "separator": "AND",
              },
            ],
            "values": Array [
              SqlUnary {
                "argument": SqlColumn {
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
              SqlUnary {
                "argument": SqlColumn {
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
              SqlUnary {
                "argument": SqlColumn {
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

    it('not containing an expression', () => {
      const sql = `NOT A > B`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlUnary {
          "argument": SqlComparison {
            "decorator": undefined,
            "keywords": Object {
              "op": ">",
            },
            "lhs": SqlColumn {
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
            "op": ">",
            "parens": undefined,
            "rhs": SqlColumn {
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
            "spacing": Object {
              "postOp": " ",
              "preOp": " ",
            },
            "type": "comparison",
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
        }
      `);
    });

    it('multiple not expressions containing an expression', () => {
      const sql = `NOT A > B OR Not C = 'D'`;

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
              SqlUnary {
                "argument": SqlComparison {
                  "decorator": undefined,
                  "keywords": Object {
                    "op": ">",
                  },
                  "lhs": SqlColumn {
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
                  "op": ">",
                  "parens": undefined,
                  "rhs": SqlColumn {
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
                  "spacing": Object {
                    "postOp": " ",
                    "preOp": " ",
                  },
                  "type": "comparison",
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
              SqlUnary {
                "argument": SqlComparison {
                  "decorator": undefined,
                  "keywords": Object {
                    "op": "=",
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
                  "op": "=",
                  "parens": undefined,
                  "rhs": SqlLiteral {
                    "keywords": Object {},
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "'D'",
                    "type": "literal",
                    "value": "D",
                  },
                  "spacing": Object {
                    "postOp": " ",
                    "preOp": " ",
                  },
                  "type": "comparison",
                },
                "keywords": Object {
                  "op": "Not",
                },
                "op": "NOT",
                "parens": undefined,
                "spacing": Object {
                  "postOp": " ",
                },
                "type": "unary",
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

    it('nested not expressions', () => {
      const sql = `NOT NOT A > B`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlUnary {
          "argument": SqlUnary {
            "argument": SqlComparison {
              "decorator": undefined,
              "keywords": Object {
                "op": ">",
              },
              "lhs": SqlColumn {
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
              "op": ">",
              "parens": undefined,
              "rhs": SqlColumn {
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
              "spacing": Object {
                "postOp": " ",
                "preOp": " ",
              },
              "type": "comparison",
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
        }
      `);
    });
  });
});
