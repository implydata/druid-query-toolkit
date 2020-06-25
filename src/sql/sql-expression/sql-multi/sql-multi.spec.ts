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

import { parseSql, parseSqlExpression } from '../../..';
import { backAndForth } from '../../../test-utils';

describe('OR expression', () => {
  it('single expression with unquoted string', () => {
    const sql = `A OR B`;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            SqlRef {
              "column": "B",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' OR 'B'`;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "'A'",
              "type": "literal",
              "value": "A",
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "'B'",
              "type": "literal",
              "value": "B",
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" OR "B"`;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": true,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            SqlRef {
              "column": "B",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": true,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with numbers', () => {
    const sql = `1 OR 2`;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('brackets', () => {
    const sql = `(1 OR 2)`;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
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
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "   ",
              "right": " ",
              "separator": "OR",
            },
          ],
          "values": Array [
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('strange spacing and brackets', () => {
    const sql = `( 1   OR 2 )`;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "   ",
              "right": " ",
              "separator": "OR",
            },
          ],
          "values": Array [
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
        "parens": Array [
          Object {
            "leftSpacing": " ",
            "rightSpacing": " ",
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
              "column": "A",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            SqlRef {
              "column": "B",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
          ],
        },
        "expressionType": "AND",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' AND 'B'`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "'A'",
              "type": "literal",
              "value": "A",
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "'B'",
              "type": "literal",
              "value": "B",
            },
          ],
        },
        "expressionType": "AND",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" AND "B"`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
              "column": "A",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": true,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            SqlRef {
              "column": "B",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": true,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
          ],
        },
        "expressionType": "AND",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with numbers', () => {
    const sql = `1 AND 2`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "expressionType": "AND",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('brackets', () => {
    const sql = `(1 AND 2)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "expressionType": "AND",
        "innerSpacing": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
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
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "+",
            },
          ],
          "values": Array [
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "expressionType": "Additive",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('Subtraction', () => {
    const sql = `1 - 2`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "expressionType": "Additive",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('Multiplication', () => {
    const sql = `1 * 2`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "*",
            },
          ],
          "values": Array [
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "expressionType": "Multiplicative",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('Division', () => {
    const sql = `1 / 2`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "/",
            },
          ],
          "values": Array [
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "expressionType": "Multiplicative",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with unquoted string', () => {
    const sql = `A + B`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "+",
            },
          ],
          "values": Array [
            SqlRef {
              "column": "A",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            SqlRef {
              "column": "B",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
          ],
        },
        "expressionType": "Additive",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' + 'B'`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "+",
            },
          ],
          "values": Array [
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "'A'",
              "type": "literal",
              "value": "A",
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "'B'",
              "type": "literal",
              "value": "B",
            },
          ],
        },
        "expressionType": "Additive",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" + "B"`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "+",
            },
          ],
          "values": Array [
            SqlRef {
              "column": "A",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": true,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            SqlRef {
              "column": "B",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": true,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
          ],
        },
        "expressionType": "Additive",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with numbers', () => {
    const sql = `1 + 2`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "+",
            },
          ],
          "values": Array [
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "expressionType": "Additive",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('brackets', () => {
    const sql = `(1 + 2)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "+",
            },
          ],
          "values": Array [
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "expressionType": "Additive",
        "innerSpacing": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
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
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "*",
            },
          ],
          "values": Array [
            SqlFunction {
              "args": SeparatedArray {
                "separators": Array [],
                "values": Array [
                  SqlRef {
                    "column": "*",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                ],
              },
              "decorator": undefined,
              "filterKeyword": undefined,
              "functionName": "COUNT",
              "innerSpacing": Object {
                "postArguments": "",
                "postLeftParen": "",
                "preLeftParen": "",
              },
              "specialParen": undefined,
              "type": "function",
              "whereExpression": undefined,
              "whereKeyword": undefined,
            },
            SqlMulti {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "/",
                  },
                ],
                "values": Array [
                  SqlLiteral {
                    "innerSpacing": Object {},
                    "keyword": undefined,
                    "stringValue": "1.0",
                    "type": "literal",
                    "value": 1,
                  },
                  SqlFunction {
                    "args": SeparatedArray {
                      "separators": Array [],
                      "values": Array [
                        SqlRef {
                          "column": "*",
                          "innerSpacing": Object {},
                          "namespace": undefined,
                          "namespaceQuotes": false,
                          "quotes": false,
                          "table": undefined,
                          "tableQuotes": false,
                          "type": "ref",
                        },
                      ],
                    },
                    "decorator": undefined,
                    "filterKeyword": undefined,
                    "functionName": "COUNT",
                    "innerSpacing": Object {
                      "postArguments": "",
                      "postLeftParen": "",
                      "preLeftParen": "",
                    },
                    "specialParen": undefined,
                    "type": "function",
                    "whereExpression": undefined,
                    "whereKeyword": undefined,
                  },
                ],
              },
              "expressionType": "Multiplicative",
              "innerSpacing": Object {},
              "type": "multi",
            },
          ],
        },
        "expressionType": "Multiplicative",
        "innerSpacing": Object {},
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
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
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
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  SqlComparison {
                    "innerSpacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "lhs": SqlRef {
                      "column": "C",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "notKeyword": undefined,
                    "op": ">",
                    "rhs": SqlMulti {
                      "args": SeparatedArray {
                        "separators": Array [
                          Separator {
                            "left": " ",
                            "right": " ",
                            "separator": "+",
                          },
                        ],
                        "values": Array [
                          SqlRef {
                            "column": "D",
                            "innerSpacing": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "table": undefined,
                            "tableQuotes": false,
                            "type": "ref",
                          },
                          SqlRef {
                            "column": "E",
                            "innerSpacing": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "table": undefined,
                            "tableQuotes": false,
                            "type": "ref",
                          },
                        ],
                      },
                      "expressionType": "Additive",
                      "innerSpacing": Object {},
                      "type": "multi",
                    },
                    "type": "comparison",
                  },
                ],
              },
              "expressionType": "AND",
              "innerSpacing": Object {},
              "type": "multi",
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('Every expression out of order', () => {
    const sql = `A + B > C AND D OR E`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
                  SqlComparison {
                    "innerSpacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "lhs": SqlMulti {
                      "args": SeparatedArray {
                        "separators": Array [
                          Separator {
                            "left": " ",
                            "right": " ",
                            "separator": "+",
                          },
                        ],
                        "values": Array [
                          SqlRef {
                            "column": "A",
                            "innerSpacing": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "table": undefined,
                            "tableQuotes": false,
                            "type": "ref",
                          },
                          SqlRef {
                            "column": "B",
                            "innerSpacing": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "table": undefined,
                            "tableQuotes": false,
                            "type": "ref",
                          },
                        ],
                      },
                      "expressionType": "Additive",
                      "innerSpacing": Object {},
                      "type": "multi",
                    },
                    "notKeyword": undefined,
                    "op": ">",
                    "rhs": SqlRef {
                      "column": "C",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "type": "comparison",
                  },
                  SqlRef {
                    "column": "D",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                ],
              },
              "expressionType": "AND",
              "innerSpacing": Object {},
              "type": "multi",
            },
            SqlRef {
              "column": "E",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('Every expression out of order', () => {
    const sql = `A AND B > C + D OR E`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
                    "column": "A",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  SqlComparison {
                    "innerSpacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "lhs": SqlRef {
                      "column": "B",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "notKeyword": undefined,
                    "op": ">",
                    "rhs": SqlMulti {
                      "args": SeparatedArray {
                        "separators": Array [
                          Separator {
                            "left": " ",
                            "right": " ",
                            "separator": "+",
                          },
                        ],
                        "values": Array [
                          SqlRef {
                            "column": "C",
                            "innerSpacing": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "table": undefined,
                            "tableQuotes": false,
                            "type": "ref",
                          },
                          SqlRef {
                            "column": "D",
                            "innerSpacing": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "table": undefined,
                            "tableQuotes": false,
                            "type": "ref",
                          },
                        ],
                      },
                      "expressionType": "Additive",
                      "innerSpacing": Object {},
                      "type": "multi",
                    },
                    "type": "comparison",
                  },
                ],
              },
              "expressionType": "AND",
              "innerSpacing": Object {},
              "type": "multi",
            },
            SqlRef {
              "column": "E",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
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
        "args": SeparatedArray {
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
          "values": Array [
            SqlRef {
              "column": "A",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            SqlRef {
              "column": "B",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            SqlRef {
              "column": "C",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('Multiple ANDs and ORs', () => {
    const sql = `A AND B OR C AND D OR E`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
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
                  SqlRef {
                    "column": "A",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  SqlRef {
                    "column": "B",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                ],
              },
              "expressionType": "AND",
              "innerSpacing": Object {},
              "type": "multi",
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
                    "column": "C",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  SqlRef {
                    "column": "D",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                ],
              },
              "expressionType": "AND",
              "innerSpacing": Object {},
              "type": "multi",
            },
            SqlRef {
              "column": "E",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
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
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "OR",
            },
          ],
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
                  SqlRef {
                    "column": "A",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  SqlRef {
                    "column": "b",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                ],
              },
              "expressionType": "AND",
              "innerSpacing": Object {},
              "parens": Array [
                Object {
                  "leftSpacing": "",
                  "rightSpacing": "",
                },
              ],
              "type": "multi",
            },
            SqlRef {
              "column": "c",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);

    backAndForth(sql);
  });

  it('Wrapping Expression', () => {
    const sql = `((A + b) OR c)`;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
            SqlMulti {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "+",
                  },
                ],
                "values": Array [
                  SqlRef {
                    "column": "A",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  SqlRef {
                    "column": "b",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                ],
              },
              "expressionType": "Additive",
              "innerSpacing": Object {},
              "parens": Array [
                Object {
                  "leftSpacing": "",
                  "rightSpacing": "",
                },
              ],
              "type": "multi",
            },
            SqlRef {
              "column": "c",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
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
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "OR",
            },
          ],
          "values": Array [
            SqlUnary {
              "arg": SqlUnary {
                "arg": SqlMulti {
                  "args": SeparatedArray {
                    "separators": Array [
                      Separator {
                        "left": " ",
                        "right": " ",
                        "separator": "+",
                      },
                    ],
                    "values": Array [
                      SqlRef {
                        "column": "A",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": false,
                        "quotes": false,
                        "table": undefined,
                        "tableQuotes": false,
                        "type": "ref",
                      },
                      SqlRef {
                        "column": "b",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": false,
                        "quotes": false,
                        "table": undefined,
                        "tableQuotes": false,
                        "type": "ref",
                      },
                    ],
                  },
                  "expressionType": "Additive",
                  "innerSpacing": Object {},
                  "parens": Array [
                    Object {
                      "leftSpacing": "",
                      "rightSpacing": "",
                    },
                  ],
                  "type": "multi",
                },
                "innerSpacing": Object {
                  "postKeyword": " ",
                },
                "keyword": "NOT",
                "type": "unary",
              },
              "innerSpacing": Object {
                "postKeyword": " ",
              },
              "keyword": "NOT",
              "type": "unary",
            },
            SqlRef {
              "column": "c",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
          ],
        },
        "expressionType": "OR",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);

    backAndForth(sql);
  });
});

describe.skip('#removeColumnFromAnd', () => {
  it('remove from single expression not AND', () => {
    const sql = `A > 1`;

    expect(String(parseSqlExpression(sql).removeColumnFromAnd('A'))).toEqual('undefined');
    expect(String(parseSqlExpression(sql).removeColumnFromAnd('B'))).toEqual('A > 1');
  });

  it('remove from simple AND', () => {
    const sql = `A AND B`;

    expect(String(parseSqlExpression(sql).removeColumnFromAnd('A'))).toEqual('A');
  });

  it('remove from single expression type multiple', () => {
    const sql = `A AND B AND C`;

    expect(String(parseSqlExpression(sql).removeColumnFromAnd('A'))).toEqual('B AND C');
  });

  it('remove from more complex AND', () => {
    const sql = `A AND B > 1 AND C`;

    expect(String(parseSqlExpression(sql).removeColumnFromAnd('C'))).toEqual('A AND B > 1');
  });

  it('remove nested comparison expression', () => {
    const sql = `(A > 1 OR D) AND B AND C`;

    expect(String(parseSqlExpression(sql).removeColumnFromAnd('A'))).toEqual('B AND C');
  });
});

describe('containsColumn', () => {
  it('nested expression', () => {
    const sql = `A > 1 AND D OR B OR C`;

    expect(parseSqlExpression(sql).containsColumn('A')).toEqual(true);
  });

  it('nested expression with brackets', () => {
    const sql = `(A + B ) > 1 AND D OR B OR C`;

    expect(parseSqlExpression(sql).containsColumn('A')).toEqual(true);
  });

  it('nested expression with brackets', () => {
    const sql = `(D + B ) > 1 AND D OR B OR C`;

    expect(parseSqlExpression(sql).containsColumn('A')).toEqual(false);
  });
});

describe('getSqlRefs', () => {
  it('Only multi expressions', () => {
    const sql = `A > 1 AND D OR B OR C`;

    expect(parseSqlExpression(sql).getSqlRefs()).toMatchInlineSnapshot(`
      Array [
        SqlRef {
          "column": "A",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        SqlRef {
          "column": "D",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        SqlRef {
          "column": "B",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        SqlRef {
          "column": "C",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
      ]
    `);
  });

  it('includes unary expressions', () => {
    const sql = `A > 1 AND D OR B OR Not C`;

    expect(parseSqlExpression(sql).getSqlRefs()).toMatchInlineSnapshot(`
      Array [
        SqlRef {
          "column": "A",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        SqlRef {
          "column": "D",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        SqlRef {
          "column": "B",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        SqlRef {
          "column": "C",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
      ]
    `);
  });

  it('includes unary expressions and nested Multi Expressions', () => {
    const sql = `A > 1 AND D OR B OR Not (C Or E)`;

    expect(parseSqlExpression(sql).getSqlRefs()).toMatchInlineSnapshot(`
      Array [
        SqlRef {
          "column": "A",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        SqlRef {
          "column": "D",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        SqlRef {
          "column": "B",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        SqlRef {
          "column": "C",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        SqlRef {
          "column": "E",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
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
        "args": SeparatedArray {
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
          "values": Array [
            SqlRef {
              "column": "A",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            SqlRef {
              "column": "B",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            SqlRef {
              "column": "C",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
          ],
        },
        "expressionType": "Concat",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('IS function', () => {
    const sql = `X IS NULL`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        "notKeyword": undefined,
        "op": "IS",
        "rhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "NULL",
          "type": "literal",
          "value": null,
        },
        "type": "comparison",
      }
    `);
  });

  it('IS NOT NULL', () => {
    const sql = `X IS NOT NULL`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "not": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        "notKeyword": "NOT",
        "op": "IS",
        "rhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "NULL",
          "type": "literal",
          "value": null,
        },
        "type": "comparison",
      }
    `);
  });

  it('IS NOT TRUE', () => {
    const sql = `X IS NOT TRUE`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "innerSpacing": Object {
          "not": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "lhs": SqlRef {
          "column": "X",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": false,
          "quotes": false,
          "table": undefined,
          "tableQuotes": false,
          "type": "ref",
        },
        "notKeyword": "NOT",
        "op": "IS",
        "rhs": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "TRUE",
          "type": "literal",
          "value": true,
        },
        "type": "comparison",
      }
    `);
  });

  it('Nested IS Not function', () => {
    const sql = `X IS NOT NULL AND X <> ''`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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
            SqlComparison {
              "innerSpacing": Object {
                "not": " ",
                "postOp": " ",
                "preOp": " ",
              },
              "lhs": SqlRef {
                "column": "X",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "notKeyword": "NOT",
              "op": "IS",
              "rhs": SqlLiteral {
                "innerSpacing": Object {},
                "keyword": undefined,
                "stringValue": "NULL",
                "type": "literal",
                "value": null,
              },
              "type": "comparison",
            },
            SqlComparison {
              "innerSpacing": Object {
                "postOp": " ",
                "preOp": " ",
              },
              "lhs": SqlRef {
                "column": "X",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "notKeyword": undefined,
              "op": "<>",
              "rhs": SqlLiteral {
                "innerSpacing": Object {},
                "keyword": undefined,
                "stringValue": "''",
                "type": "literal",
                "value": "",
              },
              "type": "comparison",
            },
          ],
        },
        "expressionType": "AND",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });
});
