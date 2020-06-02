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

describe('Case expression', () => {
  it('simple CASE Expression', () => {
    const sql = `CASE A WHEN B THEN C END`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlCaseSimple {
        "caseExpression": SqlRef {
          "column": "A",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "caseKeyword": "CASE",
        "elseExpression": undefined,
        "elseKeyword": undefined,
        "endKeyword": "END",
        "innerSpacing": Object {
          "postCase": " ",
          "postCaseExpression": " ",
          "postElse": "",
          "postWhenThen": "",
          "preEnd": " ",
        },
        "type": "caseSimple",
        "whenThenParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlWhenThenPart {
              "innerSpacing": Object {
                "postThen": " ",
                "postWhen": " ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
                "column": "C",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "thenKeyword": "THEN",
              "type": "whenThenPart",
              "whenExpression": SqlRef {
                "column": "B",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "whenKeyword": "WHEN",
            },
          ],
        },
      }
    `);
  });

  it('simple CASE Expression with ELSE', () => {
    const sql = `CASE A WHEN B THEN C ELSE D END`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlCaseSimple {
        "caseExpression": SqlRef {
          "column": "A",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "caseKeyword": "CASE",
        "elseExpression": SqlRef {
          "column": "D",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "elseKeyword": "ELSE",
        "endKeyword": "END",
        "innerSpacing": Object {
          "postCase": " ",
          "postCaseExpression": " ",
          "postElse": " ",
          "postWhenThen": " ",
          "preEnd": " ",
        },
        "type": "caseSimple",
        "whenThenParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlWhenThenPart {
              "innerSpacing": Object {
                "postThen": " ",
                "postWhen": " ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
                "column": "C",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "thenKeyword": "THEN",
              "type": "whenThenPart",
              "whenExpression": SqlRef {
                "column": "B",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "whenKeyword": "WHEN",
            },
          ],
        },
      }
    `);
  });

  it('simple CASE Expression with weird spacing', () => {
    const sql = `CASE A  WHEN     B THEN C      END`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlCaseSimple {
        "caseExpression": SqlRef {
          "column": "A",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "caseKeyword": "CASE",
        "elseExpression": undefined,
        "elseKeyword": undefined,
        "endKeyword": "END",
        "innerSpacing": Object {
          "postCase": " ",
          "postCaseExpression": "  ",
          "postElse": "",
          "postWhenThen": "",
          "preEnd": "      ",
        },
        "type": "caseSimple",
        "whenThenParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlWhenThenPart {
              "innerSpacing": Object {
                "postThen": " ",
                "postWhen": "     ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
                "column": "C",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "thenKeyword": "THEN",
              "type": "whenThenPart",
              "whenExpression": SqlRef {
                "column": "B",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "whenKeyword": "WHEN",
            },
          ],
        },
      }
    `);
  });

  it('simple CASE Expression with brackets', () => {
    const sql = `(CASE A WHEN B THEN C END)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlCaseSimple {
        "caseExpression": SqlRef {
          "column": "A",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "caseKeyword": "CASE",
        "elseExpression": undefined,
        "elseKeyword": undefined,
        "endKeyword": "END",
        "innerSpacing": Object {
          "postCase": " ",
          "postCaseExpression": " ",
          "postElse": "",
          "postWhenThen": "",
          "preEnd": " ",
        },
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "type": "caseSimple",
        "whenThenParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlWhenThenPart {
              "innerSpacing": Object {
                "postThen": " ",
                "postWhen": " ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
                "column": "C",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "thenKeyword": "THEN",
              "type": "whenThenPart",
              "whenExpression": SqlRef {
                "column": "B",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "whenKeyword": "WHEN",
            },
          ],
        },
      }
    `);
  });

  it('simple CASE Expression with brackets and weird spacing', () => {
    const sql = `(   CASE   A WHEN   B THEN C END  )`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlCaseSimple {
        "caseExpression": SqlRef {
          "column": "A",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "caseKeyword": "CASE",
        "elseExpression": undefined,
        "elseKeyword": undefined,
        "endKeyword": "END",
        "innerSpacing": Object {
          "postCase": "   ",
          "postCaseExpression": " ",
          "postElse": "",
          "postWhenThen": "",
          "preEnd": " ",
        },
        "parens": Array [
          Object {
            "leftSpacing": "   ",
            "rightSpacing": "  ",
          },
        ],
        "type": "caseSimple",
        "whenThenParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlWhenThenPart {
              "innerSpacing": Object {
                "postThen": " ",
                "postWhen": "   ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlRef {
                "column": "C",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "thenKeyword": "THEN",
              "type": "whenThenPart",
              "whenExpression": SqlRef {
                "column": "B",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "whenKeyword": "WHEN",
            },
          ],
        },
      }
    `);
  });

  it('simple CASE Expression with complex expressions', () => {
    const sql = `(   CASE   A WHEN  B AND B THEN C OR C END  )`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlCaseSimple {
        "caseExpression": SqlRef {
          "column": "A",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "caseKeyword": "CASE",
        "elseExpression": undefined,
        "elseKeyword": undefined,
        "endKeyword": "END",
        "innerSpacing": Object {
          "postCase": "   ",
          "postCaseExpression": " ",
          "postElse": "",
          "postWhenThen": "",
          "preEnd": " ",
        },
        "parens": Array [
          Object {
            "leftSpacing": "   ",
            "rightSpacing": "  ",
          },
        ],
        "type": "caseSimple",
        "whenThenParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlWhenThenPart {
              "innerSpacing": Object {
                "postThen": " ",
                "postWhen": "  ",
                "postWhenExpression": " ",
              },
              "thenExpression": SqlMulti {
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
                      "column": "C",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "",
                      "table": undefined,
                      "tableQuotes": undefined,
                      "type": "ref",
                    },
                    SqlRef {
                      "column": "C",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "",
                      "table": undefined,
                      "tableQuotes": undefined,
                      "type": "ref",
                    },
                  ],
                },
                "expressionType": "OR",
                "innerSpacing": Object {},
                "type": "multi",
              },
              "thenKeyword": "THEN",
              "type": "whenThenPart",
              "whenExpression": SqlMulti {
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
                  ],
                },
                "expressionType": "AND",
                "innerSpacing": Object {},
                "type": "multi",
              },
              "whenKeyword": "WHEN",
            },
          ],
        },
      }
    `);
  });
});
