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

describe('OR expression', () => {
  it('single expression with unquoted string', () => {
    const sql = `A OR B`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
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
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' OR 'B'`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "A",
            "type": "literal",
            "value": "A",
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "B",
            "type": "literal",
            "value": "B",
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
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" OR "B"`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlRef {
            "column": "A",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "\\"",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "B",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "\\"",
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
      }
    `);
  });

  it('single expression with numbers', () => {
    const sql = `1 OR 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
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
  });

  it('brackets', () => {
    const sql = `(1 OR 2)`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
        ],
        "expressionType": "OR",
        "innerSpacing": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
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
  });

  it('strange spacing and brackets', () => {
    const sql = `1   OR 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
        ],
        "expressionType": "OR",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": "   ",
            "right": " ",
            "separator": "OR",
          },
        ],
        "type": "multi",
      }
    `);
  });

  it('strange spacing and brackets', () => {
    const sql = `( 1   OR 2 )`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
        ],
        "expressionType": "OR",
        "innerSpacing": Object {},
        "parens": Array [
          Object {
            "leftSpacing": " ",
            "rightSpacing": " ",
          },
        ],
        "separators": Array [
          Separator {
            "left": "   ",
            "right": " ",
            "separator": "OR",
          },
        ],
        "type": "multi",
      }
    `);
  });
});

describe('AND expression', () => {
  it('single expression with unquoted string', () => {
    const sql = `A AND B`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
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
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A AND B"`);
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' AND 'B'`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "A",
            "type": "literal",
            "value": "A",
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "B",
            "type": "literal",
            "value": "B",
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
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"'A' AND 'B'"`);
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" AND "B"`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlRef {
            "column": "A",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "\\"",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "B",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "\\"",
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
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"\\"A\\" AND \\"B\\""`);
  });

  it('single expression with numbers', () => {
    const sql = `1 AND 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
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
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1 AND 2"`);
  });

  it('brackets', () => {
    const sql = `(1 AND 2)`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
        ],
        "expressionType": "AND",
        "innerSpacing": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "AND",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"(1 AND 2)"`);
  });
});

describe('Comparison expression', () => {
  it('single expression with unquoted string', () => {
    const sql = `A > B`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
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
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A > B"`);
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' > 'B'`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "A",
            "type": "literal",
            "value": "A",
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "B",
            "type": "literal",
            "value": "B",
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
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"'A' > 'B'"`);
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" > "B"`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlRef {
            "column": "A",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "\\"",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "B",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "\\"",
            "table": undefined,
            "tableQuotes": undefined,
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
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"\\"A\\" > \\"B\\""`);
  });

  it('single expression with numbers', () => {
    const sql = `1 > 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
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
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1 > 2"`);
  });

  it('brackets', () => {
    const sql = `(1 > 2)`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
        ],
        "expressionType": "Comparison",
        "innerSpacing": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": ">",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"(1 > 2)"`);
  });

  it('Between expression', () => {
    const sql = `X BETWEEN Y AND Z`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlRef {
            "column": "X",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlMulti {
            "arguments": Array [
              SqlRef {
                "column": "Y",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              SqlRef {
                "column": "Z",
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
        ],
        "expressionType": "Comparison",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "BETWEEN",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"X BETWEEN Y AND Z"`);
  });

  it('Mixed Between expression', () => {
    const sql = `A OR B AND X BETWEEN Y AND Z`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
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
              SqlMulti {
                "arguments": Array [
                  SqlRef {
                    "column": "X",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": undefined,
                    "quotes": "",
                    "table": undefined,
                    "tableQuotes": undefined,
                    "type": "ref",
                  },
                  SqlMulti {
                    "arguments": Array [
                      SqlRef {
                        "column": "Y",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": undefined,
                        "quotes": "",
                        "table": undefined,
                        "tableQuotes": undefined,
                        "type": "ref",
                      },
                      SqlRef {
                        "column": "Z",
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
                ],
                "expressionType": "Comparison",
                "innerSpacing": Object {},
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "BETWEEN",
                  },
                ],
                "type": "multi",
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
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A OR B AND X BETWEEN Y AND Z"`);
  });

  it('Nested Between expression', () => {
    const sql = `X BETWEEN Y AND A BETWEEN B AND C`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlRef {
            "column": "X",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlMulti {
            "arguments": Array [
              SqlRef {
                "column": "Y",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              SqlMulti {
                "arguments": Array [
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
                ],
                "expressionType": "Comparison",
                "innerSpacing": Object {},
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "BETWEEN",
                  },
                ],
                "type": "multi",
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
        ],
        "expressionType": "Comparison",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "BETWEEN",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"X BETWEEN Y AND A BETWEEN B AND C"`);
  });
});

describe('Math expression', () => {
  it('Addition', () => {
    const sql = `1 + 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
        ],
        "expressionType": "Additive",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "+",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1 + 2"`);
  });

  it('Subtraction', () => {
    const sql = `1 - 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
        ],
        "expressionType": "Additive",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "-",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1 - 2"`);
  });

  it('Multiplication', () => {
    const sql = `1 * 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
        ],
        "expressionType": "Multiplicative",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "*",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1 * 2"`);
  });

  it('Division', () => {
    const sql = `1 / 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
        ],
        "expressionType": "Multiplicative",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "/",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1 / 2"`);
  });

  it('single expression with unquoted string', () => {
    const sql = `A + B`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
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
        "expressionType": "Additive",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "+",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A + B"`);
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' + 'B'`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "A",
            "type": "literal",
            "value": "A",
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "B",
            "type": "literal",
            "value": "B",
          },
        ],
        "expressionType": "Additive",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "+",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"'A' + 'B'"`);
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" + "B"`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlRef {
            "column": "A",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "\\"",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "B",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "\\"",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "expressionType": "Additive",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "+",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"\\"A\\" + \\"B\\""`);
  });

  it('single expression with numbers', () => {
    const sql = `1 + 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
        ],
        "expressionType": "Additive",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "+",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1 + 2"`);
  });

  it('brackets', () => {
    const sql = `(1 + 2)`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
        ],
        "expressionType": "Additive",
        "innerSpacing": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "+",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"(1 + 2)"`);
  });
});

describe('Combined expression', () => {
  it('Every expression', () => {
    const sql = `A OR B AND C > D + E`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
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
              SqlMulti {
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
                  SqlMulti {
                    "arguments": Array [
                      SqlRef {
                        "column": "D",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": undefined,
                        "quotes": "",
                        "table": undefined,
                        "tableQuotes": undefined,
                        "type": "ref",
                      },
                      SqlRef {
                        "column": "E",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": undefined,
                        "quotes": "",
                        "table": undefined,
                        "tableQuotes": undefined,
                        "type": "ref",
                      },
                    ],
                    "expressionType": "Additive",
                    "innerSpacing": Object {},
                    "separators": Array [
                      Separator {
                        "left": " ",
                        "right": " ",
                        "separator": "+",
                      },
                    ],
                    "type": "multi",
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
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A OR B AND C > D + E"`);
  });

  it('Every expression out of order', () => {
    const sql = `A + B > C AND D OR E`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlMulti {
            "arguments": Array [
              SqlMulti {
                "arguments": Array [
                  SqlMulti {
                    "arguments": Array [
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
                    "expressionType": "Additive",
                    "innerSpacing": Object {},
                    "separators": Array [
                      Separator {
                        "left": " ",
                        "right": " ",
                        "separator": "+",
                      },
                    ],
                    "type": "multi",
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
              SqlRef {
                "column": "D",
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
          SqlRef {
            "column": "E",
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
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A + B > C AND D OR E"`);
  });

  it('Every expression out of order', () => {
    const sql = `A AND B > C + D OR E`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlMulti {
            "arguments": Array [
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
                  SqlMulti {
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
                        "column": "D",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": undefined,
                        "quotes": "",
                        "table": undefined,
                        "tableQuotes": undefined,
                        "type": "ref",
                      },
                    ],
                    "expressionType": "Additive",
                    "innerSpacing": Object {},
                    "separators": Array [
                      Separator {
                        "left": " ",
                        "right": " ",
                        "separator": "+",
                      },
                    ],
                    "type": "multi",
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
          SqlRef {
            "column": "E",
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
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A AND B > C + D OR E"`);
  });
});

describe('Multiple expressions', () => {
  it('Multiple Or ', () => {
    const sql = `A OR B OR C`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
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
          Separator {
            "left": " ",
            "right": " ",
            "separator": "OR",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A OR B OR C"`);
  });

  it('Multiple ANDs and ORs', () => {
    const sql = `A AND B OR C AND D OR E`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlMulti {
            "arguments": Array [
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
          SqlMulti {
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
                "column": "D",
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
          SqlRef {
            "column": "E",
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
          Separator {
            "left": " ",
            "right": " ",
            "separator": "OR",
          },
        ],
        "type": "multi",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A AND B OR C AND D OR E"`);
  });
});

describe('Brackets', () => {
  it('Changing order of operations', () => {
    const sql = `(A AND b) OR c`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlMulti {
            "arguments": Array [
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
              SqlRef {
                "column": "b",
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
            "parens": Array [
              Object {
                "leftSpacing": "",
                "rightSpacing": "",
              },
            ],
            "separators": Array [
              Separator {
                "left": " ",
                "right": " ",
                "separator": "AND",
              },
            ],
            "type": "multi",
          },
          SqlRef {
            "column": "c",
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
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"(A AND b) OR c"`);
  });

  it('Wrapping Expression', () => {
    const sql = `((A + b) OR c)`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlMulti {
            "arguments": Array [
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
              SqlRef {
                "column": "b",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
            ],
            "expressionType": "Additive",
            "innerSpacing": Object {},
            "parens": Array [
              Object {
                "leftSpacing": "",
                "rightSpacing": "",
              },
            ],
            "separators": Array [
              Separator {
                "left": " ",
                "right": " ",
                "separator": "+",
              },
            ],
            "type": "multi",
          },
          SqlRef {
            "column": "c",
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
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
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
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"((A + b) OR c)"`);
  });

  it('Changing order of operations', () => {
    const sql = `NOT NOT (A + b) OR c`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlUnary {
            "argument": SqlUnary {
              "argument": SqlMulti {
                "arguments": Array [
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
                  SqlRef {
                    "column": "b",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": undefined,
                    "quotes": "",
                    "table": undefined,
                    "tableQuotes": undefined,
                    "type": "ref",
                  },
                ],
                "expressionType": "Additive",
                "innerSpacing": Object {},
                "parens": Array [
                  Object {
                    "leftSpacing": "",
                    "rightSpacing": "",
                  },
                ],
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "+",
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
          },
          SqlRef {
            "column": "c",
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
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"NOT NOT (A + b) OR c"`);
  });
});

describe('remove function', () => {
  it('remove from single expression type flat', () => {
    const sql = `A OR B`;

    expect(
      parser(sql)
        .removeColumn('A')
        .toString(),
    ).toMatchInlineSnapshot(`"B"`);
  });
  it('remove from single expression type multiple', () => {
    const sql = `A OR B OR C`;

    expect(
      parser(sql)
        .removeColumn('A')
        .toString(),
    ).toMatchInlineSnapshot(`"B OR C"`);
  });
  it('remove from single expression type multiple', () => {
    const sql = `A OR B OR C`;

    expect(
      parser(sql)
        .removeColumn('C')
        .toString(),
    ).toMatchInlineSnapshot(`"A OR B"`);
  });
  it('remove from single expression type multiple nested', () => {
    const sql = `A AND D OR B OR C`;

    expect(
      parser(sql)
        .removeColumn('A')
        .toString(),
    ).toMatchInlineSnapshot(`"D OR B OR C"`);
  });
  it('remove nested comparison expression', () => {
    const sql = `A > 1 AND D OR B OR C`;

    expect(
      parser(sql)
        .removeColumn('A')
        .toString(),
    ).toMatchInlineSnapshot(`"D OR B OR C"`);
  });
});

describe('contains', () => {
  it('nested expression contains string', () => {
    const sql = `A > 1 AND D OR B OR C`;

    expect(parser(sql).containsColumn('A')).toMatchInlineSnapshot(`true`);
  });
  it('nested expression with brackets contains string', () => {
    const sql = `(A + B ) > 1 AND D OR B OR C`;

    expect(parser(sql).containsColumn('A')).toMatchInlineSnapshot(`true`);
  });
  it('nested expression with brackets contains string', () => {
    const sql = `(D + B ) > 1 AND D OR B OR C`;

    expect(parser(sql).containsColumn('A')).toMatchInlineSnapshot(`false`);
  });
});

describe('getSqlRefs', () => {
  it('Only multi expressions', () => {
    const sql = `A > 1 AND D OR B OR C`;

    expect(parser(sql).getSqlRefs('A')).toMatchInlineSnapshot(`
      Array [
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
        SqlRef {
          "column": "D",
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
      ]
    `);
  });
  it('includes unary expressions', () => {
    const sql = `A > 1 AND D OR B OR Not C`;

    expect(parser(sql).getSqlRefs('A')).toMatchInlineSnapshot(`
      Array [
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
        SqlRef {
          "column": "D",
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
      ]
    `);
  });
  it('includes unary expressions and nested Multi Expressions', () => {
    const sql = `A > 1 AND D OR B OR Not (C Or E)`;

    expect(parser(sql).getSqlRefs('A')).toMatchInlineSnapshot(`
      Array [
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
        SqlRef {
          "column": "D",
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
          "column": "E",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
      ]
    `);
  });
  it('Concat function', () => {
    const sql = `A || B || C`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A || B || C"`);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
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
        "expressionType": "Concat",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "||",
          },
          Separator {
            "left": " ",
            "right": " ",
            "separator": "||",
          },
        ],
        "type": "multi",
      }
    `);
  });
  it('IS function', () => {
    const sql = `REGEXP_EXTRACT("cityName", 'San') IS NULL`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(
      `"REGEXP_EXTRACT(\\"cityName\\", 'San') IS NULL"`,
    );

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlFunction {
            "arguments": Array [
              SqlRef {
                "column": "cityName",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "\\"",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              SqlLiteral {
                "innerSpacing": Object {},
                "stringValue": "San",
                "type": "literal",
                "value": "San",
              },
            ],
            "decorator": undefined,
            "filterKeyword": undefined,
            "functionName": "REGEXP_EXTRACT",
            "innerSpacing": Object {
              "postDecorator": "",
              "postFilterKeyword": "",
              "postFilterLeftParen": "",
              "postLeftParen": "",
              "postName": "",
              "postWhereKeyword": "",
              "preFilter": "",
              "preFilterRightParen": "",
              "preRightParen": "",
            },
            "separators": Array [
              Separator {
                "left": "",
                "right": " ",
                "separator": ",",
              },
            ],
            "type": "function",
            "whereExpression": undefined,
            "whereKeyword": undefined,
          },
          "NULL",
        ],
        "expressionType": "Comparison",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "IS",
          },
        ],
        "type": "multi",
      }
    `);
  });

  it('IS Not function', () => {
    const sql = `X IS NOT NULL`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`"X IS NOT NULL"`);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlRef {
            "column": "X",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          "NULL",
        ],
        "expressionType": "Comparison",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "IS NOT",
          },
        ],
        "type": "multi",
      }
    `);
  });
  it('Nested IS Not function', () => {
    const sql = `X IS NOT NULL AND X <> ''`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`"X IS NOT NULL AND X <> ''"`);

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlMulti {
            "arguments": Array [
              SqlRef {
                "column": "X",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "NULL",
            ],
            "expressionType": "Comparison",
            "innerSpacing": Object {},
            "separators": Array [
              Separator {
                "left": " ",
                "right": " ",
                "separator": "IS NOT",
              },
            ],
            "type": "multi",
          },
          SqlMulti {
            "arguments": Array [
              SqlRef {
                "column": "X",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              SqlLiteral {
                "innerSpacing": Object {},
                "stringValue": "",
                "type": "literal",
                "value": "",
              },
            ],
            "expressionType": "Comparison",
            "innerSpacing": Object {},
            "separators": Array [
              Separator {
                "left": " ",
                "right": " ",
                "separator": "<>",
              },
            ],
            "type": "multi",
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
      }
    `);
  });
});
