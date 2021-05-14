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
import { SqlExpression } from '..';

describe('SqlComparison', () => {
  it('things that work', () => {
    const queries: string[] = [
      '1 = 2',
      '1 != 2',
      '1 <> 2',
      '1 < 2',
      '1 > 2',
      '1 <= 2',
      '1 >= 2',

      `X = ANY (SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)`,
      `X <> any (SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)`,
      `X < ALL (SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)`,
      `X > all (SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)`,
      `X <= SOME (SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)`,
      `X >= some (SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)`,

      `X IN ('moon', 'beam')`,
      `X NOT IN ('moon', 'beam')`,
      `X IN (SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)`,

      "''  similar to ''",
      "'a' similar to 'a'",
      "'a' similar to 'b'",
      "'a' similar to 'A'",
      "'a' similar to 'a_'",
      "'a' similar to '_a'",
      "'a' similar to '%a'",
      "'a' similar to '%a%'",
      "'a' similar to 'a%'",
      "'ab'   similar to 'a_'",
      "'ab' not similar to 'a_'",
      "'aabc' not similar to 'ab*c+d'",

      '2 between 1 and 3',
      '2 between 3 and 2',
      '2 between symmetric 3 and 2',
      '3 between 1 and 3',
      '4 between 1 and 3',
      '1 between 4 and -3',
      '1 between -1 and -3',
      '1 between -1 and 3',
      '1 between 1 and 1',
      '1.5 between 1 and 3',
      '1.2 between 1.1 and 1.3',
      '1.5 between 2 and 3',
      '1.5 between 1.6 and 1.7',
      '1.2e1 between 1.1 and 1.3',
      '1.2e0 between 1.1 and 1.3',
      '1.5e0 between 2 and 3',
      '1.5e0 between 2e0 and 3e0',
      '1.5e1 between 1.6e1 and 1.7e1',
      "x'' between x'' and x''",
      'cast(null as integer) between -1 and 2',
      '1 between -1 and cast(null as integer)',
      '1 between cast(null as integer) and cast(null as integer)',
      '1 between cast(null as integer) and 1',
      "x'0A00015A' between x'0A000130' and x'0A0001B0'",
      "x'0A00015A' between x'0A0001A0' and x'0A0001B0'",
      '2 not between 1 and 3',
      '3 not between 1 and 3',
      '4 not between 1 and 3',
      '1.2e0 not between 1.1 and 1.3',
      '1.2e1 not between 1.1 and 1.3',
      '1.5e0 not between 2 and 3',
      '1.5e0 not between 2e0 and 3e0',
      "x'0A00015A' not between x'0A000130' and x'0A0001B0'",
      "x'0A00015A' not between x'0A0001A0' and x'0A0001B0'",
    ];

    for (const sql of queries) {
      try {
        backAndForth(sql);
      } catch (e) {
        throw new Error(`problem with \`${sql}\`: ${e.message}`);
      }
    }
  });

  it('Simple compare 1', () => {
    const sql = `A > B`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": ">",
        },
        "lhs": SqlRef {
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
        "not": false,
        "op": ">",
        "rhs": SqlRef {
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
        "spacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  it('Simple compare 2', () => {
    const sql = `"language"  =   'xxx'`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "=",
        },
        "lhs": SqlRef {
          "column": "language",
          "keywords": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": true,
          "spacing": Object {},
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        "not": false,
        "op": "=",
        "rhs": SqlLiteral {
          "keywords": Object {},
          "spacing": Object {},
          "stringValue": "'xxx'",
          "type": "literal",
          "value": "xxx",
        },
        "spacing": Object {
          "postOp": "   ",
          "preOp": "  ",
        },
        "type": "comparison",
      }
    `);
  });

  it('works with = ANY', () => {
    const sql = `X = ANY (SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": "ANY",
        "keywords": Object {
          "decorator": "ANY",
          "op": "=",
        },
        "lhs": SqlRef {
          "column": "X",
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
        "op": "=",
        "rhs": SqlQuery {
          "decorator": undefined,
          "explainPlanFor": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "as": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "wikipedia",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "keywords": Object {},
                  "spacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlLiteral {
                  "keywords": Object {},
                  "spacing": Object {},
                  "stringValue": "1",
                  "type": "literal",
                  "value": 1,
                },
              ],
            },
            "keywords": Object {
              "by": "BY",
              "group": "GROUP",
            },
            "spacing": Object {
              "postBy": " ",
              "postGroup": " ",
            },
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": SqlLimitClause {
            "keywords": Object {
              "limit": "LIMIT",
            },
            "limit": SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "5",
              "type": "literal",
              "value": 5,
            },
            "spacing": Object {
              "postLimit": " ",
            },
            "type": "limitClause",
          },
          "offsetClause": undefined,
          "orderByClause": SqlOrderByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlOrderByExpression {
                  "direction": "DESC",
                  "expression": SqlFunction {
                    "args": SeparatedArray {
                      "separators": Array [],
                      "values": Array [
                        SqlRef {
                          "column": "*",
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
                    "functionName": "COUNT",
                    "keywords": Object {
                      "functionName": "COUNT",
                    },
                    "spacing": Object {
                      "postArguments": "",
                      "postLeftParen": "",
                      "preLeftParen": "",
                    },
                    "specialParen": undefined,
                    "type": "function",
                    "whereClause": undefined,
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "by": "BY",
              "order": "ORDER",
            },
            "spacing": Object {
              "postBy": " ",
              "postOrder": " ",
            },
            "type": "orderByClause",
          },
          "parens": Array [
            Object {
              "leftSpacing": "",
              "rightSpacing": "",
            },
          ],
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "as": undefined,
                "expression": SqlRef {
                  "column": "page",
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "keywords": Object {},
                "spacing": Object {},
                "type": "alias",
              },
            ],
          },
          "spacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preGroupBy": " ",
            "preLimit": " ",
            "preOrderBy": " ",
            "preQuery": "",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withParts": undefined,
        },
        "spacing": Object {
          "postDecorator": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  it('works with IS', () => {
    const sql = `X  IS   NULL`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "IS",
        },
        "lhs": SqlRef {
          "column": "X",
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
        "op": "IS",
        "rhs": SqlLiteral {
          "keywords": Object {},
          "spacing": Object {},
          "stringValue": "NULL",
          "type": "literal",
          "value": null,
        },
        "spacing": Object {
          "postOp": "   ",
          "preOp": "  ",
        },
        "type": "comparison",
      }
    `);
  });

  it('works with IS NOT', () => {
    const sql = `X  IS   NOT    NULL`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "not": "NOT",
          "op": "IS",
        },
        "lhs": SqlRef {
          "column": "X",
          "keywords": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "spacing": Object {},
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        "not": true,
        "op": "IS",
        "rhs": SqlLiteral {
          "keywords": Object {},
          "spacing": Object {},
          "stringValue": "NULL",
          "type": "literal",
          "value": null,
        },
        "spacing": Object {
          "not": "    ",
          "postOp": "   ",
          "preOp": "  ",
        },
        "type": "comparison",
      }
    `);
  });

  it('works with IN (values)', () => {
    const sql = `X IN (1, 2, 3)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "IN",
        },
        "lhs": SqlRef {
          "column": "X",
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
        "op": "IN",
        "rhs": SqlLiteral {
          "keywords": Object {},
          "spacing": Object {},
          "stringValue": "(1, 2, 3)",
          "type": "literal",
          "value": Array [
            1,
            2,
            3,
          ],
        },
        "spacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  it('works with NOT IN (values)', () => {
    const sql = `X NOT IN (1, 2, 3)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "not": "NOT",
          "op": "IN",
        },
        "lhs": SqlRef {
          "column": "X",
          "keywords": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "spacing": Object {},
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        "not": true,
        "op": "IN",
        "rhs": SqlLiteral {
          "keywords": Object {},
          "spacing": Object {},
          "stringValue": "(1, 2, 3)",
          "type": "literal",
          "value": Array [
            1,
            2,
            3,
          ],
        },
        "spacing": Object {
          "not": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  it('works with IN (subquery)', () => {
    const sql = `X IN (SELECT val FROM tbl LIMIT 1)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "IN",
        },
        "lhs": SqlRef {
          "column": "X",
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
        "op": "IN",
        "rhs": SqlQuery {
          "decorator": undefined,
          "explainPlanFor": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "as": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "keywords": Object {},
                  "spacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": SqlLimitClause {
            "keywords": Object {
              "limit": "LIMIT",
            },
            "limit": SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "spacing": Object {
              "postLimit": " ",
            },
            "type": "limitClause",
          },
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": Array [
            Object {
              "leftSpacing": "",
              "rightSpacing": "",
            },
          ],
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "as": undefined,
                "expression": SqlRef {
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
                "keywords": Object {},
                "spacing": Object {},
                "type": "alias",
              },
            ],
          },
          "spacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preLimit": " ",
            "preQuery": "",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withParts": undefined,
        },
        "spacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  it('works with NOT IN (subquery)', () => {
    const sql = `X NOT IN (SELECT val FROM tbl LIMIT 1)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "not": "NOT",
          "op": "IN",
        },
        "lhs": SqlRef {
          "column": "X",
          "keywords": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "spacing": Object {},
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        "not": true,
        "op": "IN",
        "rhs": SqlQuery {
          "decorator": undefined,
          "explainPlanFor": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "as": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "keywords": Object {},
                  "spacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": SqlLimitClause {
            "keywords": Object {
              "limit": "LIMIT",
            },
            "limit": SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "spacing": Object {
              "postLimit": " ",
            },
            "type": "limitClause",
          },
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": Array [
            Object {
              "leftSpacing": "",
              "rightSpacing": "",
            },
          ],
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "as": undefined,
                "expression": SqlRef {
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
                "keywords": Object {},
                "spacing": Object {},
                "type": "alias",
              },
            ],
          },
          "spacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preLimit": " ",
            "preQuery": "",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withParts": undefined,
        },
        "spacing": Object {
          "not": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  it('works with BETWEEN', () => {
    const sql = `X BETWEEN Y AND Z`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "BETWEEN",
        },
        "lhs": SqlRef {
          "column": "X",
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
        "op": "BETWEEN",
        "rhs": SqlBetweenPart {
          "end": SqlRef {
            "column": "Z",
            "keywords": Object {},
            "namespace": undefined,
            "namespaceQuotes": false,
            "quotes": false,
            "spacing": Object {},
            "table": undefined,
            "tableQuotes": false,
            "type": "ref",
          },
          "keywords": Object {
            "and": "AND",
          },
          "spacing": Object {
            "postAnd": " ",
            "preAnd": " ",
          },
          "start": SqlRef {
            "column": "Y",
            "keywords": Object {},
            "namespace": undefined,
            "namespaceQuotes": false,
            "quotes": false,
            "spacing": Object {},
            "table": undefined,
            "tableQuotes": false,
            "type": "ref",
          },
          "symmetric": undefined,
          "type": "betweenPart",
        },
        "spacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  it('works with NOT BETWEEN', () => {
    const sql = `X NOT BETWEEN SYMMETRIC Y AND Z`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "not": "NOT",
          "op": "BETWEEN",
        },
        "lhs": SqlRef {
          "column": "X",
          "keywords": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "spacing": Object {},
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        "not": true,
        "op": "BETWEEN",
        "rhs": SqlBetweenPart {
          "end": SqlRef {
            "column": "Z",
            "keywords": Object {},
            "namespace": undefined,
            "namespaceQuotes": false,
            "quotes": false,
            "spacing": Object {},
            "table": undefined,
            "tableQuotes": false,
            "type": "ref",
          },
          "keywords": Object {
            "and": "AND",
            "symmetric": "SYMMETRIC",
          },
          "spacing": Object {
            "postAnd": " ",
            "postSymmetric": " ",
            "preAnd": " ",
          },
          "start": SqlRef {
            "column": "Y",
            "keywords": Object {},
            "namespace": undefined,
            "namespaceQuotes": false,
            "quotes": false,
            "spacing": Object {},
            "table": undefined,
            "tableQuotes": false,
            "type": "ref",
          },
          "symmetric": true,
          "type": "betweenPart",
        },
        "spacing": Object {
          "not": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  it('works with LIKE', () => {
    const sql = `X LIKE '%A%'`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "LIKE",
        },
        "lhs": SqlRef {
          "column": "X",
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
        "op": "LIKE",
        "rhs": SqlLiteral {
          "keywords": Object {},
          "spacing": Object {},
          "stringValue": "'%A%'",
          "type": "literal",
          "value": "%A%",
        },
        "spacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  it('works with NOT LIKE', () => {
    const sql = `X NOT LIKE '%A%'`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "not": "NOT",
          "op": "LIKE",
        },
        "lhs": SqlRef {
          "column": "X",
          "keywords": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "spacing": Object {},
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        "not": true,
        "op": "LIKE",
        "rhs": SqlLiteral {
          "keywords": Object {},
          "spacing": Object {},
          "stringValue": "'%A%'",
          "type": "literal",
          "value": "%A%",
        },
        "spacing": Object {
          "not": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  it('works with LIKE with complex match and ESCAPE', () => {
    const sql = `X || Y NOT LIKE '%Je' || '%' ESCAPE '\\' || ''`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "not": "NOT",
          "op": "LIKE",
        },
        "lhs": SqlMulti {
          "args": SeparatedArray {
            "separators": Array [
              Separator {
                "left": " ",
                "right": " ",
                "separator": "||",
              },
            ],
            "values": Array [
              SqlRef {
                "column": "X",
                "keywords": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "spacing": Object {},
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              SqlRef {
                "column": "Y",
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
          "keywords": Object {},
          "op": "||",
          "spacing": Object {},
          "type": "multi",
        },
        "not": true,
        "op": "LIKE",
        "rhs": SqlLikePart {
          "escape": SqlMulti {
            "args": SeparatedArray {
              "separators": Array [
                Separator {
                  "left": " ",
                  "right": " ",
                  "separator": "||",
                },
              ],
              "values": Array [
                SqlLiteral {
                  "keywords": Object {},
                  "spacing": Object {},
                  "stringValue": "'\\\\'",
                  "type": "literal",
                  "value": "\\\\",
                },
                SqlLiteral {
                  "keywords": Object {},
                  "spacing": Object {},
                  "stringValue": "''",
                  "type": "literal",
                  "value": "",
                },
              ],
            },
            "keywords": Object {},
            "op": "||",
            "spacing": Object {},
            "type": "multi",
          },
          "keywords": Object {
            "escape": "ESCAPE",
          },
          "like": SqlMulti {
            "args": SeparatedArray {
              "separators": Array [
                Separator {
                  "left": " ",
                  "right": " ",
                  "separator": "||",
                },
              ],
              "values": Array [
                SqlLiteral {
                  "keywords": Object {},
                  "spacing": Object {},
                  "stringValue": "'%Je'",
                  "type": "literal",
                  "value": "%Je",
                },
                SqlLiteral {
                  "keywords": Object {},
                  "spacing": Object {},
                  "stringValue": "'%'",
                  "type": "literal",
                  "value": "%",
                },
              ],
            },
            "keywords": Object {},
            "op": "||",
            "spacing": Object {},
            "type": "multi",
          },
          "spacing": Object {
            "postEscape": " ",
            "preEscape": " ",
          },
          "type": "likePart",
        },
        "spacing": Object {
          "not": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  it('works with LIKE with escape', () => {
    const sql = `X LIKE '%A%' ESCAPE '$'`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "LIKE",
        },
        "lhs": SqlRef {
          "column": "X",
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
        "op": "LIKE",
        "rhs": SqlLikePart {
          "escape": SqlLiteral {
            "keywords": Object {},
            "spacing": Object {},
            "stringValue": "'$'",
            "type": "literal",
            "value": "$",
          },
          "keywords": Object {
            "escape": "ESCAPE",
          },
          "like": SqlLiteral {
            "keywords": Object {},
            "spacing": Object {},
            "stringValue": "'%A%'",
            "type": "literal",
            "value": "%A%",
          },
          "spacing": Object {
            "postEscape": " ",
            "preEscape": " ",
          },
          "type": "likePart",
        },
        "spacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  it('works with NOT LIKE with escape', () => {
    const sql = `X NOT LIKE '%A%' ESCAPE '$'`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "not": "NOT",
          "op": "LIKE",
        },
        "lhs": SqlRef {
          "column": "X",
          "keywords": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "spacing": Object {},
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        "not": true,
        "op": "LIKE",
        "rhs": SqlLikePart {
          "escape": SqlLiteral {
            "keywords": Object {},
            "spacing": Object {},
            "stringValue": "'$'",
            "type": "literal",
            "value": "$",
          },
          "keywords": Object {
            "escape": "ESCAPE",
          },
          "like": SqlLiteral {
            "keywords": Object {},
            "spacing": Object {},
            "stringValue": "'%A%'",
            "type": "literal",
            "value": "%A%",
          },
          "spacing": Object {
            "postEscape": " ",
            "preEscape": " ",
          },
          "type": "likePart",
        },
        "spacing": Object {
          "not": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  describe('Extra tests', () => {
    it('single expression with unquoted string', () => {
      const sql = `A > B`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlComparison {
          "decorator": undefined,
          "keywords": Object {
            "op": ">",
          },
          "lhs": SqlRef {
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
          "not": false,
          "op": ">",
          "rhs": SqlRef {
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
          "spacing": Object {
            "postOp": " ",
            "preOp": " ",
          },
          "type": "comparison",
        }
      `);
    });

    it('single expression with single quoted string', () => {
      const sql = `'A' > 'B'`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlComparison {
          "decorator": undefined,
          "keywords": Object {
            "op": ">",
          },
          "lhs": SqlLiteral {
            "keywords": Object {},
            "spacing": Object {},
            "stringValue": "'A'",
            "type": "literal",
            "value": "A",
          },
          "not": false,
          "op": ">",
          "rhs": SqlLiteral {
            "keywords": Object {},
            "spacing": Object {},
            "stringValue": "'B'",
            "type": "literal",
            "value": "B",
          },
          "spacing": Object {
            "postOp": " ",
            "preOp": " ",
          },
          "type": "comparison",
        }
      `);
    });

    it('single expression with double quoted string', () => {
      const sql = `"A" > "B"`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlComparison {
          "decorator": undefined,
          "keywords": Object {
            "op": ">",
          },
          "lhs": SqlRef {
            "column": "A",
            "keywords": Object {},
            "namespace": undefined,
            "namespaceQuotes": false,
            "quotes": true,
            "spacing": Object {},
            "table": undefined,
            "tableQuotes": false,
            "type": "ref",
          },
          "not": false,
          "op": ">",
          "rhs": SqlRef {
            "column": "B",
            "keywords": Object {},
            "namespace": undefined,
            "namespaceQuotes": false,
            "quotes": true,
            "spacing": Object {},
            "table": undefined,
            "tableQuotes": false,
            "type": "ref",
          },
          "spacing": Object {
            "postOp": " ",
            "preOp": " ",
          },
          "type": "comparison",
        }
      `);
    });

    it('single expression with numbers', () => {
      const sql = `1 > 2`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlComparison {
          "decorator": undefined,
          "keywords": Object {
            "op": ">",
          },
          "lhs": SqlLiteral {
            "keywords": Object {},
            "spacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          "not": false,
          "op": ">",
          "rhs": SqlLiteral {
            "keywords": Object {},
            "spacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
          "spacing": Object {
            "postOp": " ",
            "preOp": " ",
          },
          "type": "comparison",
        }
      `);
    });

    it('brackets', () => {
      const sql = `(1 > 2)`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlComparison {
          "decorator": undefined,
          "keywords": Object {
            "op": ">",
          },
          "lhs": SqlLiteral {
            "keywords": Object {},
            "spacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          "not": undefined,
          "op": ">",
          "parens": Array [
            Object {
              "leftSpacing": "",
              "rightSpacing": "",
            },
          ],
          "rhs": SqlLiteral {
            "keywords": Object {},
            "spacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
          "spacing": Object {
            "postOp": " ",
            "preOp": " ",
          },
          "type": "comparison",
        }
      `);
    });

    it('Between expression', () => {
      const sql = `X BETWEEN Y AND Z`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlComparison {
          "decorator": undefined,
          "keywords": Object {
            "op": "BETWEEN",
          },
          "lhs": SqlRef {
            "column": "X",
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
          "op": "BETWEEN",
          "rhs": SqlBetweenPart {
            "end": SqlRef {
              "column": "Z",
              "keywords": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "spacing": Object {},
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            "keywords": Object {
              "and": "AND",
            },
            "spacing": Object {
              "postAnd": " ",
              "preAnd": " ",
            },
            "start": SqlRef {
              "column": "Y",
              "keywords": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "spacing": Object {},
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            "symmetric": undefined,
            "type": "betweenPart",
          },
          "spacing": Object {
            "postOp": " ",
            "preOp": " ",
          },
          "type": "comparison",
        }
      `);
    });

    it('Mixed Between expression', () => {
      const sql = `A OR B AND X BETWEEN Y AND Z`;

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
                    SqlComparison {
                      "decorator": undefined,
                      "keywords": Object {
                        "op": "BETWEEN",
                      },
                      "lhs": SqlRef {
                        "column": "X",
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
                      "op": "BETWEEN",
                      "rhs": SqlBetweenPart {
                        "end": SqlRef {
                          "column": "Z",
                          "keywords": Object {},
                          "namespace": undefined,
                          "namespaceQuotes": false,
                          "quotes": false,
                          "spacing": Object {},
                          "table": undefined,
                          "tableQuotes": false,
                          "type": "ref",
                        },
                        "keywords": Object {
                          "and": "AND",
                        },
                        "spacing": Object {
                          "postAnd": " ",
                          "preAnd": " ",
                        },
                        "start": SqlRef {
                          "column": "Y",
                          "keywords": Object {},
                          "namespace": undefined,
                          "namespaceQuotes": false,
                          "quotes": false,
                          "spacing": Object {},
                          "table": undefined,
                          "tableQuotes": false,
                          "type": "ref",
                        },
                        "symmetric": undefined,
                        "type": "betweenPart",
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

    it('Complex Between expression', () => {
      const sql = `X BETWEEN 1+2 AND 3+4`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlComparison {
          "decorator": undefined,
          "keywords": Object {
            "op": "BETWEEN",
          },
          "lhs": SqlRef {
            "column": "X",
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
          "op": "BETWEEN",
          "rhs": SqlBetweenPart {
            "end": SqlMulti {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": "",
                    "right": "",
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
                    "stringValue": "4",
                    "type": "literal",
                    "value": 4,
                  },
                ],
              },
              "keywords": Object {},
              "op": "+",
              "spacing": Object {},
              "type": "multi",
            },
            "keywords": Object {
              "and": "AND",
            },
            "spacing": Object {
              "postAnd": " ",
              "preAnd": " ",
            },
            "start": SqlMulti {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": "",
                    "right": "",
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
            "symmetric": undefined,
            "type": "betweenPart",
          },
          "spacing": Object {
            "postOp": " ",
            "preOp": " ",
          },
          "type": "comparison",
        }
      `);
    });
  });

  describe('#getLikeMatchPattern', () => {
    const x = SqlExpression.parse('x');

    it('works', () => {
      expect(x.lessThan(4).getLikeMatchPattern()).toBeUndefined();
      expect(x.like('hello').getLikeMatchPattern()).toEqual('hello');
    });
  });

  describe('#getSpecialLikeType', () => {
    const x = SqlExpression.parse('x');

    it('works', () => {
      expect(x.lessThan(4).getSpecialLikeType()).toBeUndefined();
      expect(x.like('hello').getSpecialLikeType()).toEqual('exact');
      expect(x.like('hello%').getSpecialLikeType()).toEqual('prefix');
      expect(x.like('%hello').getSpecialLikeType()).toEqual('postfix');
      expect(x.like('%hello%').getSpecialLikeType()).toEqual('includes');
    });
  });
});
