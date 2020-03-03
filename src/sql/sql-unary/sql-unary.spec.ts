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
import { FUNCTIONS } from '../../test-utils';

const parser = sqlParserFactory(FUNCTIONS);

describe('Not expression', () => {
  it('single not expression', () => {
    const sql = `NOT B`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlUnary {
        "argument": SqlRef {
          "innerSpacing": Object {},
          "name": "B",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "expressionType": "NOT",
        "innerSpacing": Object {
          "postKeyword": " ",
        },
        "keyword": "NOT",
        "type": "unaryExpression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"NOT B"`);
  });

  it('multiple not expressions', () => {
    const sql = `NOT A AND NOT B AND NOT C`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlUnary {
            "argument": SqlRef {
              "innerSpacing": Object {},
              "name": "A",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "expressionType": "NOT",
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "NOT",
            "type": "unaryExpression",
          },
          SqlUnary {
            "argument": SqlRef {
              "innerSpacing": Object {},
              "name": "B",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "expressionType": "NOT",
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "NOT",
            "type": "unaryExpression",
          },
          SqlUnary {
            "argument": SqlRef {
              "innerSpacing": Object {},
              "name": "C",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "expressionType": "NOT",
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "NOT",
            "type": "unaryExpression",
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
          Separator {
            "left": " ",
            "right": " ",
            "separator": "AND",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"NOT A AND NOT B AND NOT C"`);
  });

  it('Not containing an expression', () => {
    const sql = `NOT A > B`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlUnary {
        "argument": SqlMulti {
          "arguments": Array [
            SqlRef {
              "innerSpacing": Object {},
              "name": "A",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            SqlRef {
              "innerSpacing": Object {},
              "name": "B",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
          ],
          "expressionType": "Comparison",
          "innerSpacing": Object {},
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": ">",
            },
          ],
          "type": "multi",
        },
        "expressionType": "NOT",
        "innerSpacing": Object {
          "postKeyword": " ",
        },
        "keyword": "NOT",
        "type": "unaryExpression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"NOT A > B"`);
  });

  it('Multiple Not expressions containing an expression', () => {
    const sql = `NOT A > B OR Not C = 'D'`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlUnary {
            "argument": SqlMulti {
              "arguments": Array [
                SqlRef {
                  "innerSpacing": Object {},
                  "name": "A",
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "type": "ref",
                },
                SqlRef {
                  "innerSpacing": Object {},
                  "name": "B",
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "type": "ref",
                },
              ],
              "expressionType": "Comparison",
              "innerSpacing": Object {},
              "separators": Array [
                Separator {
                  "left": " ",
                  "right": " ",
                  "separator": ">",
                },
              ],
              "type": "multi",
            },
            "expressionType": "NOT",
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "NOT",
            "type": "unaryExpression",
          },
          SqlUnary {
            "argument": SqlMulti {
              "arguments": Array [
                SqlRef {
                  "innerSpacing": Object {},
                  "name": "C",
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "type": "ref",
                },
                SqlLiteral {
                  "innerSpacing": Object {},
                  "stringValue": "D",
                  "type": "literal",
                  "value": "D",
                },
              ],
              "expressionType": "Comparison",
              "innerSpacing": Object {},
              "separators": Array [
                Separator {
                  "left": " ",
                  "right": " ",
                  "separator": "=",
                },
              ],
              "type": "multi",
            },
            "expressionType": "NOT",
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "Not",
            "type": "unaryExpression",
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
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"NOT A > B OR Not C = 'D'"`);
  });

  it('Nested Not Expressions', () => {
    const sql = `NOT NOT A > B`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlUnary {
        "argument": SqlUnary {
          "argument": SqlMulti {
            "arguments": Array [
              SqlRef {
                "innerSpacing": Object {},
                "name": "A",
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "type": "ref",
              },
              SqlRef {
                "innerSpacing": Object {},
                "name": "B",
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "type": "ref",
              },
            ],
            "expressionType": "Comparison",
            "innerSpacing": Object {},
            "separators": Array [
              Separator {
                "left": " ",
                "right": " ",
                "separator": ">",
              },
            ],
            "type": "multi",
          },
          "expressionType": "NOT",
          "innerSpacing": Object {
            "postKeyword": " ",
          },
          "keyword": "NOT",
          "type": "unaryExpression",
        },
        "expressionType": "NOT",
        "innerSpacing": Object {
          "postKeyword": " ",
        },
        "keyword": "NOT",
        "type": "unaryExpression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"NOT NOT A > B"`);
  });
});
