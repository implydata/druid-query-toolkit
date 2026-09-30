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
import type { SqlBase } from '..';
import { SeparatedArray, SqlCase, SqlColumn, SqlExpression, SqlWhenThenPart } from '..';

describe('SqlCase', () => {
  describe('parses', () => {
    it.each([
      `CASE WHEN (A) THEN 'hello' END`,
      `CASE WHEN TIMESTAMP '2019-08-27 18:00:00'<=(t."__time") AND (t."__time")<TIMESTAMP '2019-08-28 00:00:00' THEN (t."__time") END`,
      `CASE WHEN (3<="__time") THEN 1 END`,
      `CASE WHEN (TIMESTAMP '2019-08-27 18:00:00'<=(t."__time") AND (t."__time")<TIMESTAMP '2019-08-28 00:00:00') THEN (t."__time") END`,
      `CASE country WHEN 'United States', 'Argentina' THEN 'US' ELSE 'Blah' END`,
    ])('does back and forth with %s', sql => {
      backAndForth(sql, SqlCase);
    });

    it('caseless CASE Expression', () => {
      const sql = `CASE WHEN B THEN C END`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlCase {
          "caseExpression": undefined,
          "elseExpression": undefined,
          "keywords": Object {
            "case": "CASE",
            "end": "END",
          },
          "parens": undefined,
          "spacing": Object {
            "postCase": " ",
            "preEnd": " ",
          },
          "type": "case",
          "whenThenParts": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlWhenThenPart {
                "keywords": Object {
                  "then": "THEN",
                  "when": "WHEN",
                },
                "parens": undefined,
                "spacing": Object {
                  "postThen": " ",
                  "postWhen": " ",
                  "postWhenExpressions": " ",
                },
                "thenExpression": SqlColumn {
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
                "type": "whenThenPart",
                "whenExpressions": SeparatedArray {
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
              },
            ],
          },
        }
      `);
    });

    it('simple CASE Expression', () => {
      const sql = `CASE A WHEN B THEN C END`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlCase {
          "caseExpression": SqlColumn {
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
          "elseExpression": undefined,
          "keywords": Object {
            "case": "CASE",
            "end": "END",
          },
          "parens": undefined,
          "spacing": Object {
            "postCase": " ",
            "postCaseExpression": " ",
            "preEnd": " ",
          },
          "type": "case",
          "whenThenParts": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlWhenThenPart {
                "keywords": Object {
                  "then": "THEN",
                  "when": "WHEN",
                },
                "parens": undefined,
                "spacing": Object {
                  "postThen": " ",
                  "postWhen": " ",
                  "postWhenExpressions": " ",
                },
                "thenExpression": SqlColumn {
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
                "type": "whenThenPart",
                "whenExpressions": SeparatedArray {
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
              },
            ],
          },
        }
      `);
    });

    it('simple CASE Expression with ELSE', () => {
      const sql = `CASE A WHEN B THEN C ELSE D END`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlCase {
          "caseExpression": SqlColumn {
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
          "elseExpression": SqlColumn {
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
          "keywords": Object {
            "case": "CASE",
            "else": "ELSE",
            "end": "END",
          },
          "parens": undefined,
          "spacing": Object {
            "postCase": " ",
            "postCaseExpression": " ",
            "postElse": " ",
            "preElse": " ",
            "preEnd": " ",
          },
          "type": "case",
          "whenThenParts": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlWhenThenPart {
                "keywords": Object {
                  "then": "THEN",
                  "when": "WHEN",
                },
                "parens": undefined,
                "spacing": Object {
                  "postThen": " ",
                  "postWhen": " ",
                  "postWhenExpressions": " ",
                },
                "thenExpression": SqlColumn {
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
                "type": "whenThenPart",
                "whenExpressions": SeparatedArray {
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
              },
            ],
          },
        }
      `);
    });

    it('simple CASE Expression with weird spacing', () => {
      const sql = `CASE A  WHEN     B THEN C      END`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlCase {
          "caseExpression": SqlColumn {
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
          "elseExpression": undefined,
          "keywords": Object {
            "case": "CASE",
            "end": "END",
          },
          "parens": undefined,
          "spacing": Object {
            "postCase": " ",
            "postCaseExpression": "  ",
            "preEnd": "      ",
          },
          "type": "case",
          "whenThenParts": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlWhenThenPart {
                "keywords": Object {
                  "then": "THEN",
                  "when": "WHEN",
                },
                "parens": undefined,
                "spacing": Object {
                  "postThen": " ",
                  "postWhen": "     ",
                  "postWhenExpressions": " ",
                },
                "thenExpression": SqlColumn {
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
                "type": "whenThenPart",
                "whenExpressions": SeparatedArray {
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
              },
            ],
          },
        }
      `);
    });

    it('simple CASE Expression with brackets', () => {
      const sql = `(CASE A WHEN B THEN C END)`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlCase {
          "caseExpression": SqlColumn {
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
          "elseExpression": undefined,
          "keywords": Object {
            "case": "CASE",
            "end": "END",
          },
          "parens": Array [
            Object {
              "leftSpacing": "",
              "rightSpacing": "",
            },
          ],
          "spacing": Object {
            "postCase": " ",
            "postCaseExpression": " ",
            "preEnd": " ",
          },
          "type": "case",
          "whenThenParts": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlWhenThenPart {
                "keywords": Object {
                  "then": "THEN",
                  "when": "WHEN",
                },
                "parens": undefined,
                "spacing": Object {
                  "postThen": " ",
                  "postWhen": " ",
                  "postWhenExpressions": " ",
                },
                "thenExpression": SqlColumn {
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
                "type": "whenThenPart",
                "whenExpressions": SeparatedArray {
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
              },
            ],
          },
        }
      `);
    });

    it('simple CASE Expression with brackets and weird spacing', () => {
      const sql = `(   CASE   A WHEN   B THEN C END  )`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlCase {
          "caseExpression": SqlColumn {
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
          "elseExpression": undefined,
          "keywords": Object {
            "case": "CASE",
            "end": "END",
          },
          "parens": Array [
            Object {
              "leftSpacing": "   ",
              "rightSpacing": "  ",
            },
          ],
          "spacing": Object {
            "postCase": "   ",
            "postCaseExpression": " ",
            "preEnd": " ",
          },
          "type": "case",
          "whenThenParts": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlWhenThenPart {
                "keywords": Object {
                  "then": "THEN",
                  "when": "WHEN",
                },
                "parens": undefined,
                "spacing": Object {
                  "postThen": " ",
                  "postWhen": "   ",
                  "postWhenExpressions": " ",
                },
                "thenExpression": SqlColumn {
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
                "type": "whenThenPart",
                "whenExpressions": SeparatedArray {
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
              },
            ],
          },
        }
      `);
    });

    it('simple CASE Expression with complex expressions', () => {
      const sql = `(   CASE   A WHEN  B AND B THEN C OR C END  )`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlCase {
          "caseExpression": SqlColumn {
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
          "elseExpression": undefined,
          "keywords": Object {
            "case": "CASE",
            "end": "END",
          },
          "parens": Array [
            Object {
              "leftSpacing": "   ",
              "rightSpacing": "  ",
            },
          ],
          "spacing": Object {
            "postCase": "   ",
            "postCaseExpression": " ",
            "preEnd": " ",
          },
          "type": "case",
          "whenThenParts": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlWhenThenPart {
                "keywords": Object {
                  "then": "THEN",
                  "when": "WHEN",
                },
                "parens": undefined,
                "spacing": Object {
                  "postThen": " ",
                  "postWhen": "  ",
                  "postWhenExpressions": " ",
                },
                "thenExpression": SqlMulti {
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
                },
                "type": "whenThenPart",
                "whenExpressions": SeparatedArray {
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
                  ],
                },
              },
            ],
          },
        }
      `);
    });

    it('searched CASE', () => {
      const sql = `CASE WHEN B THEN C END`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlCase {
          "caseExpression": undefined,
          "elseExpression": undefined,
          "keywords": Object {
            "case": "CASE",
            "end": "END",
          },
          "parens": undefined,
          "spacing": Object {
            "postCase": " ",
            "preEnd": " ",
          },
          "type": "case",
          "whenThenParts": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlWhenThenPart {
                "keywords": Object {
                  "then": "THEN",
                  "when": "WHEN",
                },
                "parens": undefined,
                "spacing": Object {
                  "postThen": " ",
                  "postWhen": " ",
                  "postWhenExpressions": " ",
                },
                "thenExpression": SqlColumn {
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
                "type": "whenThenPart",
                "whenExpressions": SeparatedArray {
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
              },
            ],
          },
        }
      `);
    });

    it('searched CASE with Else', () => {
      const sql = `CASE WHEN B THEN C ELSE D END`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlCase {
          "caseExpression": undefined,
          "elseExpression": SqlColumn {
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
          "keywords": Object {
            "case": "CASE",
            "else": "ELSE",
            "end": "END",
          },
          "parens": undefined,
          "spacing": Object {
            "postCase": " ",
            "postElse": " ",
            "preElse": " ",
            "preEnd": " ",
          },
          "type": "case",
          "whenThenParts": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlWhenThenPart {
                "keywords": Object {
                  "then": "THEN",
                  "when": "WHEN",
                },
                "parens": undefined,
                "spacing": Object {
                  "postThen": " ",
                  "postWhen": " ",
                  "postWhenExpressions": " ",
                },
                "thenExpression": SqlColumn {
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
                "type": "whenThenPart",
                "whenExpressions": SeparatedArray {
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
              },
            ],
          },
        }
      `);
    });

    it('nested searched CASE', () => {
      const sql = 'CASE "runner_status" WHEN \'RUNNING\' THEN 4 ELSE 2 END';

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlCase {
          "caseExpression": SqlColumn {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "runner_status",
              "quotes": true,
            },
            "spacing": Object {},
            "table": undefined,
            "type": "column",
          },
          "elseExpression": SqlLiteral {
            "keywords": Object {},
            "parens": undefined,
            "spacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
          "keywords": Object {
            "case": "CASE",
            "else": "ELSE",
            "end": "END",
          },
          "parens": undefined,
          "spacing": Object {
            "postCase": " ",
            "postCaseExpression": " ",
            "postElse": " ",
            "preElse": " ",
            "preEnd": " ",
          },
          "type": "case",
          "whenThenParts": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlWhenThenPart {
                "keywords": Object {
                  "then": "THEN",
                  "when": "WHEN",
                },
                "parens": undefined,
                "spacing": Object {
                  "postThen": " ",
                  "postWhen": " ",
                  "postWhenExpressions": " ",
                },
                "thenExpression": SqlLiteral {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "stringValue": "4",
                  "type": "literal",
                  "value": 4,
                },
                "type": "whenThenPart",
                "whenExpressions": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlLiteral {
                      "keywords": Object {},
                      "parens": undefined,
                      "spacing": Object {},
                      "stringValue": "'RUNNING'",
                      "type": "literal",
                      "value": "RUNNING",
                    },
                  ],
                },
              },
            ],
          },
        }
      `);
    });
  });

  describe('.ifThenElse', () => {
    it('works', () => {
      // Test with condition, then, and else
      const condition = SqlExpression.parse('x > 5');
      const thenExpr = SqlExpression.parse('"result is true"');
      const elseExpr = SqlExpression.parse('"result is false"');

      expect(SqlCase.ifThenElse(condition, thenExpr, elseExpr).toString()).toEqual(
        'CASE WHEN x > 5 THEN "result is true" ELSE "result is false" END',
      );

      // Test with literal values
      expect(SqlCase.ifThenElse(condition, 'yes', 'no').toString()).toEqual(
        `CASE WHEN x > 5 THEN 'yes' ELSE 'no' END`,
      );

      // Test numeric literals
      expect(SqlCase.ifThenElse(condition, 1, 0).toString()).toEqual(
        'CASE WHEN x > 5 THEN 1 ELSE 0 END',
      );

      // Test without else expression
      expect(SqlCase.ifThenElse(condition, thenExpr).toString()).toEqual(
        'CASE WHEN x > 5 THEN "result is true" END',
      );
    });
  });

  describe('#changeCaseExpression', () => {
    it('replaces the case expression', () => {
      expect(
        SqlExpression.parse(`CASE x WHEN 1 THEN 'a' END`)
          .apply(ex => (ex as SqlCase).changeCaseExpression(SqlColumn.create('y')))
          .toString(),
      ).toEqual(`CASE "y" WHEN 1 THEN 'a' END`);
    });

    it('adds a case expression to a caseless CASE', () => {
      expect(
        SqlCase.ifThenElse(SqlExpression.parse('1'), 'a')
          .changeCaseExpression(SqlColumn.create('y'))
          .toString(),
      ).toEqual(`CASE "y" WHEN 1 THEN 'a' END`);
    });
  });

  describe('#changeWhenThenParts', () => {
    it('replaces the when/then parts', () => {
      const c = SqlExpression.parse(`CASE WHEN a THEN 1 ELSE 0 END`) as SqlCase;
      expect(
        c
          .changeWhenThenParts(
            SeparatedArray.fromArray([
              SqlWhenThenPart.create(SqlExpression.parse('b'), 2),
              SqlWhenThenPart.create(SqlExpression.parse('c'), 3),
            ]),
          )
          .toString(),
      ).toEqual('CASE WHEN b THEN 2 WHEN c THEN 3 ELSE 0 END');
    });
  });

  describe('#changeElseExpression', () => {
    it('replaces the else expression', () => {
      const c = SqlExpression.parse(`CASE WHEN a THEN 1 else  0 END`) as SqlCase;
      expect(c.changeElseExpression(SqlExpression.parse('-1')).toString()).toEqual(
        'CASE WHEN a THEN 1 else  -1 END',
      );
    });

    it('adds an else expression', () => {
      expect(
        SqlCase.ifThenElse(SqlExpression.parse('a'), 1)
          .changeElseExpression(SqlExpression.parse('0'))
          .toString(),
      ).toEqual('CASE WHEN a THEN 1 ELSE 0 END');
    });
  });

  describe('#_walkInner', () => {
    const c = SqlExpression.parse(`CASE x WHEN a THEN b ELSE y END`) as SqlCase;

    function upperUnless(stopAt?: string) {
      return (ex: SqlBase): SqlBase | undefined => {
        if (!(ex instanceof SqlColumn)) return ex;
        if (ex.getName() === stopAt) return;
        return ex.changeName(ex.getName().toUpperCase());
      };
    }

    it('returns the same instance when nothing changes', () => {
      expect(c.walk(ex => ex)).toBe(c);
    });

    it('substitutes in the case, when/then and else expressions', () => {
      expect(c.walk(upperUnless()).toString()).toEqual('CASE X WHEN A THEN B ELSE Y END');
    });

    it('visits the parts in order', () => {
      const seen: string[] = [];
      c.walk(ex => {
        if (ex instanceof SqlColumn) seen.push(ex.getName());
        return ex;
      });
      expect(seen).toEqual(['x', 'a', 'b', 'y']);
    });

    it.each(['x', 'a', 'y'])('abandons all changes when %s aborts the walk', stopAt => {
      expect(c.walk(upperUnless(stopAt))).toBe(c);
    });
  });

  describe('#clearOwnSeparators', () => {
    it('resets the spacing between when/then parts', () => {
      const c = SqlExpression.parse(`CASE WHEN a THEN 1\n  WHEN b THEN 2 END`) as SqlCase;
      expect(c.clearOwnSeparators().toString()).toEqual('CASE WHEN a THEN 1 WHEN b THEN 2 END');
    });
  });
});
