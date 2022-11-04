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
import { SqlCase, SqlExpression } from '..';

describe('CaseExpression', () => {
  it('things that work', () => {
    const queries: string[] = [
      `CASE WHEN (A) THEN 'hello' END`,
      `CASE WHEN TIMESTAMP '2019-08-27 18:00:00'<=(t."__time") AND (t."__time")<TIMESTAMP '2019-08-28 00:00:00' THEN (t."__time") END`,
      `CASE WHEN (3<="__time") THEN 1 END`,
      `CASE WHEN (TIMESTAMP '2019-08-27 18:00:00'<=(t."__time") AND (t."__time")<TIMESTAMP '2019-08-28 00:00:00') THEN (t."__time") END`,
      `CASE country WHEN 'United States', 'Argentina' THEN 'US' ELSE 'Blah' END`,
    ];

    for (const sql of queries) {
      try {
        backAndForth(sql, SqlCase);
      } catch (e) {
        console.log(`Problem with: \`${sql}\``);
        throw e;
      }
    }
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
