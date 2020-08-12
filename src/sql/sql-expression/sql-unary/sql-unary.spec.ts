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

import { SqlExpression } from '../../..';
import { backAndForth } from '../../../test-utils';

describe('SqlUnary', () => {
  it('minus', () => {
    const sql = `-A`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlUnary {
        "argument": SqlRef {
          "column": "A",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        "innerSpacing": Object {
          "postOp": "",
        },
        "op": "-",
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
          "column": "B",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        "innerSpacing": Object {
          "postOp": " ",
        },
        "op": "NOT",
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
            "column": "B",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": false,
            "quotes": false,
            "table": undefined,
            "tableQuotes": false,
            "type": "ref",
          },
          "innerSpacing": Object {
            "postOp": " ",
          },
          "op": "not",
          "type": "unary",
        },
        "innerSpacing": Object {
          "postOp": " ",
        },
        "op": "NOT",
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
                "column": "A",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "innerSpacing": Object {
                "postOp": " ",
              },
              "op": "NOT",
              "type": "unary",
            },
            SqlUnary {
              "argument": SqlRef {
                "column": "B",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "innerSpacing": Object {
                "postOp": " ",
              },
              "op": "NOT",
              "type": "unary",
            },
            SqlUnary {
              "argument": SqlRef {
                "column": "C",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "innerSpacing": Object {
                "postOp": " ",
              },
              "op": "NOT",
              "type": "unary",
            },
          ],
        },
        "expressionType": "and",
        "innerSpacing": Object {},
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
          "innerSpacing": Object {
            "postOp": " ",
            "preOp": " ",
          },
          "lhs": SqlRef {
            "column": "A",
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
          "rhs": SqlRef {
            "column": "B",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": false,
            "quotes": false,
            "table": undefined,
            "tableQuotes": false,
            "type": "ref",
          },
          "type": "comparison",
        },
        "innerSpacing": Object {
          "postOp": " ",
        },
        "op": "NOT",
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
                "innerSpacing": Object {
                  "postOp": " ",
                  "preOp": " ",
                },
                "lhs": SqlRef {
                  "column": "A",
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
                "rhs": SqlRef {
                  "column": "B",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "type": "comparison",
              },
              "innerSpacing": Object {
                "postOp": " ",
              },
              "op": "NOT",
              "type": "unary",
            },
            SqlUnary {
              "argument": SqlComparison {
                "innerSpacing": Object {
                  "postOp": " ",
                  "preOp": " ",
                },
                "lhs": SqlRef {
                  "column": "C",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "notKeyword": undefined,
                "op": "=",
                "rhs": SqlLiteral {
                  "innerSpacing": Object {},
                  "keyword": undefined,
                  "stringValue": "'D'",
                  "type": "literal",
                  "value": "D",
                },
                "type": "comparison",
              },
              "innerSpacing": Object {
                "postOp": " ",
              },
              "op": "Not",
              "type": "unary",
            },
          ],
        },
        "expressionType": "or",
        "innerSpacing": Object {},
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
            "innerSpacing": Object {
              "postOp": " ",
              "preOp": " ",
            },
            "lhs": SqlRef {
              "column": "A",
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
            "rhs": SqlRef {
              "column": "B",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            "type": "comparison",
          },
          "innerSpacing": Object {
            "postOp": " ",
          },
          "op": "NOT",
          "type": "unary",
        },
        "innerSpacing": Object {
          "postOp": " ",
        },
        "op": "NOT",
        "type": "unary",
      }
    `);
  });
});
