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

import { SqlExpression } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlUnary', () => {
  it('minus', () => {
    const sql = `-A`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlUnary {
        "argument": SqlRef {
          "columnRefName": RefName {
            "name": "A",
            "quotes": false,
          },
          "keywords": Object {},
          "namespaceRefName": undefined,
          "spacing": Object {},
          "tableRefName": undefined,
          "type": "ref",
        },
        "keywords": Object {
          "op": "-",
        },
        "op": "-",
        "spacing": Object {
          "postOp": "",
        },
        "type": "unary",
      }
    `);
  });

  it('single not expression', () => {
    const sql = `NOT B`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlUnary {
        "argument": SqlRef {
          "columnRefName": RefName {
            "name": "B",
            "quotes": false,
          },
          "keywords": Object {},
          "namespaceRefName": undefined,
          "spacing": Object {},
          "tableRefName": undefined,
          "type": "ref",
        },
        "keywords": Object {
          "op": "NOT",
        },
        "op": "NOT",
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
          "argument": SqlRef {
            "columnRefName": RefName {
              "name": "B",
              "quotes": false,
            },
            "keywords": Object {},
            "namespaceRefName": undefined,
            "spacing": Object {},
            "tableRefName": undefined,
            "type": "ref",
          },
          "keywords": Object {
            "op": "not",
          },
          "op": "NOT",
          "spacing": Object {
            "postOp": " ",
          },
          "type": "unary",
        },
        "keywords": Object {
          "op": "NOT",
        },
        "op": "NOT",
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
              "argument": SqlRef {
                "columnRefName": RefName {
                  "name": "A",
                  "quotes": false,
                },
                "keywords": Object {},
                "namespaceRefName": undefined,
                "spacing": Object {},
                "tableRefName": undefined,
                "type": "ref",
              },
              "keywords": Object {
                "op": "NOT",
              },
              "op": "NOT",
              "spacing": Object {
                "postOp": " ",
              },
              "type": "unary",
            },
            SqlUnary {
              "argument": SqlRef {
                "columnRefName": RefName {
                  "name": "B",
                  "quotes": false,
                },
                "keywords": Object {},
                "namespaceRefName": undefined,
                "spacing": Object {},
                "tableRefName": undefined,
                "type": "ref",
              },
              "keywords": Object {
                "op": "NOT",
              },
              "op": "NOT",
              "spacing": Object {
                "postOp": " ",
              },
              "type": "unary",
            },
            SqlUnary {
              "argument": SqlRef {
                "columnRefName": RefName {
                  "name": "C",
                  "quotes": false,
                },
                "keywords": Object {},
                "namespaceRefName": undefined,
                "spacing": Object {},
                "tableRefName": undefined,
                "type": "ref",
              },
              "keywords": Object {
                "op": "NOT",
              },
              "op": "NOT",
              "spacing": Object {
                "postOp": " ",
              },
              "type": "unary",
            },
          ],
        },
        "keywords": Object {},
        "op": "AND",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('Not containing an expression', () => {
    const sql = `NOT A > B`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlUnary {
        "argument": SqlComparison {
          "decorator": undefined,
          "keywords": Object {
            "op": ">",
          },
          "lhs": SqlRef {
            "columnRefName": RefName {
              "name": "A",
              "quotes": false,
            },
            "keywords": Object {},
            "namespaceRefName": undefined,
            "spacing": Object {},
            "tableRefName": undefined,
            "type": "ref",
          },
          "not": false,
          "op": ">",
          "rhs": SqlRef {
            "columnRefName": RefName {
              "name": "B",
              "quotes": false,
            },
            "keywords": Object {},
            "namespaceRefName": undefined,
            "spacing": Object {},
            "tableRefName": undefined,
            "type": "ref",
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
        "spacing": Object {
          "postOp": " ",
        },
        "type": "unary",
      }
    `);
  });

  it('Multiple Not expressions containing an expression', () => {
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
                "lhs": SqlRef {
                  "columnRefName": RefName {
                    "name": "A",
                    "quotes": false,
                  },
                  "keywords": Object {},
                  "namespaceRefName": undefined,
                  "spacing": Object {},
                  "tableRefName": undefined,
                  "type": "ref",
                },
                "not": false,
                "op": ">",
                "rhs": SqlRef {
                  "columnRefName": RefName {
                    "name": "B",
                    "quotes": false,
                  },
                  "keywords": Object {},
                  "namespaceRefName": undefined,
                  "spacing": Object {},
                  "tableRefName": undefined,
                  "type": "ref",
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
                "lhs": SqlRef {
                  "columnRefName": RefName {
                    "name": "C",
                    "quotes": false,
                  },
                  "keywords": Object {},
                  "namespaceRefName": undefined,
                  "spacing": Object {},
                  "tableRefName": undefined,
                  "type": "ref",
                },
                "not": false,
                "op": "=",
                "rhs": SqlLiteral {
                  "keywords": Object {},
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
              "spacing": Object {
                "postOp": " ",
              },
              "type": "unary",
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

  it('Nested Not Expressions', () => {
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
            "lhs": SqlRef {
              "columnRefName": RefName {
                "name": "A",
                "quotes": false,
              },
              "keywords": Object {},
              "namespaceRefName": undefined,
              "spacing": Object {},
              "tableRefName": undefined,
              "type": "ref",
            },
            "not": false,
            "op": ">",
            "rhs": SqlRef {
              "columnRefName": RefName {
                "name": "B",
                "quotes": false,
              },
              "keywords": Object {},
              "namespaceRefName": undefined,
              "spacing": Object {},
              "tableRefName": undefined,
              "type": "ref",
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
          "spacing": Object {
            "postOp": " ",
          },
          "type": "unary",
        },
        "keywords": Object {
          "op": "NOT",
        },
        "op": "NOT",
        "spacing": Object {
          "postOp": " ",
        },
        "type": "unary",
      }
    `);
  });
});
