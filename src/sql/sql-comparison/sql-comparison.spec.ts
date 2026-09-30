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
import { SqlColumn, SqlComparison, SqlExpression, SqlLikePart, SqlValues } from '..';

describe('SqlComparison', () => {
  describe('parses', () => {
    it('keeps a VALUES query as the rhs of an IN', () => {
      const comparison = SqlExpression.parse(
        `(1, 2) IN (VALUES (1, 1 + 1),(2, 1 + 1))`,
      ) as SqlComparison;

      expect(comparison.rhs).toBeInstanceOf(SqlValues);
    });

    it.each([
      'x = y',
      'x != y',
      'x <> y',
      '(1, ROW(2)) = Row (1, 1 + 1)',

      'x < y',
      'x > y',
      'x <= y',
      'x >= y',
      ' x >= y  ',

      `X = ANY (SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)`,
      `X <> any (SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)`,
      `X < ALL (SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)`,
      `X > all (SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)`,
      `X <= SOME (SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)`,
      `X >= some (SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)`,

      `X IN ('moon', 'beam')`,
      `X IN ('mo' || 'on', 'be' || 'am')`,
      `X NOT IN ('moon', 'beam')`,
      `X IN (SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)`,
      `X IN ((SELECT page FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5))`,
      `(browser, country) IN (ROW ('Chr' || 'ome', 'United States'), ('Firefox', 'Israel'))`,
      `(1, 2) IN (VALUES   (1, 1 + 1),(2, 1 + 1))`,

      `x IS  NOT DISTINCT FROM y`,
      `x IS DISTINCT  FROM y`,

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
    ])('does back and forth with %s', sql => {
      backAndForth(sql, SqlComparison);
    });

    it('simple compare', () => {
      const sql = `A > B`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
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
      }
    `);
    });

    it('simple compare with spacing and quotes', () => {
      const sql = `"language"  =   'xxx'`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "=",
        },
        "lhs": SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "language",
            "quotes": true,
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
        "op": "=",
        "parens": undefined,
        "rhs": SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "wikipedia",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "decorator": undefined,
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlLiteral {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "stringValue": "1",
                  "type": "literal",
                  "value": 1,
                },
              ],
            },
            "innerParens": false,
            "keywords": Object {
              "groupBy": "GROUP BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postGroupBy": " ",
            },
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": SqlLimitClause {
            "keywords": Object {
              "limit": "LIMIT",
            },
            "limit": SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "5",
              "type": "literal",
              "value": 5,
            },
            "parens": undefined,
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
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "orderBy": "ORDER BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postOrderBy": " ",
            },
            "type": "orderByClause",
          },
          "parens": Array [
            Object {
              "leftSpacing": "",
              "rightSpacing": "",
            },
          ],
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "page",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preGroupByClause": " ",
            "preLimitClause": " ",
            "preOrderByClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
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
          "op": "IS   NOT",
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
          "postOp": "    ",
          "preOp": "  ",
        },
        "type": "comparison",
      }
    `);
    });

    it('works with IN (value)', () => {
      const sql = `X IN (1)`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "IN",
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
        "op": "IN",
        "parens": undefined,
        "rhs": SqlRecord {
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlLiteral {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "stringValue": "1",
                "type": "literal",
                "value": 1,
              },
            ],
          },
          "keywords": Object {
            "row": "",
          },
          "parens": undefined,
          "spacing": Object {
            "postExpressions": "",
            "postLeftParen": "",
          },
          "type": "record",
        },
        "spacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
    });

    it('works with IN (values)', () => {
      const sql = `X IN (1, 2, 4 - 1)`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "IN",
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
        "op": "IN",
        "parens": undefined,
        "rhs": SqlRecord {
          "expressions": SeparatedArray {
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
                      "stringValue": "4",
                      "type": "literal",
                      "value": 4,
                    },
                    SqlLiteral {
                      "keywords": Object {},
                      "parens": undefined,
                      "spacing": Object {},
                      "stringValue": "1",
                      "type": "literal",
                      "value": 1,
                    },
                  ],
                },
                "keywords": Object {},
                "op": "-",
                "parens": undefined,
                "spacing": Object {},
                "type": "multi",
              },
            ],
          },
          "keywords": Object {
            "row": "",
          },
          "parens": undefined,
          "spacing": Object {
            "postExpressions": "",
            "postLeftParen": "",
          },
          "type": "record",
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
      const sql = `X NOT IN (1, 2, 4 - 1)`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "NOT IN",
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
        "op": "NOT IN",
        "parens": undefined,
        "rhs": SqlRecord {
          "expressions": SeparatedArray {
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
                      "stringValue": "4",
                      "type": "literal",
                      "value": 4,
                    },
                    SqlLiteral {
                      "keywords": Object {},
                      "parens": undefined,
                      "spacing": Object {},
                      "stringValue": "1",
                      "type": "literal",
                      "value": 1,
                    },
                  ],
                },
                "keywords": Object {},
                "op": "-",
                "parens": undefined,
                "spacing": Object {},
                "type": "multi",
              },
            ],
          },
          "keywords": Object {
            "row": "",
          },
          "parens": undefined,
          "spacing": Object {
            "postExpressions": "",
            "postLeftParen": "",
          },
          "type": "record",
        },
        "spacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
    });

    it('works with IN (subquery)', () => {
      const sql = `X IN ( (SELECT val FROM tbl LIMIT 1  ))`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "IN",
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
        "op": "IN",
        "parens": undefined,
        "rhs": SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": SqlLimitClause {
            "keywords": Object {
              "limit": "LIMIT",
            },
            "limit": SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "parens": undefined,
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
              "rightSpacing": "  ",
            },
            Object {
              "leftSpacing": " ",
              "rightSpacing": "",
            },
          ],
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlColumn {
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
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preLimitClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
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
          "op": "NOT IN",
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
        "op": "NOT IN",
        "parens": undefined,
        "rhs": SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": SqlLimitClause {
            "keywords": Object {
              "limit": "LIMIT",
            },
            "limit": SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "parens": undefined,
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
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlColumn {
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
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preLimitClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        },
        "spacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
    });

    it('works with IN nested record', () => {
      const sql = `(browser, country) IN (('Chr' || 'ome', 'United States'), ('Firefox', 'Israel'))`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "IN",
        },
        "lhs": SqlRecord {
          "expressions": SeparatedArray {
            "separators": Array [
              Separator {
                "left": "",
                "right": " ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "browser",
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
                  "name": "country",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
            ],
          },
          "keywords": Object {
            "row": "",
          },
          "parens": undefined,
          "spacing": Object {
            "postExpressions": "",
            "postLeftParen": "",
          },
          "type": "record",
        },
        "op": "IN",
        "parens": undefined,
        "rhs": SqlRecord {
          "expressions": SeparatedArray {
            "separators": Array [
              Separator {
                "left": "",
                "right": " ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlRecord {
                "expressions": SeparatedArray {
                  "separators": Array [
                    Separator {
                      "left": "",
                      "right": " ",
                      "separator": ",",
                    },
                  ],
                  "values": Array [
                    SqlMulti {
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
                            "parens": undefined,
                            "spacing": Object {},
                            "stringValue": "'Chr'",
                            "type": "literal",
                            "value": "Chr",
                          },
                          SqlLiteral {
                            "keywords": Object {},
                            "parens": undefined,
                            "spacing": Object {},
                            "stringValue": "'ome'",
                            "type": "literal",
                            "value": "ome",
                          },
                        ],
                      },
                      "keywords": Object {},
                      "op": "||",
                      "parens": undefined,
                      "spacing": Object {},
                      "type": "multi",
                    },
                    SqlLiteral {
                      "keywords": Object {},
                      "parens": undefined,
                      "spacing": Object {},
                      "stringValue": "'United States'",
                      "type": "literal",
                      "value": "United States",
                    },
                  ],
                },
                "keywords": Object {
                  "row": "",
                },
                "parens": undefined,
                "spacing": Object {
                  "postExpressions": "",
                  "postLeftParen": "",
                },
                "type": "record",
              },
              SqlRecord {
                "expressions": SeparatedArray {
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
                      "stringValue": "'Firefox'",
                      "type": "literal",
                      "value": "Firefox",
                    },
                    SqlLiteral {
                      "keywords": Object {},
                      "parens": undefined,
                      "spacing": Object {},
                      "stringValue": "'Israel'",
                      "type": "literal",
                      "value": "Israel",
                    },
                  ],
                },
                "keywords": Object {
                  "row": "",
                },
                "parens": undefined,
                "spacing": Object {
                  "postExpressions": "",
                  "postLeftParen": "",
                },
                "type": "record",
              },
            ],
          },
          "keywords": Object {
            "row": "",
          },
          "parens": undefined,
          "spacing": Object {
            "postExpressions": "",
            "postLeftParen": "",
          },
          "type": "record",
        },
        "spacing": Object {
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
        "op": "BETWEEN",
        "parens": undefined,
        "rhs": SqlBetweenPart {
          "end": SqlColumn {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "Z",
              "quotes": false,
            },
            "spacing": Object {},
            "table": undefined,
            "type": "column",
          },
          "keywords": Object {
            "and": "AND",
          },
          "parens": undefined,
          "spacing": Object {
            "postAnd": " ",
            "preAnd": " ",
          },
          "start": SqlColumn {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "Y",
              "quotes": false,
            },
            "spacing": Object {},
            "table": undefined,
            "type": "column",
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
          "op": "NOT BETWEEN",
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
        "op": "NOT BETWEEN",
        "parens": undefined,
        "rhs": SqlBetweenPart {
          "end": SqlColumn {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "Z",
              "quotes": false,
            },
            "spacing": Object {},
            "table": undefined,
            "type": "column",
          },
          "keywords": Object {
            "and": "AND",
            "symmetric": "SYMMETRIC",
          },
          "parens": undefined,
          "spacing": Object {
            "postAnd": " ",
            "postSymmetric": " ",
            "preAnd": " ",
          },
          "start": SqlColumn {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "Y",
              "quotes": false,
            },
            "spacing": Object {},
            "table": undefined,
            "type": "column",
          },
          "symmetric": true,
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

    it('works with LIKE', () => {
      const sql = `X LIKE '%A%'`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "LIKE",
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
        "op": "LIKE",
        "parens": undefined,
        "rhs": SqlLiteral {
          "keywords": Object {},
          "parens": undefined,
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
          "op": "NOT LIKE",
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
        "op": "NOT LIKE",
        "parens": undefined,
        "rhs": SqlLiteral {
          "keywords": Object {},
          "parens": undefined,
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

    it('works with LIKE with complex match and ESCAPE', () => {
      const sql = `X || Y NOT LIKE '%Je' || '%' ESCAPE '\\' || ''`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "NOT LIKE",
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
              SqlColumn {
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
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "Y",
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
        },
        "op": "NOT LIKE",
        "parens": undefined,
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
                  "parens": undefined,
                  "spacing": Object {},
                  "stringValue": "'\\\\'",
                  "type": "literal",
                  "value": "\\\\",
                },
                SqlLiteral {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "stringValue": "''",
                  "type": "literal",
                  "value": "",
                },
              ],
            },
            "keywords": Object {},
            "op": "||",
            "parens": undefined,
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
                  "parens": undefined,
                  "spacing": Object {},
                  "stringValue": "'%Je'",
                  "type": "literal",
                  "value": "%Je",
                },
                SqlLiteral {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "stringValue": "'%'",
                  "type": "literal",
                  "value": "%",
                },
              ],
            },
            "keywords": Object {},
            "op": "||",
            "parens": undefined,
            "spacing": Object {},
            "type": "multi",
          },
          "parens": undefined,
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

    it('works with LIKE with escape', () => {
      const sql = `X LIKE '%A%' ESCAPE '$'`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "LIKE",
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
        "op": "LIKE",
        "parens": undefined,
        "rhs": SqlLikePart {
          "escape": SqlLiteral {
            "keywords": Object {},
            "parens": undefined,
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
            "parens": undefined,
            "spacing": Object {},
            "stringValue": "'%A%'",
            "type": "literal",
            "value": "%A%",
          },
          "parens": undefined,
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
          "op": "NOT LIKE",
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
        "op": "NOT LIKE",
        "parens": undefined,
        "rhs": SqlLikePart {
          "escape": SqlLiteral {
            "keywords": Object {},
            "parens": undefined,
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
            "parens": undefined,
            "spacing": Object {},
            "stringValue": "'%A%'",
            "type": "literal",
            "value": "%A%",
          },
          "parens": undefined,
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

    describe('extra cases', () => {
      it('single expression with unquoted string', () => {
        const sql = `A > B`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlComparison {
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
            "parens": undefined,
            "spacing": Object {},
            "stringValue": "'A'",
            "type": "literal",
            "value": "A",
          },
          "op": ">",
          "parens": undefined,
          "rhs": SqlLiteral {
            "keywords": Object {},
            "parens": undefined,
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
          "lhs": SqlColumn {
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
          "op": ">",
          "parens": undefined,
          "rhs": SqlColumn {
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
            "parens": undefined,
            "spacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          "op": ">",
          "parens": undefined,
          "rhs": SqlLiteral {
            "keywords": Object {},
            "parens": undefined,
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
            "parens": undefined,
            "spacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          "op": ">",
          "parens": Array [
            Object {
              "leftSpacing": "",
              "rightSpacing": "",
            },
          ],
          "rhs": SqlLiteral {
            "keywords": Object {},
            "parens": undefined,
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

      it('between expression', () => {
        const sql = `X BETWEEN Y AND Z`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlComparison {
          "decorator": undefined,
          "keywords": Object {
            "op": "BETWEEN",
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
          "op": "BETWEEN",
          "parens": undefined,
          "rhs": SqlBetweenPart {
            "end": SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "Z",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
            "keywords": Object {
              "and": "AND",
            },
            "parens": undefined,
            "spacing": Object {
              "postAnd": " ",
              "preAnd": " ",
            },
            "start": SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "Y",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
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

      it('mixed between expression', () => {
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
                        "op": "BETWEEN",
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
                      "op": "BETWEEN",
                      "parens": undefined,
                      "rhs": SqlBetweenPart {
                        "end": SqlColumn {
                          "keywords": Object {},
                          "parens": undefined,
                          "refName": RefName {
                            "name": "Z",
                            "quotes": false,
                          },
                          "spacing": Object {},
                          "table": undefined,
                          "type": "column",
                        },
                        "keywords": Object {
                          "and": "AND",
                        },
                        "parens": undefined,
                        "spacing": Object {
                          "postAnd": " ",
                          "preAnd": " ",
                        },
                        "start": SqlColumn {
                          "keywords": Object {},
                          "parens": undefined,
                          "refName": RefName {
                            "name": "Y",
                            "quotes": false,
                          },
                          "spacing": Object {},
                          "table": undefined,
                          "type": "column",
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

      it('complex between expression', () => {
        const sql = `X BETWEEN 1+2 AND 3+4`;

        backAndForth(sql);

        expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlComparison {
          "decorator": undefined,
          "keywords": Object {
            "op": "BETWEEN",
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
          "op": "BETWEEN",
          "parens": undefined,
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
                    "stringValue": "4",
                    "type": "literal",
                    "value": 4,
                  },
                ],
              },
              "keywords": Object {},
              "op": "+",
              "parens": undefined,
              "spacing": Object {},
              "type": "multi",
            },
            "keywords": Object {
              "and": "AND",
            },
            "parens": undefined,
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
  });

  describe('.equal', () => {
    it('creates an = comparison', () => {
      expect(SqlComparison.equal(SqlColumn.create('x'), 1).toString()).toEqual('"x" = 1');
    });
  });

  describe('.unequal', () => {
    it('creates a <> comparison', () => {
      expect(SqlComparison.unequal(SqlColumn.create('x'), 'a').toString()).toEqual(`"x" <> 'a'`);
    });
  });

  describe('.lessThan', () => {
    it('creates a < comparison', () => {
      expect(SqlComparison.lessThan(SqlColumn.create('x'), 1).toString()).toEqual('"x" < 1');
    });
  });

  describe('.greaterThan', () => {
    it('creates a > comparison', () => {
      expect(SqlComparison.greaterThan(SqlColumn.create('x'), 1).toString()).toEqual('"x" > 1');
    });
  });

  describe('.lessThanOrEqual', () => {
    it('creates a <= comparison', () => {
      expect(SqlComparison.lessThanOrEqual(SqlColumn.create('x'), 1).toString()).toEqual(
        '"x" <= 1',
      );
    });
  });

  describe('.greaterThanOrEqual', () => {
    it('creates a >= comparison', () => {
      expect(SqlComparison.greaterThanOrEqual(SqlColumn.create('x'), 1).toString()).toEqual(
        '"x" >= 1',
      );
    });
  });

  describe('.isNull', () => {
    it('creates an IS NULL comparison', () => {
      expect(SqlComparison.isNull(SqlColumn.create('x')).toString()).toEqual('"x" IS NULL');
    });
  });

  describe('.isNotNull', () => {
    it('creates an IS NOT NULL comparison', () => {
      expect(SqlComparison.isNotNull(SqlColumn.create('x')).toString()).toEqual('"x" IS NOT NULL');
    });
  });

  describe('.isNotDistinctFrom', () => {
    it('creates an IS NOT DISTINCT FROM comparison', () => {
      expect(SqlComparison.isNotDistinctFrom(SqlColumn.create('x'), 1).toString()).toEqual(
        '"x" IS NOT DISTINCT FROM 1',
      );
    });
  });

  describe('.isDistinctFrom', () => {
    it('creates an IS DISTINCT FROM comparison', () => {
      expect(SqlComparison.isDistinctFrom(SqlColumn.create('x'), 1).toString()).toEqual(
        '"x" IS DISTINCT FROM 1',
      );
    });
  });

  describe('.in', () => {
    it('creates an IN comparison', () => {
      expect(SqlComparison.in(SqlColumn.create('x'), [1]).toString()).toEqual('"x" IN (1)');
      expect(SqlComparison.in(SqlColumn.create('x'), [1, 2, 3]).toString()).toEqual(
        '"x" IN (1, 2, 3)',
      );
    });
  });

  describe('.notIn', () => {
    it('creates a NOT IN comparison', () => {
      expect(SqlComparison.notIn(SqlColumn.create('x'), [1, 2, 3]).toString()).toEqual(
        '"x" NOT IN (1, 2, 3)',
      );
    });
  });

  describe('.like', () => {
    it('creates a LIKE comparison', () => {
      expect(SqlComparison.like('x', 'a%').toString()).toEqual(`'x' LIKE 'a%'`);
      expect(SqlComparison.like(SqlColumn.create('x'), 'a%').toString()).toEqual(`"x" LIKE 'a%'`);
    });

    it('adds an ESCAPE when given one', () => {
      const comparison = SqlComparison.like(SqlColumn.create('x'), 'a!%%', '!');

      expect(comparison.rhs).toBeInstanceOf(SqlLikePart);
      expect(comparison.toString()).toEqual(`"x" LIKE 'a!%%' ESCAPE '!'`);
    });
  });

  describe('.notLike', () => {
    it('creates a NOT LIKE comparison', () => {
      expect(SqlComparison.notLike(SqlColumn.create('x'), 'a%').toString()).toEqual(
        `"x" NOT LIKE 'a%'`,
      );
      expect(SqlComparison.notLike(SqlColumn.create('x'), 'a!%%', '!').toString()).toEqual(
        `"x" NOT LIKE 'a!%%' ESCAPE '!'`,
      );
    });
  });

  describe('.between', () => {
    it('creates a BETWEEN comparison', () => {
      expect(SqlComparison.between(SqlColumn.create('x'), 1, 5).toString()).toEqual(
        '"x" BETWEEN 1 AND 5',
      );
    });
  });

  describe('.notBetween', () => {
    it('creates a NOT BETWEEN comparison', () => {
      expect(SqlComparison.notBetween(SqlColumn.create('x'), 1, 5).toString()).toEqual(
        '"x" NOT BETWEEN 1 AND 5',
      );
    });
  });

  describe('.betweenSymmetric', () => {
    it('creates a BETWEEN SYMMETRIC comparison', () => {
      expect(SqlComparison.betweenSymmetric(SqlColumn.create('x'), 5, 1).toString()).toEqual(
        '"x" BETWEEN SYMMETRIC 5 AND 1',
      );
    });
  });

  describe('.notBetweenSymmetric', () => {
    it('creates a NOT BETWEEN SYMMETRIC comparison', () => {
      expect(SqlComparison.notBetweenSymmetric(SqlColumn.create('x'), 5, 1).toString()).toEqual(
        '"x" NOT BETWEEN SYMMETRIC 5 AND 1',
      );
    });
  });

  describe('.reverseOperator', () => {
    it('returns the opposite operator', () => {
      expect(SqlComparison.reverseOperator('<')).toEqual('>=');
      expect(SqlComparison.reverseOperator('>=')).toEqual('<');
      expect(SqlComparison.reverseOperator('IS DISTINCT FROM')).toEqual('IS NOT DISTINCT FROM');
      expect(SqlComparison.reverseOperator('NOT LIKE')).toEqual('LIKE');
      expect(SqlComparison.reverseOperator('BETWEEN')).toEqual('NOT BETWEEN');
    });
  });

  describe('#changeLhs', () => {
    it('replaces the left hand side', () => {
      const comparison = SqlExpression.parse('x  >  1') as SqlComparison;

      expect(comparison.changeLhs(SqlColumn.create('y')).toString()).toEqual('"y"  >  1');
    });
  });

  describe('#changeRhs', () => {
    it('replaces the right hand side', () => {
      const comparison = SqlExpression.parse('x  >  1') as SqlComparison;

      expect(comparison.changeRhs(SqlColumn.create('y')).toString()).toEqual('x  >  "y"');
    });
  });

  describe('#negate', () => {
    it('works', () => {
      expect(String(SqlExpression.parse('X = 1').negate())).toEqual('X <> 1');
      expect(String(SqlExpression.parse('X is NULL').negate())).toEqual('X IS NOT NULL');
      expect(String(SqlExpression.parse('X is not NULL').negate())).toEqual('X IS NULL');
      expect(String(SqlExpression.parse(`X in ('a', 'b')`).negate())).toEqual(
        `X NOT IN ('a', 'b')`,
      );
      expect(String(SqlExpression.parse(`X not in ('a', 'b')`).negate())).toEqual(
        `X IN ('a', 'b')`,
      );
    });

    it('flips the ALL / ANY decorator', () => {
      expect(String(SqlExpression.parse(`X = ANY (SELECT 1)`).negate())).toEqual(
        `X <> ALL (SELECT 1)`,
      );
      expect(String(SqlExpression.parse(`X < ALL (SELECT 1)`).negate())).toEqual(
        `X >= ANY (SELECT 1)`,
      );
    });
  });

  describe('#hasNot', () => {
    it('is true for the negated operators', () => {
      expect((SqlExpression.parse('x NOT IN (1)') as SqlComparison).hasNot()).toEqual(true);
      expect((SqlExpression.parse('x IS NOT NULL') as SqlComparison).hasNot()).toEqual(true);
      expect((SqlExpression.parse('x IN (1)') as SqlComparison).hasNot()).toEqual(false);
      expect((SqlExpression.parse('x <> 1') as SqlComparison).hasNot()).toEqual(false);
    });
  });

  describe('#getLikeMatchPattern', () => {
    const x = SqlExpression.parse('x');

    it('works', () => {
      expect(x.lessThan(4).getLikeMatchPattern()).toBeUndefined();
      expect(x.like('hello').getLikeMatchPattern()).toEqual('hello');
    });

    it('reads the pattern from a LIKE with ESCAPE', () => {
      expect(
        (SqlExpression.parse(`x LIKE 'a!%%' ESCAPE '!'`) as SqlComparison).getLikeMatchPattern(),
      ).toEqual('a!%%');
    });

    it('returns undefined when the pattern is not a literal', () => {
      expect(
        (SqlExpression.parse(`x LIKE y`) as SqlComparison).getLikeMatchPattern(),
      ).toBeUndefined();
      expect(
        (SqlExpression.parse(`x LIKE y ESCAPE '!'`) as SqlComparison).getLikeMatchPattern(),
      ).toBeUndefined();
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
      expect(x.like('%').getSpecialLikeType()).toEqual('includes');
      expect(x.like('%%hello%%').getSpecialLikeType()).toEqual('includes');
    });

    it('does not report a pattern with a wildcard in the middle', () => {
      expect(x.like('he%llo').getSpecialLikeType()).toBeUndefined();
      expect(x.like('hel_o%').getSpecialLikeType()).toBeUndefined();
    });

    it('treats escaped wildcards as plain characters', () => {
      expect(x.like('a!%', '!').getSpecialLikeType()).toEqual('exact');
      expect(x.like('!%a%', '!').getSpecialLikeType()).toEqual('prefix');
      expect(x.like('%a!_b', '!').getSpecialLikeType()).toEqual('postfix');
      expect(x.like('%a!!%', '!').getSpecialLikeType()).toEqual('includes');
      expect(SqlExpression.parse(`x LIKE 'a!%' ESCAPE '!'`).getSpecialLikeType()).toEqual('exact');
    });

    it('does not report a pattern with an unusable escape', () => {
      expect(x.like('a!', '!').getSpecialLikeType()).toBeUndefined();
      expect(x.like('a%', '!!').getSpecialLikeType()).toBeUndefined();
      expect(x.like('a%', SqlColumn.create('e')).getSpecialLikeType()).toBeUndefined();
    });
  });

  describe('#walk', () => {
    it('substitutes on both sides', () => {
      expect(
        SqlExpression.parse(`x BETWEEN a AND b`)
          .walk(ex => (ex instanceof SqlColumn ? SqlColumn.optionalQuotes(ex.getName() + '1') : ex))
          .toString(),
      ).toEqual(`x1 BETWEEN a1 AND b1`);
    });

    it('keeps the same instance when nothing changes', () => {
      const comparison = SqlExpression.parse(`x = 1`);

      expect(comparison.walk(ex => ex)).toBe(comparison);
    });

    it('stops when the callback returns nothing for either side', () => {
      const comparison = SqlExpression.parse(`x = y`);

      const seen: string[] = [];
      comparison.walk(ex => {
        seen.push(ex.toString());
        return ex instanceof SqlColumn && ex.getName() === 'x' ? undefined : ex;
      });
      expect(seen).toEqual(['x = y', 'x']);

      expect(
        comparison.walkPostorder(ex =>
          ex instanceof SqlColumn && ex.getName() === 'y' ? undefined : ex,
        ),
      ).toBe(comparison);
    });
  });
});
