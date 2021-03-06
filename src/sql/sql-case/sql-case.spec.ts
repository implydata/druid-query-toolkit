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

describe('CaseExpression', () => {
  it('things that work', () => {
    const queries: string[] = [
      `CASE WHEN (A) THEN 'hello' END`,
      `CASE WHEN TIMESTAMP '2019-08-27 18:00:00'<=(t."__time") AND (t."__time")<TIMESTAMP '2019-08-28 00:00:00' THEN (t."__time") END`,
      `CASE WHEN (3<="__time") THEN 1 END`,
      `CASE WHEN (TIMESTAMP '2019-08-27 18:00:00'<=(t."__time") AND (t."__time")<TIMESTAMP '2019-08-28 00:00:00') THEN (t."__time") END`,
    ];

    for (const sql of queries) {
      try {
        backAndForth(sql);
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
              "spacing": Object {
                "postThen": " ",
                "postWhen": " ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
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
              "type": "whenThenPart",
              "whenExpression": SqlRef {
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
        "caseExpression": SqlRef {
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
        "elseExpression": undefined,
        "keywords": Object {
          "case": "CASE",
          "end": "END",
        },
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
              "spacing": Object {
                "postThen": " ",
                "postWhen": " ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
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
              "type": "whenThenPart",
              "whenExpression": SqlRef {
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
        "caseExpression": SqlRef {
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
        "elseExpression": SqlRef {
          "columnRefName": RefName {
            "name": "D",
            "quotes": false,
          },
          "keywords": Object {},
          "namespaceRefName": undefined,
          "spacing": Object {},
          "tableRefName": undefined,
          "type": "ref",
        },
        "keywords": Object {
          "case": "CASE",
          "else": "ELSE",
          "end": "END",
        },
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
              "spacing": Object {
                "postThen": " ",
                "postWhen": " ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
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
              "type": "whenThenPart",
              "whenExpression": SqlRef {
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
        "caseExpression": SqlRef {
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
        "elseExpression": undefined,
        "keywords": Object {
          "case": "CASE",
          "end": "END",
        },
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
              "spacing": Object {
                "postThen": " ",
                "postWhen": "     ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
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
              "type": "whenThenPart",
              "whenExpression": SqlRef {
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
        "caseExpression": SqlRef {
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
              "spacing": Object {
                "postThen": " ",
                "postWhen": " ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
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
              "type": "whenThenPart",
              "whenExpression": SqlRef {
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
        "caseExpression": SqlRef {
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
              "spacing": Object {
                "postThen": " ",
                "postWhen": "   ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
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
              "type": "whenThenPart",
              "whenExpression": SqlRef {
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
        "caseExpression": SqlRef {
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
              "spacing": Object {
                "postThen": " ",
                "postWhen": "  ",
                "postWhenExpression": " ",
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
                    SqlRef {
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
                    SqlRef {
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
                  ],
                },
                "keywords": Object {},
                "op": "OR",
                "spacing": Object {},
                "type": "multi",
              },
              "type": "whenThenPart",
              "whenExpression": SqlMulti {
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
                    SqlRef {
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
                  ],
                },
                "keywords": Object {},
                "op": "AND",
                "spacing": Object {},
                "type": "multi",
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
              "spacing": Object {
                "postThen": " ",
                "postWhen": " ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
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
              "type": "whenThenPart",
              "whenExpression": SqlRef {
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
        "elseExpression": SqlRef {
          "columnRefName": RefName {
            "name": "D",
            "quotes": false,
          },
          "keywords": Object {},
          "namespaceRefName": undefined,
          "spacing": Object {},
          "tableRefName": undefined,
          "type": "ref",
        },
        "keywords": Object {
          "case": "CASE",
          "else": "ELSE",
          "end": "END",
        },
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
              "spacing": Object {
                "postThen": " ",
                "postWhen": " ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
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
              "type": "whenThenPart",
              "whenExpression": SqlRef {
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
        "caseExpression": SqlRef {
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
        "elseExpression": undefined,
        "keywords": Object {
          "case": "CASE",
          "end": "END",
        },
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
              "spacing": Object {
                "postThen": " ",
                "postWhen": "     ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
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
              "type": "whenThenPart",
              "whenExpression": SqlRef {
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
        "caseExpression": SqlRef {
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
              "spacing": Object {
                "postThen": " ",
                "postWhen": " ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
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
              "type": "whenThenPart",
              "whenExpression": SqlRef {
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
        "caseExpression": SqlRef {
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
              "spacing": Object {
                "postThen": " ",
                "postWhen": "   ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
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
              "type": "whenThenPart",
              "whenExpression": SqlRef {
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
        "caseExpression": SqlRef {
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
              "spacing": Object {
                "postThen": " ",
                "postWhen": "  ",
                "postWhenExpression": " ",
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
                    SqlRef {
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
                    SqlRef {
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
                  ],
                },
                "keywords": Object {},
                "op": "OR",
                "spacing": Object {},
                "type": "multi",
              },
              "type": "whenThenPart",
              "whenExpression": SqlMulti {
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
                    SqlRef {
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
                  ],
                },
                "keywords": Object {},
                "op": "AND",
                "spacing": Object {},
                "type": "multi",
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
        "caseExpression": SqlRef {
          "columnRefName": RefName {
            "name": "runner_status",
            "quotes": true,
          },
          "keywords": Object {},
          "namespaceRefName": undefined,
          "spacing": Object {},
          "tableRefName": undefined,
          "type": "ref",
        },
        "elseExpression": SqlLiteral {
          "keywords": Object {},
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
              "spacing": Object {
                "postThen": " ",
                "postWhen": " ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlLiteral {
                "keywords": Object {},
                "spacing": Object {},
                "stringValue": "4",
                "type": "literal",
                "value": 4,
              },
              "type": "whenThenPart",
              "whenExpression": SqlLiteral {
                "keywords": Object {},
                "spacing": Object {},
                "stringValue": "'RUNNING'",
                "type": "literal",
                "value": "RUNNING",
              },
            },
          ],
        },
      }
    `);
  });
});
