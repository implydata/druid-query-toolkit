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

import { sqlParserFactory } from '../../index';
import { backAndForth } from '../../test-utils';

const parser = sqlParserFactory();

describe('Case expression', () => {
  it('searched CASE', () => {
    const sql = `CASE WHEN B THEN C END`;

    backAndForth(sql);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlCaseSearched {
        "caseKeyword": "CASE",
        "elseExpression": undefined,
        "elseKeyword": undefined,
        "endKeyword": "END",
        "innerSpacing": Object {
          "postCase": " ",
          "postElse": "",
          "postWhenThen": "",
          "preEnd": " ",
        },
        "postWhenThenUnitSpaces": Array [],
        "type": "caseSearched",
        "whenThenUnits": Array [
          Object {
            "postThenSpace": " ",
            "postWhenExpressionSpace": " ",
            "postWhenSpace": " ",
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
      }
    `);
  });

  it('searched CASE with Else', () => {
    const sql = `CASE WHEN B THEN C ELSE D END`;

    backAndForth(sql);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlCaseSearched {
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
          "postElse": " ",
          "postWhenThen": " ",
          "preEnd": " ",
        },
        "postWhenThenUnitSpaces": Array [],
        "type": "caseSearched",
        "whenThenUnits": Array [
          Object {
            "postThenSpace": " ",
            "postWhenExpressionSpace": " ",
            "postWhenSpace": " ",
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
      }
    `);
  });

  it('simple CASE Expression with weird spacing', () => {
    const sql = `CASE A  WHEN     B THEN C      END`;

    backAndForth(sql);

    expect(parser(sql)).toMatchInlineSnapshot(`
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
        "postWhenThenUnits": Array [],
        "type": "caseSimple",
        "whenThenUnits": Array [
          Object {
            "postThenSpace": " ",
            "postWhenExpressionSpace": " ",
            "postWhenSpace": "     ",
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
      }
    `);
  });

  it('simple CASE Expression with brackets', () => {
    const sql = `(CASE A WHEN B THEN C END)`;

    backAndForth(sql);

    expect(parser(sql)).toMatchInlineSnapshot(`
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
        "postWhenThenUnits": Array [],
        "type": "caseSimple",
        "whenThenUnits": Array [
          Object {
            "postThenSpace": " ",
            "postWhenExpressionSpace": " ",
            "postWhenSpace": " ",
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
      }
    `);
  });

  it('simple CASE Expression with brackets and weird spacing', () => {
    const sql = `(   CASE   A WHEN   B THEN C END  )`;

    backAndForth(sql);

    expect(parser(sql)).toMatchInlineSnapshot(`
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
        "postWhenThenUnits": Array [],
        "type": "caseSimple",
        "whenThenUnits": Array [
          Object {
            "postThenSpace": " ",
            "postWhenExpressionSpace": " ",
            "postWhenSpace": "   ",
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
      }
    `);
  });

  it('simple CASE Expression with complex expressions', () => {
    const sql = `(   CASE   A WHEN  B AND B THEN C OR C END  )`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(
      `"(   CASE   A WHEN  B AND B THEN C OR C END  )"`,
    );
    expect(parser(sql)).toMatchInlineSnapshot(`
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
        "postWhenThenUnits": Array [],
        "type": "caseSimple",
        "whenThenUnits": Array [
          Object {
            "postThenSpace": " ",
            "postWhenExpressionSpace": " ",
            "postWhenSpace": "  ",
            "thenExpression": SqlMulti {
              "arguments": Array [
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
              "expressionType": "OR",
              "innerSpacing": Object {},
              "separators": Array [
                Separator {
                  "left": " ",
                  "right": " ",
                  "separator": "OR",
                },
              ],
              "type": "multi",
            },
            "thenKeyword": "THEN",
            "whenExpression": SqlMulti {
              "arguments": Array [
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
              "expressionType": "AND",
              "innerSpacing": Object {},
              "separators": Array [
                Separator {
                  "left": " ",
                  "right": " ",
                  "separator": "AND",
                },
              ],
              "type": "multi",
            },
            "whenKeyword": "WHEN",
          },
        ],
      }
    `);
  });

  it('nested searched CASE', () => {
    const sql = 'CASE "runner_status" WHEN \'RUNNING\' THEN 4 ELSE 2 END';
    expect(parser(sql).toString()).toMatchInlineSnapshot(
      `"CASE \\"runner_status\\" WHEN 'RUNNING' THEN 4 ELSE 2 END"`,
    );
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlCaseSimple {
        "caseExpression": SqlRef {
          "column": "runner_status",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "\\"",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "caseKeyword": "CASE",
        "elseExpression": SqlLiteral {
          "innerSpacing": Object {},
          "quotes": undefined,
          "stringValue": "2",
          "type": "literal",
          "value": 2,
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
        "postWhenThenUnits": Array [],
        "type": "caseSimple",
        "whenThenUnits": Array [
          Object {
            "postThenSpace": " ",
            "postWhenExpressionSpace": " ",
            "postWhenSpace": " ",
            "thenExpression": SqlLiteral {
              "innerSpacing": Object {},
              "quotes": undefined,
              "stringValue": "4",
              "type": "literal",
              "value": 4,
            },
            "thenKeyword": "THEN",
            "whenExpression": SqlLiteral {
              "innerSpacing": Object {},
              "quotes": "'",
              "stringValue": "RUNNING",
              "type": "literal",
              "value": "RUNNING",
            },
            "whenKeyword": "WHEN",
          },
        ],
      }
    `);
  });
});
