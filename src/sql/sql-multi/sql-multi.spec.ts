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

import { SqlExpression } from '../..';
import { backAndForth } from '../../test-utils';

describe('OR expression', () => {
  it('single expression with unquoted string', () => {
    const sql = `A OR B`;

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
            SqlRef {
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
        "op": "OR",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' OR 'B'`;

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
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "'A'",
              "type": "literal",
              "value": "A",
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "'B'",
              "type": "literal",
              "value": "B",
            },
          ],
        },
        "keywords": Object {},
        "op": "OR",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" OR "B"`;

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
            SqlRef {
              "columnRefName": RefName {
                "name": "A",
                "quotes": true,
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
                "quotes": true,
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
      }
    `);
  });

  it('single expression with numbers', () => {
    const sql = `1 OR 2`;

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
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "keywords": Object {},
        "op": "OR",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('brackets', () => {
    const sql = `(1 OR 2)`;

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
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "keywords": Object {},
        "op": "OR",
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('strange spacing and brackets', () => {
    const sql = `1   OR 2`;

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "keywords": Object {},
        "op": "OR",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('strange spacing and brackets', () => {
    const sql = `( 1   OR 2 )`;

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "keywords": Object {},
        "op": "OR",
        "parens": Array [
          Object {
            "leftSpacing": " ",
            "rightSpacing": " ",
          },
        ],
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });
});

describe('AND expression', () => {
  it('single expression with unquoted string', () => {
    const sql = `A AND B`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
      }
    `);
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' AND 'B'`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "'A'",
              "type": "literal",
              "value": "A",
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "'B'",
              "type": "literal",
              "value": "B",
            },
          ],
        },
        "keywords": Object {},
        "op": "AND",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" AND "B"`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "columnRefName": RefName {
                "name": "A",
                "quotes": true,
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
                "quotes": true,
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
      }
    `);
  });

  it('single expression with numbers', () => {
    const sql = `1 AND 2`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "keywords": Object {},
        "op": "AND",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('brackets', () => {
    const sql = `(1 AND 2)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "keywords": Object {},
        "op": "AND",
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });
});

describe('Math expression', () => {
  it('Addition', () => {
    const sql = `1 + 2`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "keywords": Object {},
        "op": "+",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('Subtraction', () => {
    const sql = `1 - 2`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "keywords": Object {},
        "op": "-",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('Multiplication', () => {
    const sql = `1 * 2`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "keywords": Object {},
        "op": "*",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('Division', () => {
    const sql = `1 / 2`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "keywords": Object {},
        "op": "/",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with unquoted string', () => {
    const sql = `A + B`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
        "op": "+",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' + 'B'`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "'A'",
              "type": "literal",
              "value": "A",
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "'B'",
              "type": "literal",
              "value": "B",
            },
          ],
        },
        "keywords": Object {},
        "op": "+",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" + "B"`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "columnRefName": RefName {
                "name": "A",
                "quotes": true,
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
                "quotes": true,
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
        "op": "+",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('single expression with numbers', () => {
    const sql = `1 + 2`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "keywords": Object {},
        "op": "+",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('brackets', () => {
    const sql = `(1 + 2)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
          ],
        },
        "keywords": Object {},
        "op": "+",
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('Decimal', () => {
    const sql = `COUNT(*) * 1.0 / COUNT(*)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
                  SqlStar {
                    "keywords": Object {},
                    "namespaceRefName": undefined,
                    "spacing": Object {},
                    "tableRefName": undefined,
                    "type": "star",
                  },
                ],
              },
              "decorator": undefined,
              "functionName": "COUNT",
              "keywords": Object {
                "functionName": "COUNT",
              },
              "spacing": Object {
                "postArguments": "",
                "postLeftParen": "",
                "preLeftParen": "",
              },
              "specialParen": undefined,
              "type": "function",
              "whereClause": undefined,
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
                    "keywords": Object {},
                    "spacing": Object {},
                    "stringValue": "1.0",
                    "type": "literal",
                    "value": 1,
                  },
                  SqlFunction {
                    "args": SeparatedArray {
                      "separators": Array [],
                      "values": Array [
                        SqlStar {
                          "keywords": Object {},
                          "namespaceRefName": undefined,
                          "spacing": Object {},
                          "tableRefName": undefined,
                          "type": "star",
                        },
                      ],
                    },
                    "decorator": undefined,
                    "functionName": "COUNT",
                    "keywords": Object {
                      "functionName": "COUNT",
                    },
                    "spacing": Object {
                      "postArguments": "",
                      "postLeftParen": "",
                      "preLeftParen": "",
                    },
                    "specialParen": undefined,
                    "type": "function",
                    "whereClause": undefined,
                  },
                ],
              },
              "keywords": Object {},
              "op": "/",
              "spacing": Object {},
              "type": "multi",
            },
          ],
        },
        "keywords": Object {},
        "op": "*",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });
});

describe('Combined expression', () => {
  it('Every expression', () => {
    const sql = `A OR B AND C > D + E`;

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
            SqlRef {
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
                  SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": ">",
                    },
                    "lhs": SqlRef {
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
                    "not": false,
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
                          SqlRef {
                            "columnRefName": RefName {
                              "name": "E",
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
                      "op": "+",
                      "spacing": Object {},
                      "type": "multi",
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
              "spacing": Object {},
              "type": "multi",
            },
          ],
        },
        "keywords": Object {},
        "op": "OR",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('Every expression out of order', () => {
    const sql = `A + B > C AND D OR E`;

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
                    "decorator": undefined,
                    "keywords": Object {
                      "op": ">",
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
                      "op": "+",
                      "spacing": Object {},
                      "type": "multi",
                    },
                    "not": false,
                    "op": ">",
                    "rhs": SqlRef {
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
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
                  },
                  SqlRef {
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
                ],
              },
              "keywords": Object {},
              "op": "AND",
              "spacing": Object {},
              "type": "multi",
            },
            SqlRef {
              "columnRefName": RefName {
                "name": "E",
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
      }
    `);
  });

  it('Every expression out of order', () => {
    const sql = `A AND B > C + D OR E`;

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
                  SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": ">",
                    },
                    "lhs": SqlRef {
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
                    "not": false,
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
                              "name": "D",
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
                      "op": "+",
                      "spacing": Object {},
                      "type": "multi",
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
              "spacing": Object {},
              "type": "multi",
            },
            SqlRef {
              "columnRefName": RefName {
                "name": "E",
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
      }
    `);
  });
});

describe('Multiple expressions', () => {
  it('Multiple Or ', () => {
    const sql = `A OR B OR C`;

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
            Separator {
              "left": " ",
              "right": " ",
              "separator": "OR",
            },
          ],
          "values": Array [
            SqlRef {
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
      }
    `);
  });

  it('Multiple ANDs and ORs', () => {
    const sql = `A AND B OR C AND D OR E`;

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
                      "name": "D",
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
            SqlRef {
              "columnRefName": RefName {
                "name": "E",
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
      }
    `);
  });
});

describe('Brackets', () => {
  it('Changing order of operations', () => {
    const sql = `(A AND b) OR c`;

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
                  SqlRef {
                    "columnRefName": RefName {
                      "name": "b",
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
              "parens": Array [
                Object {
                  "leftSpacing": "",
                  "rightSpacing": "",
                },
              ],
              "spacing": Object {},
              "type": "multi",
            },
            SqlRef {
              "columnRefName": RefName {
                "name": "c",
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
      }
    `);

    backAndForth(sql);
  });

  it('Wrapping Expression', () => {
    const sql = `((A + b) OR c)`;

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
                  SqlRef {
                    "columnRefName": RefName {
                      "name": "b",
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
              "op": "+",
              "parens": Array [
                Object {
                  "leftSpacing": "",
                  "rightSpacing": "",
                },
              ],
              "spacing": Object {},
              "type": "multi",
            },
            SqlRef {
              "columnRefName": RefName {
                "name": "c",
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
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "spacing": Object {},
        "type": "multi",
      }
    `);

    backAndForth(sql);
  });

  it('Changing order of operations', () => {
    const sql = `NOT NOT (A + b) OR c`;

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
            SqlUnary {
              "argument": SqlUnary {
                "argument": SqlMulti {
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
                      SqlRef {
                        "columnRefName": RefName {
                          "name": "b",
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
                  "op": "+",
                  "parens": Array [
                    Object {
                      "leftSpacing": "",
                      "rightSpacing": "",
                    },
                  ],
                  "spacing": Object {},
                  "type": "multi",
                },
                "keywords": Object {
                  "op": "NOT",
                },
                "op": "NOT",
                "spacing": Object {
                  "postOp": " ",
                },
                "type": "unary",
              },
              "keywords": Object {
                "op": "NOT",
              },
              "op": "NOT",
              "spacing": Object {
                "postOp": " ",
              },
              "type": "unary",
            },
            SqlRef {
              "columnRefName": RefName {
                "name": "c",
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
      }
    `);

    backAndForth(sql);
  });
});

describe('#removeColumnFromAnd', () => {
  it('remove from single expression not AND', () => {
    const sql = `A > 1`;

    expect(String(SqlExpression.parse(sql).removeColumnFromAnd('A'))).toEqual('undefined');
    expect(String(SqlExpression.parse(sql).removeColumnFromAnd('B'))).toEqual('A > 1');
  });

  it('remove from simple AND', () => {
    const sql = `A AND B`;

    expect(String(SqlExpression.parse(sql).removeColumnFromAnd('A'))).toEqual('B');
  });

  it('remove from single expression type multiple', () => {
    const sql = `A AND B AND C`;

    expect(String(SqlExpression.parse(sql).removeColumnFromAnd('A'))).toEqual('B AND C');
  });

  it('remove from more complex AND', () => {
    const sql = `A AND B > 1 AND C`;

    expect(String(SqlExpression.parse(sql).removeColumnFromAnd('C'))).toEqual('A AND B > 1');
  });

  it('remove nested comparison expression', () => {
    const sql = `(A > 1 OR D) AND B AND C`;

    expect(String(SqlExpression.parse(sql).removeColumnFromAnd('A'))).toEqual('B AND C');
  });
});

describe('containsColumn', () => {
  it('nested expression', () => {
    const sql = `A > 1 AND D OR B OR C`;

    expect(SqlExpression.parse(sql).containsColumn('A')).toEqual(true);
  });

  it('nested expression with brackets', () => {
    const sql = `(A + B ) > 1 AND D OR B OR C`;

    expect(SqlExpression.parse(sql).containsColumn('A')).toEqual(true);
  });

  it('nested expression with brackets', () => {
    const sql = `(D + B ) > 1 AND D OR B OR C`;

    expect(SqlExpression.parse(sql).containsColumn('A')).toEqual(false);
  });
});

describe('getSqlRefs', () => {
  it('Only multi expressions', () => {
    const sql = `A > 1 AND D OR B OR C`;

    expect(SqlExpression.parse(sql).getRefs()).toMatchInlineSnapshot(`
      Array [
        SqlRef {
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
        SqlRef {
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
            "name": "C",
            "quotes": false,
          },
          "keywords": Object {},
          "namespaceRefName": undefined,
          "spacing": Object {},
          "tableRefName": undefined,
          "type": "ref",
        },
      ]
    `);
  });

  it('includes unary expressions', () => {
    const sql = `A > 1 AND D OR B OR Not C`;

    expect(SqlExpression.parse(sql).getRefs()).toMatchInlineSnapshot(`
      Array [
        SqlRef {
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
        SqlRef {
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
            "name": "C",
            "quotes": false,
          },
          "keywords": Object {},
          "namespaceRefName": undefined,
          "spacing": Object {},
          "tableRefName": undefined,
          "type": "ref",
        },
      ]
    `);
  });

  it('includes unary expressions and nested Multi Expressions', () => {
    const sql = `A > 1 AND D OR B OR Not (C Or E)`;

    expect(SqlExpression.parse(sql).getRefs()).toMatchInlineSnapshot(`
      Array [
        SqlRef {
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
        SqlRef {
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
            "name": "E",
            "quotes": false,
          },
          "keywords": Object {},
          "namespaceRefName": undefined,
          "spacing": Object {},
          "tableRefName": undefined,
          "type": "ref",
        },
      ]
    `);
  });

  it('Concat function', () => {
    const sql = `A || B || C`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
        "op": "||",
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('IS function', () => {
    const sql = `X IS NULL`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "op": "IS",
        },
        "lhs": SqlRef {
          "columnRefName": RefName {
            "name": "X",
            "quotes": false,
          },
          "keywords": Object {},
          "namespaceRefName": undefined,
          "spacing": Object {},
          "tableRefName": undefined,
          "type": "ref",
        },
        "not": false,
        "op": "IS",
        "rhs": SqlLiteral {
          "keywords": Object {},
          "spacing": Object {},
          "stringValue": "NULL",
          "type": "literal",
          "value": null,
        },
        "spacing": Object {
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  it('IS NOT NULL', () => {
    const sql = `X IS NOT NULL`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "not": "NOT",
          "op": "IS",
        },
        "lhs": SqlRef {
          "columnRefName": RefName {
            "name": "X",
            "quotes": false,
          },
          "keywords": Object {},
          "namespaceRefName": undefined,
          "spacing": Object {},
          "tableRefName": undefined,
          "type": "ref",
        },
        "not": true,
        "op": "IS",
        "rhs": SqlLiteral {
          "keywords": Object {},
          "spacing": Object {},
          "stringValue": "NULL",
          "type": "literal",
          "value": null,
        },
        "spacing": Object {
          "not": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  it('IS NOT TRUE', () => {
    const sql = `X IS NOT TRUE`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlComparison {
        "decorator": undefined,
        "keywords": Object {
          "not": "NOT",
          "op": "IS",
        },
        "lhs": SqlRef {
          "columnRefName": RefName {
            "name": "X",
            "quotes": false,
          },
          "keywords": Object {},
          "namespaceRefName": undefined,
          "spacing": Object {},
          "tableRefName": undefined,
          "type": "ref",
        },
        "not": true,
        "op": "IS",
        "rhs": SqlLiteral {
          "keywords": Object {},
          "spacing": Object {},
          "stringValue": "TRUE",
          "type": "literal",
          "value": true,
        },
        "spacing": Object {
          "not": " ",
          "postOp": " ",
          "preOp": " ",
        },
        "type": "comparison",
      }
    `);
  });

  it('Nested IS Not function', () => {
    const sql = `X IS NOT NULL AND X <> ''`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
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
              "decorator": undefined,
              "keywords": Object {
                "not": "NOT",
                "op": "IS",
              },
              "lhs": SqlRef {
                "columnRefName": RefName {
                  "name": "X",
                  "quotes": false,
                },
                "keywords": Object {},
                "namespaceRefName": undefined,
                "spacing": Object {},
                "tableRefName": undefined,
                "type": "ref",
              },
              "not": true,
              "op": "IS",
              "rhs": SqlLiteral {
                "keywords": Object {},
                "spacing": Object {},
                "stringValue": "NULL",
                "type": "literal",
                "value": null,
              },
              "spacing": Object {
                "not": " ",
                "postOp": " ",
                "preOp": " ",
              },
              "type": "comparison",
            },
            SqlComparison {
              "decorator": undefined,
              "keywords": Object {
                "op": "<>",
              },
              "lhs": SqlRef {
                "columnRefName": RefName {
                  "name": "X",
                  "quotes": false,
                },
                "keywords": Object {},
                "namespaceRefName": undefined,
                "spacing": Object {},
                "tableRefName": undefined,
                "type": "ref",
              },
              "not": false,
              "op": "<>",
              "rhs": SqlLiteral {
                "keywords": Object {},
                "spacing": Object {},
                "stringValue": "''",
                "type": "literal",
                "value": "",
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
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });
});
