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

describe('SqlComparison', () => {
  it('Simple compare 1', () => {
    const sql = `A > B`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "A",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": undefined,
        "op": ">",
        "rhs": SqlRef {
          "column": "B",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "type": "comparision",
      }
    `);
  });

  it('Simple compare 2', () => {
    const sql = `"language"  =   'xxx'`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "postOp": "   ",
          "preOp": "  ",
        },
        "lhs": SqlRef {
          "column": "language",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "\\"",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": undefined,
        "op": "=",
        "rhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "'xxx'",
          "type": "literal",
          "value": "xxx",
        },
        "type": "comparision",
      }
    `);
  });

  it('works with IS', () => {
    const sql = `X  IS   NULL`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "postOp": "   ",
          "preOp": "  ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": undefined,
        "op": "IS",
        "rhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "NULL",
          "type": "literal",
          "value": null,
        },
        "type": "comparision",
      }
    `);
  });

  it('works with IS NOT', () => {
    const sql = `X  IS   NOT    NULL`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "not": "    ",
          "postOp": "   ",
          "preOp": "  ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": "NOT",
        "op": "IS",
        "rhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "NULL",
          "type": "literal",
          "value": null,
        },
        "type": "comparision",
      }
    `);
  });

  it('works with IN (values)', () => {
    const sql = `X IN (1, 2, 3)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": undefined,
        "op": "IN",
        "rhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "(1, 2, 3)",
          "type": "literal",
          "value": Array [
            1,
            2,
            3,
          ],
        },
        "type": "comparision",
      }
    `);
  });

  it('works with NOT IN (values)', () => {
    const sql = `X NOT IN (1, 2, 3)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "not": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": "NOT",
        "op": "IN",
        "rhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "(1, 2, 3)",
          "type": "literal",
          "value": Array [
            1,
            2,
            3,
          ],
        },
        "type": "comparision",
      }
    `);
  });

  it('works with IN (subquery)', () => {
    const sql = `X IN (SELECT val FROM tbl LIMIT 1)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": undefined,
        "op": "IN",
        "rhs": SqlQuery {
          "explainKeyword": undefined,
          "fromKeyword": "FROM",
          "groupByExpressions": undefined,
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
          "limitKeyword": "LIMIT",
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
          "orderByParts": undefined,
          "parens": Array [
            Object {
              "leftSpacing": "",
              "rightSpacing": "",
            },
          ],
          "selectDecorator": "",
          "selectKeyword": "SELECT",
          "selectValues": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "val",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "tables": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": undefined,
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": undefined,
                  "table": "tbl",
                  "tableQuotes": "",
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereExpression": undefined,
          "whereKeyword": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        },
        "type": "comparision",
      }
    `);
  });

  it('works with NOT IN (subquery)', () => {
    const sql = `X NOT IN (SELECT val FROM tbl LIMIT 1)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "not": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": "NOT",
        "op": "IN",
        "rhs": SqlQuery {
          "explainKeyword": undefined,
          "fromKeyword": "FROM",
          "groupByExpressions": undefined,
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
          "limitKeyword": "LIMIT",
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
          "orderByParts": undefined,
          "parens": Array [
            Object {
              "leftSpacing": "",
              "rightSpacing": "",
            },
          ],
          "selectDecorator": "",
          "selectKeyword": "SELECT",
          "selectValues": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "val",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "tables": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": undefined,
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": undefined,
                  "table": "tbl",
                  "tableQuotes": "",
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereExpression": undefined,
          "whereKeyword": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        },
        "type": "comparision",
      }
    `);
  });

  it('works with BETWEEN', () => {
    const sql = `X BETWEEN Y AND Z`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": undefined,
        "op": "BETWEEN",
        "rhs": Object {
          "end": SqlRef {
            "column": "Z",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          "keyword": "AND",
          "postKeyword": " ",
          "preKeyword": " ",
          "start": SqlRef {
            "column": "Y",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        },
        "type": "comparision",
      }
    `);
  });

  it('works with NOT BETWEEN', () => {
    const sql = `X NOT BETWEEN Y AND Z`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "not": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": "NOT",
        "op": "BETWEEN",
        "rhs": Object {
          "end": SqlRef {
            "column": "Z",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          "keyword": "AND",
          "postKeyword": " ",
          "preKeyword": " ",
          "start": SqlRef {
            "column": "Y",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        },
        "type": "comparision",
      }
    `);
  });

  it('works with LIKE', () => {
    const sql = `X LIKE '%A%'`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": undefined,
        "op": "LIKE",
        "rhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "'%A%'",
          "type": "literal",
          "value": "%A%",
        },
        "type": "comparision",
      }
    `);
  });

  it('works with NOT LIKE', () => {
    const sql = `X NOT LIKE '%A%'`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "not": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": "NOT",
        "op": "LIKE",
        "rhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "'%A%'",
          "type": "literal",
          "value": "%A%",
        },
        "type": "comparision",
      }
    `);
  });

  it('works with LIKE with escape', () => {
    const sql = `X LIKE '%A%' ESCAPE '$'`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": undefined,
        "op": "LIKE",
        "rhs": Object {
          "escape": SqlLiteral {
            "innerSpacing": Object {},
            "keyword": undefined,
            "stringValue": "'$'",
            "type": "literal",
            "value": "$",
          },
          "escapeKeyword": "ESCAPE",
          "like": SqlLiteral {
            "innerSpacing": Object {},
            "keyword": undefined,
            "stringValue": "'%A%'",
            "type": "literal",
            "value": "%A%",
          },
          "postEscape": " ",
          "preEscape": " ",
        },
        "type": "comparision",
      }
    `);
  });

  it('works with NOT LIKE with escape', () => {
    const sql = `X NOT LIKE '%A%' ESCAPE '$'`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "not": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": "NOT",
        "op": "LIKE",
        "rhs": Object {
          "escape": SqlLiteral {
            "innerSpacing": Object {},
            "keyword": undefined,
            "stringValue": "'$'",
            "type": "literal",
            "value": "$",
          },
          "escapeKeyword": "ESCAPE",
          "like": SqlLiteral {
            "innerSpacing": Object {},
            "keyword": undefined,
            "stringValue": "'%A%'",
            "type": "literal",
            "value": "%A%",
          },
          "postEscape": " ",
          "preEscape": " ",
        },
        "type": "comparision",
      }
    `);
  });

  describe('Extra tests', () => {
    it('single expression with unquoted string', () => {
      const sql = `A > B`;

      backAndForth(sql);

      expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "A",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": undefined,
        "op": ">",
        "rhs": SqlRef {
          "column": "B",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "type": "comparision",
      }
    `);
    });

    it('single expression with single quoted string', () => {
      const sql = `'A' > 'B'`;

      backAndForth(sql);

      expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "'A'",
          "type": "literal",
          "value": "A",
        },
        "notKeyword": undefined,
        "op": ">",
        "rhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "'B'",
          "type": "literal",
          "value": "B",
        },
        "type": "comparision",
      }
    `);
    });

    it('single expression with double quoted string', () => {
      const sql = `"A" > "B"`;

      backAndForth(sql);

      expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "A",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "\\"",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": undefined,
        "op": ">",
        "rhs": SqlRef {
          "column": "B",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "\\"",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "type": "comparision",
      }
    `);
    });

    it('single expression with numbers', () => {
      const sql = `1 > 2`;

      backAndForth(sql);

      expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "notKeyword": undefined,
        "op": ">",
        "rhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "2",
          "type": "literal",
          "value": 2,
        },
        "type": "comparision",
      }
    `);
    });

    it('brackets', () => {
      const sql = `(1 > 2)`;

      backAndForth(sql);

      expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "notKeyword": undefined,
        "op": ">",
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "rhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "2",
          "type": "literal",
          "value": 2,
        },
        "type": "comparision",
      }
    `);
    });

    it('Between expression', () => {
      const sql = `X BETWEEN Y AND Z`;

      backAndForth(sql);

      expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "notKeyword": undefined,
        "op": "BETWEEN",
        "rhs": Object {
          "end": SqlRef {
            "column": "Z",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          "keyword": "AND",
          "postKeyword": " ",
          "preKeyword": " ",
          "start": SqlRef {
            "column": "Y",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        },
        "type": "comparision",
      }
    `);
    });

    it('Mixed Between expression', () => {
      const sql = `A OR B AND X BETWEEN Y AND Z`;

      backAndForth(sql);

      expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "OR",
            },
          ],
          "values": Array [
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
            SqlMulti {
              "arguments": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "AND",
                  },
                ],
                "values": Array [
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
                  SqlComparison {
                    "innerSpacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "lhs": SqlRef {
                      "column": "X",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "",
                      "table": undefined,
                      "tableQuotes": undefined,
                      "type": "ref",
                    },
                    "notKeyword": undefined,
                    "op": "BETWEEN",
                    "rhs": Object {
                      "end": SqlRef {
                        "column": "Z",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": undefined,
                        "quotes": "",
                        "table": undefined,
                        "tableQuotes": undefined,
                        "type": "ref",
                      },
                      "keyword": "AND",
                      "postKeyword": " ",
                      "preKeyword": " ",
                      "start": SqlRef {
                        "column": "Y",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": undefined,
                        "quotes": "",
                        "table": undefined,
                        "tableQuotes": undefined,
                        "type": "ref",
                      },
                    },
                    "type": "comparision",
                  },
                ],
              },
              "expressionType": "AND",
              "innerSpacing": Object {},
              "type": "multi",
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
    });
  });
});
