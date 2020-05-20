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

import { parseSql, SqlMulti } from '../../index';
import { backAndForth } from '../../test-utils';

describe('OR expression', () => {
  it('single expression with unquoted string', () => {
    const sql = `A OR B`;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": "'",
            "stringValue": "A",
            "type": "literal",
            "value": "A",
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": "'",
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

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
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

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
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

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
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

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' AND 'B'`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": "'",
            "stringValue": "A",
            "type": "literal",
            "value": "A",
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": "'",
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
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" AND "B"`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
  });

  it('single expression with numbers', () => {
    const sql = `1 AND 2`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
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
  });

  it('brackets', () => {
    const sql = `(1 AND 2)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
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
  });
});

describe('Comparison expression', () => {
  it('single expression with unquoted string', () => {
    const sql = `A > B`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' > 'B'`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": "'",
            "stringValue": "A",
            "type": "literal",
            "value": "A",
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": "'",
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
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" > "B"`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
  });

  it('single expression with numbers', () => {
    const sql = `1 > 2`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
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
  });

  it('brackets', () => {
    const sql = `(1 > 2)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
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
  });

  it('Between expression', () => {
    const sql = `X BETWEEN Y AND Z`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
  });

  it('Mixed Between expression', () => {
    const sql = `A OR B AND X BETWEEN Y AND Z`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
  });

  it('Nested Between expression', () => {
    const sql = `X BETWEEN Y AND A BETWEEN B AND C`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
  });
});

describe('Math expression', () => {
  it('Addition', () => {
    const sql = `1 + 2`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
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
  });

  it('Subtraction', () => {
    const sql = `1 - 2`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
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
  });

  it('Multiplication', () => {
    const sql = `1 * 2`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
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
  });

  it('Division', () => {
    const sql = `1 / 2`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
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
  });

  it('single expression with unquoted string', () => {
    const sql = `A + B`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' + 'B'`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": "'",
            "stringValue": "A",
            "type": "literal",
            "value": "A",
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": "'",
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
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" + "B"`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
  });

  it('single expression with numbers', () => {
    const sql = `1 + 2`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
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
  });

  it('brackets', () => {
    const sql = `(1 + 2)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          SqlLiteral {
            "innerSpacing": Object {},
            "quotes": undefined,
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
  });

  it('Decimal', () => {
    const sql = `COUNT(*) * 1.0 / COUNT(*)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "arguments": Array [
          SqlFunction {
            "arguments": Array [
              SqlRef {
                "column": "*",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
            ],
            "decorator": undefined,
            "filterKeyword": undefined,
            "functionName": "COUNT",
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
            "separators": Array [],
            "type": "function",
            "whereExpression": undefined,
            "whereKeyword": undefined,
          },
          SqlMulti {
            "arguments": Array [
              SqlLiteral {
                "innerSpacing": Object {},
                "quotes": undefined,
                "stringValue": "1.0",
                "type": "literal",
                "value": 1,
              },
              SqlFunction {
                "arguments": Array [
                  SqlRef {
                    "column": "*",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": undefined,
                    "quotes": "",
                    "table": undefined,
                    "tableQuotes": undefined,
                    "type": "ref",
                  },
                ],
                "decorator": undefined,
                "filterKeyword": undefined,
                "functionName": "COUNT",
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
                "separators": Array [],
                "type": "function",
                "whereExpression": undefined,
                "whereKeyword": undefined,
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
  });
});

describe('Combined expression', () => {
  it('Every expression', () => {
    const sql = `A OR B AND C > D + E`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
  });

  it('Every expression out of order', () => {
    const sql = `A + B > C AND D OR E`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
  });

  it('Every expression out of order', () => {
    const sql = `A AND B > C + D OR E`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
  });
});

describe('Multiple expressions', () => {
  it('Multiple Or ', () => {
    const sql = `A OR B OR C`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
  });

  it('Multiple ANDs and ORs', () => {
    const sql = `A AND B OR C AND D OR E`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
  });
});

describe('Brackets', () => {
  it('Changing order of operations', () => {
    const sql = `(A AND b) OR c`;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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

    backAndForth(sql);
  });

  it('Wrapping Expression', () => {
    const sql = `((A + b) OR c)`;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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

    backAndForth(sql);
  });

  it('Changing order of operations', () => {
    const sql = `NOT NOT (A + b) OR c`;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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

    backAndForth(sql);
  });
});

describe('remove function', () => {
  it('remove from single expression type flat', () => {
    const sql = `A OR B`;

    expect((parseSql(sql) as SqlMulti).removeColumn('A')!.toString()).toMatchInlineSnapshot(`"B"`);
  });

  it('remove from single expression type multiple', () => {
    const sql = `A OR B OR C`;

    expect((parseSql(sql) as SqlMulti).removeColumn('A')!.toString()).toMatchInlineSnapshot(
      `"B OR C"`,
    );
  });

  it('remove from single expression type multiple', () => {
    const sql = `A OR B OR C`;

    expect((parseSql(sql) as SqlMulti).removeColumn('C')!.toString()).toMatchInlineSnapshot(
      `"A OR B"`,
    );
  });

  it('remove from single expression type multiple nested', () => {
    const sql = `A AND D OR B OR C`;

    expect((parseSql(sql) as SqlMulti).removeColumn('A')!.toString()).toMatchInlineSnapshot(
      `"D OR B OR C"`,
    );
  });

  it('remove nested comparison expression', () => {
    const sql = `A > 1 AND D OR B OR C`;

    expect((parseSql(sql) as SqlMulti).removeColumn('A')!.toString()).toMatchInlineSnapshot(
      `"D OR B OR C"`,
    );
  });
});

describe('contains', () => {
  it('nested expression contains string', () => {
    const sql = `A > 1 AND D OR B OR C`;

    expect((parseSql(sql) as SqlMulti).containsColumn('A')).toMatchInlineSnapshot(`true`);
  });

  it('nested expression with brackets contains string', () => {
    const sql = `(A + B ) > 1 AND D OR B OR C`;

    expect((parseSql(sql) as SqlMulti).containsColumn('A')).toMatchInlineSnapshot(`true`);
  });

  it('nested expression with brackets contains string', () => {
    const sql = `(D + B ) > 1 AND D OR B OR C`;

    expect((parseSql(sql) as SqlMulti).containsColumn('A')).toMatchInlineSnapshot(`false`);
  });
});

describe('getSqlRefs', () => {
  it('Only multi expressions', () => {
    const sql = `A > 1 AND D OR B OR C`;

    expect((parseSql(sql) as SqlMulti).getSqlRefs()).toMatchInlineSnapshot(`
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

    expect((parseSql(sql) as SqlMulti).getSqlRefs()).toMatchInlineSnapshot(`
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

    expect((parseSql(sql) as SqlMulti).getSqlRefs()).toMatchInlineSnapshot(`
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
    const sql = `X IS NULL`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
            "quotes": undefined,
            "stringValue": "NULL",
            "type": "literal",
            "value": null,
          },
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

  it('IS NOT function', () => {
    const sql = `X IS NOT NULL`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
            "quotes": undefined,
            "stringValue": "NULL",
            "type": "literal",
            "value": null,
          },
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
              SqlLiteral {
                "innerSpacing": Object {},
                "quotes": undefined,
                "stringValue": "NULL",
                "type": "literal",
                "value": null,
              },
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
                "quotes": "'",
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
